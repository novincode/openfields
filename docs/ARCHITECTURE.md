# OpenFields Architecture Overview

Quick reference for understanding the codebase. Last updated: December 2024.

---

## Database Schema

### `wp_openfields_fieldsets`
| Column | Type | Notes |
|--------|------|-------|
| id | bigint | Primary key |
| title | varchar | Display name |
| field_key | varchar | Unique slug |
| description | text | Optional |
| **status** | varchar | `'active'` or `'inactive'` |
| settings | longtext | JSON: `{ position, priority }` |
| menu_order | int | Sort order |

### `wp_openfields_fields`
| Column | Type | Notes |
|--------|------|-------|
| id | bigint | Primary key |
| fieldset_id | bigint | FK to fieldsets |
| parent_id | bigint | For repeater sub-fields |
| label | varchar | Display name |
| name | varchar | Meta key (no prefix stored) |
| type | varchar | text, select, switch, etc. |
| **field_config** | longtext | JSON: type-specific settings |
| **wrapper_config** | longtext | JSON: `{ width, class, id }` |
| **conditional_logic** | longtext | JSON: `[[{field, operator, value}]]` |
| menu_order | int | Sort order |

### `wp_openfields_locations`
| Column | Type | Notes |
|--------|------|-------|
| id | bigint | Primary key |
| fieldset_id | bigint | FK to fieldsets |
| param | varchar | post_type, taxonomy, user_role |
| operator | varchar | `==` or `!=` |
| value | varchar | The value to match |
| group_id | int | Same group = AND, diff group = OR |

---

## Meta Storage

**META_PREFIX = `''` (empty)**

Fields save directly to meta tables without prefix:
- Posts: `wp_postmeta` → `field_name` (not `of_field_name`)
- Terms: `wp_termmeta` → `field_name`
- Users: `wp_usermeta` → `field_name`

This provides ACF compatibility for migrations.

---

## Key PHP Classes

### `OpenFields_Meta_Box` (`class-openfields-meta-box.php`)
Renders fields on:
- **Posts/Pages**: `add_meta_boxes` hook
- **Taxonomy Terms**: `{taxonomy}_add_form_fields`, `{taxonomy}_edit_form_fields` hooks
- **Users**: `show_user_profile`, `edit_user_profile`, `user_new_form` hooks

Key methods:
- `render_meta_box($post, $meta_box)` - Post edit screen
- `render_taxonomy_add_fields($taxonomy)` - Term add form
- `render_taxonomy_edit_fields($term, $taxonomy)` - Term edit form  
- `render_user_fields($user)` - User profile
- `render_input($field, $value, ...)` - Field type switch

### `OpenFields_Location_Manager` (`class-openfields-location-manager.php`)
Determines which fieldsets show where.

Key methods:
- `get_fieldsets_for_context($context)` - Returns matching fieldsets
- `match($location_rules, $context)` - Evaluates rules
- `match_post_type()`, `match_taxonomy()`, `match_user_role()` - Individual matchers

Context structure:
```php
$context = [
    'post_type' => 'page',
    'taxonomy' => 'category',  // For term screens
    'user_roles' => ['administrator'],  // For user screens
];
```

### `OpenFields_REST_API` (`class-openfields-rest-api.php`)
All admin CRUD operations via REST.

Endpoints:
- `GET/POST /fieldsets` - List/create
- `GET/PUT/DELETE /fieldsets/{id}` - Single fieldset
- `GET/POST /fieldsets/{id}/fields` - Fields for fieldset
- `PUT/DELETE /fields/{id}` - Single field

---

## Frontend Architecture

### State Management (Zustand)
```
stores/
├── fieldset-store.ts    # Fieldsets, fields, pending changes
└── ui-store.ts          # Toasts, modals
```

**Key pattern**: Local staging before save
- `addFieldLocal()` - Stage new field
- `updateFieldLocal()` - Stage changes
- `deleteFieldLocal()` - Stage deletion
- `saveAllChanges()` - Batch API call

### Field Registry (`lib/field-registry.ts`)
Defines available field types with:
- `type` - Unique identifier
- `label` - Display name
- `category` - For grouping in selector
- `hasSubFields` - For repeater/group types
- `SettingsComponent` - React component for config

### Field Settings (`fields/*.tsx`)
Each field type has a settings component:
- `TextFieldSettings.tsx`
- `SelectFieldSettings.tsx`
- `SwitchFieldSettings.tsx`
- etc.

---

## Conditional Logic

### Data Structure
```typescript
// Outer array = OR groups
// Inner array = AND rules within group
[
  [{ field: "field_1", operator: "==", value: "yes" }],  // Group 1
  [{ field: "field_2", operator: "!=", value: "" }]      // OR Group 2
]
```

### Operators
- `==` - Equals
- `!=` - Not equals
- `contains` - String contains
- `empty` - Is empty/falsy
- `not_empty` - Has value

### JavaScript Evaluation (`fields.js`)
- `initConditionalLogic()` - Setup listeners
- `evaluateAllConditions()` - Check all fields
- `evaluateRuleGroup(rules)` - Single group (AND)
- `compareValues(current, operator, expected)` - Single comparison

---

## File Structure

```
plugin/
├── openfields.php              # Entry point
├── includes/
│   ├── admin/
│   │   ├── class-openfields-meta-box.php      # Field rendering
│   │   └── field-renderers/                   # Complex field types
│   │       ├── repeater.php
│   │       ├── image.php
│   │       ├── gallery.php
│   │       └── ...
│   ├── locations/
│   │   └── class-openfields-location-manager.php
│   └── class-openfields-rest-api.php
└── assets/admin/
    ├── css/fields.css          # Field styling
    └── js/fields.js            # Field interactions

admin/
├── src/
│   ├── pages/
│   │   ├── FieldsetList.tsx
│   │   └── FieldsetEditor/
│   │       └── components/
│   │           ├── FieldItem.tsx
│   │           ├── LocationsSection.tsx
│   │           └── ConditionalLogicPanel.tsx
│   ├── stores/
│   │   └── fieldset-store.ts
│   ├── fields/                 # Field settings components
│   └── lib/
│       └── field-registry.ts
└── package.json
```

---

## Common Gotchas

1. **Database column names**: Use `status = 'active'`, not `is_active = 1`
2. **Field order column**: Use `menu_order`, not `sort_order`
3. **Meta prefix**: Empty string - fields save directly as `field_name`
4. **Conditional logic structure**: `[[rules]]` - outer OR, inner AND
5. **Field selectors in JS**: Use `field_name`, not `openfields_field_name`

---

## Testing Locations

| Location Type | Where to Test |
|---------------|---------------|
| `post_type == post` | Posts → Add New |
| `post_type == page` | Pages → Add New |
| `taxonomy == category` | Posts → Categories → Add/Edit |
| `taxonomy == post_tag` | Posts → Tags → Add/Edit |
| `user_role == administrator` | Users → Your Profile |
