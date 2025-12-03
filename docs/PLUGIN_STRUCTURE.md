# OpenFields Plugin Structure

## Overview

OpenFields is a modern custom fields builder for WordPress. It provides an alternative to ACF (Advanced Custom Fields) with a React-based admin interface and REST API.

The plugin consists of two main parts:
1. **Backend Plugin** (`/plugin`) - WordPress PHP plugin that handles field storage, REST API, meta box registration
2. **Frontend Admin** (`/admin`) - React/TypeScript SPA for managing fieldsets and fields

## Directory Structure

### `/plugin` - WordPress Plugin

```
plugin/
├── openfields.php                 # Plugin entry point & initialization
├── includes/
│   ├── class-openfields.php       # Main plugin class
│   ├── class-openfields-assets.php         # Script/style enqueueing
│   ├── class-openfields-rest-api.php       # REST API endpoints
│   ├── class-openfields-installer.php      # Installation & db setup
│   ├── admin/
│   │   ├── class-openfields-admin.php           # Admin page handler
│   │   └── class-openfields-meta-box.php        # Meta box registration & rendering
│   ├── api/
│   │   └── functions.php               # Public API functions for developers
│   ├── fields/
│   │   ├── class-openfields-field-registry.php  # Field type registry
│   │   └── class-openfields-base-field.php      # Base field class
│   ├── locations/
│   │   └── class-openfields-location-manager.php # Location rule matching
│   └── storage/
│       └── class-openfields-storage-manager.php  # Meta storage abstraction
├── assets/
│   └── admin/
│       ├── css/
│       │   └── admin.css          # Admin page styles
│       └── js/
│           └── admin.js           # Admin page JS (entrypoint for React app)
└── languages/
    └── openfields.pot             # i18n translation template
```

### `/admin` - React Admin Interface

```
admin/
├── src/
│   ├── main.tsx                # Entry point
│   ├── App.tsx                 # Root component
│   ├── api/
│   │   └── index.ts            # REST API client
│   ├── types/
│   │   ├── index.ts            # Core type definitions
│   │   └── fields.ts           # Field type schemas
│   ├── components/
│   │   └── ui/                 # Shadcn UI components
│   ├── fields/
│   │   ├── index.ts            # Field registry
│   │   ├── TextFieldSettings.tsx        # Text field config UI
│   │   ├── SelectFieldSettings.tsx      # Select field config UI
│   │   ├── TextareaFieldSettings.tsx    # Textarea field config UI
│   │   ├── NumberFieldSettings.tsx      # Number field config UI
│   │   └── SwitchFieldSettings.tsx      # Switch field config UI
│   ├── pages/
│   │   ├── FieldsetList.tsx    # Main fieldset list page
│   │   ├── Tools.tsx           # Tools page
│   │   └── FieldsetEditor/
│   │       ├── index.tsx       # Fieldset editor page
│   │       └── components/
│   │           ├── FieldsSection.tsx     # Fields management
│   │           ├── LocationsSection.tsx  # Location rules editor
│   │           ├── SettingsSection.tsx   # Fieldset settings
│   │           └── TypeSpecificSettings.tsx # Field-type specific settings
│   ├── stores/
│   │   ├── fieldset-store.ts   # Zustand store for fieldsets & fields
│   │   ├── ui-store.ts         # UI state (toasts, modals)
│   │   └── index.ts            # Store exports
│   ├── lib/
│   │   ├── field-registry.ts   # Field type definitions & metadata
│   │   └── utils.ts            # Utility functions
│   └── styles/
│       └── main.css            # Global styles

├── vite.config.ts              # Vite build config
├── tsconfig.json               # TypeScript config
└── package.json                # Dependencies
```

## Data Flow

### Creating a Fieldset

1. **Frontend** → User fills fieldset form in React UI
2. **API Client** → Sends POST to `/wp-json/openfields/v1/fieldsets`
3. **Backend** → `OpenFields_REST_API::create_fieldset()`
   - Validates input
   - Creates `wp_openfields_fieldsets` row
   - Returns created fieldset with ID
4. **Store** → Updates Zustand store with new fieldset
5. **UI** → Redirects to edit page for new fieldset

### Updating a Fieldset with Location Rules

1. **Frontend** → User configures location rules in LocationsSection
   ```typescript
   location_groups = [
     { id: '1', rules: [{ type: 'post_type', operator: '==', value: 'page' }] }
   ]
   ```
2. **API** → Sends PUT with `settings: { location_groups: [...] }`
3. **Backend** → `OpenFields_REST_API::update_fieldset()`
   - Extracts `location_groups` from settings
   - Calls `save_location_groups()` to persist to database
   - Converts frontend format to DB format:
     ```
     Database: { fieldset_id, param, operator, value, group_id }
     Frontend: { id, rules: [{ type, operator, value }] }
     ```
4. **Location Manager** → Stores individual rows in `wp_openfields_locations` table

### Displaying Meta Boxes on Post/Page Edit

1. **WordPress** → Fires `add_meta_boxes` action
2. **Meta Box Class** → `OpenFields_Meta_Box::register_meta_boxes()`
   - Gathers context: post_type, post_id, page_template, categories, format
   - Calls `OpenFields_Location_Manager::get_fieldsets_for_context()`
3. **Location Manager** → Matches fieldsets:
   - Queries `wp_openfields_fieldsets` WHERE `status = 'active'`
   - For each fieldset, fetches location rules from `wp_openfields_locations`
   - Converts DB rows to grouped rules format
   - Calls `match()` to check if rules match context
4. **Meta Box Class** → For matched fieldsets:
   - Calls `add_meta_box()` to register meta box
   - Renders field HTML in `render_meta_box()`
5. **Gutenberg Block Editor** → Shows meta boxes below content
6. **Classic Editor** → Shows meta boxes in sidebar

### Saving Field Values from Post Edit

1. **WordPress** → Fires `save_post` hook
2. **Meta Box Class** → `OpenFields_Meta_Box::save_post()`
   - Iterates over POSTed field data
   - Calls `update_field()` for each field
3. **Storage Manager** → `update_field()` 
   - Stores value in appropriate meta table:
     - Posts: `wp_postmeta` (key: `of_FIELDNAME`)
     - Users: `wp_usermeta`
     - Terms: `wp_termmeta`
4. **WordPress** → Meta value persisted

## Database Schema

### `wp_openfields_fieldsets`

```sql
CREATE TABLE wp_openfields_fieldsets (
  id INT PRIMARY KEY AUTO_INCREMENT,
  title VARCHAR(255),
  field_key VARCHAR(255) UNIQUE,
  description LONGTEXT,
  status VARCHAR(20) DEFAULT 'active', -- 'active' or 'inactive'
  custom_css LONGTEXT,
  settings LONGTEXT, -- JSON: { location_groups: [...], position: 'normal', priority: 'high' }
  menu_order INT DEFAULT 0,
  created_at DATETIME,
  updated_at DATETIME
);
```

### `wp_openfields_fields`

```sql
CREATE TABLE wp_openfields_fields (
  id INT PRIMARY KEY AUTO_INCREMENT,
  fieldset_id INT,
  label VARCHAR(255),
  name VARCHAR(255),
  type VARCHAR(50), -- 'text', 'email', 'textarea', 'number', 'select', etc.
  settings LONGTEXT, -- JSON field settings
  menu_order INT DEFAULT 0,
  created_at DATETIME,
  updated_at DATETIME,
  FOREIGN KEY (fieldset_id) REFERENCES wp_openfields_fieldsets(id)
);
```

### `wp_openfields_locations`

```sql
CREATE TABLE wp_openfields_locations (
  id INT PRIMARY KEY AUTO_INCREMENT,
  fieldset_id INT,
  param VARCHAR(50), -- 'post_type', 'page_template', 'taxonomy', 'user_role', etc.
  operator VARCHAR(10), -- '==' or '!='
  value VARCHAR(255),
  group_id INT DEFAULT 0, -- Groups rules with OR logic; rules in same group are AND
  FOREIGN KEY (fieldset_id) REFERENCES wp_openfields_fieldsets(id)
);
```

## REST API Endpoints

All endpoints require `manage_options` capability (admin access).

### Fieldsets

- `GET /wp-json/openfields/v1/fieldsets` - List all fieldsets
- `POST /wp-json/openfields/v1/fieldsets` - Create fieldset
- `GET /wp-json/openfields/v1/fieldsets/{id}` - Get single fieldset
- `PUT /wp-json/openfields/v1/fieldsets/{id}` - Update fieldset
- `DELETE /wp-json/openfields/v1/fieldsets/{id}` - Delete fieldset
- `POST /wp-json/openfields/v1/fieldsets/{id}/duplicate` - Duplicate fieldset

### Fields

- `GET /wp-json/openfields/v1/fieldsets/{fieldset_id}/fields` - List fields for fieldset
- `POST /wp-json/openfields/v1/fieldsets/{fieldset_id}/fields` - Create field
- `PUT /wp-json/openfields/v1/fields/{id}` - Update field
- `DELETE /wp-json/openfields/v1/fields/{id}` - Delete field

### Other

- `GET /wp-json/openfields/v1/field-types` - Get available field types
- `GET /wp-json/openfields/v1/locations/types` - Get location type options
- `GET /wp-json/openfields/v1/debug/locations` - Debug endpoint (returns all fieldsets & locations)

## Key Classes & Their Responsibilities

### Backend

| Class | File | Responsibility |
|-------|------|-----------------|
| `OpenFields_Plugin` | `class-openfields.php` | Main plugin initialization & hooks |
| `OpenFields_REST_API` | `class-openfields-rest-api.php` | REST API route registration & handlers |
| `OpenFields_Meta_Box` | `class-openfields-meta-box.php` | Meta box registration & rendering |
| `OpenFields_Location_Manager` | `class-openfields-location-manager.php` | Location rule matching logic |
| `OpenFields_Storage_Manager` | `class-openfields-storage-manager.php` | Meta value persistence |
| `OpenFields_Field_Registry` | `class-openfields-field-registry.php` | Field type registration |
| `OpenFields_Assets` | `class-openfields-assets.php` | Script & style enqueueing |
| `OpenFields_Admin` | `class-openfields-admin.php` | Admin page menu & routing |

### Frontend

| Module | File | Responsibility |
|--------|------|-----------------|
| `useFieldsetStore` | `stores/fieldset-store.ts` | Zustand store: fieldsets, fields, pending changes |
| `useUIStore` | `stores/ui-store.ts` | Toast notifications & modal state |
| `fieldsetApi` | `api/index.ts` | REST client for all endpoints |
| `FieldsetEditor` | `pages/FieldsetEditor/index.tsx` | Main editor page layout |
| `LocationsSection` | Components section | Location rule builder UI |
| `FieldsSection` | Components section | Field list & drag-to-reorder |
| Field Settings | `fields/*.tsx` | Type-specific configuration UIs |

## Type System

### Frontend Types (TypeScript)

```typescript
// Core types in /admin/src/types/index.ts
interface Fieldset {
  id: number;
  title: string;
  field_key: string;
  description: string;
  is_active: boolean;
  settings: {
    location_groups: LocationGroup[];
    position?: 'normal' | 'side';
    priority?: 'high' | 'low';
  };
}

interface Field {
  id: string | number;
  label: string;
  name: string;
  type: FieldType;
  settings: Record<string, any>;
}

interface LocationGroup {
  id: string;
  rules: LocationRule[];
}

interface LocationRule {
  type: string; // 'post_type', 'page_template', 'taxonomy', etc.
  operator: '==' | '!=';
  value: string;
}

type FieldType = 'text' | 'email' | 'textarea' | 'number' | 'select' | 'switch' | ...;
```

## Extension Points

### Adding a Custom Field Type

1. **Backend**: Create field class extending `OpenFields_Base_Field`
2. **Frontend**: 
   - Add type to `FieldType` enum in types
   - Create settings component in `fields/`
   - Register in `lib/field-registry.ts`
   - Export from `fields/index.ts`
3. Update `OpenFields_Field_Registry::get_field_types()`

### Custom Location Type

1. Register in `OpenFields_Location_Manager::register_location_type()`
2. Implement matching callback
3. Implement options callback (for UI dropdowns)
4. Add to location type options in admin

### Custom Meta Storage Context

Extend `OpenFields_Storage_Manager` to support:
- Custom post types
- Custom meta contexts beyond posts/users/terms
- Custom meta key prefixes

## Configuration & Constants

- `OPENFIELDS_VERSION` - Plugin version
- `OPENFIELDS_PLUGIN_FILE` - Plugin main file path
- `OPENFIELDS_PLUGIN_DIR` - Plugin directory
- `OPENFIELDS_PLUGIN_URL` - Plugin URL
- `OPENFIELDS_PLUGIN_BASENAME` - Plugin basename

Meta key prefix: `of_` (e.g., field `name` stored as `of_name`)

## Build & Development

### Building Admin React App

```bash
cd admin
npm install
npm run build        # Production build
npm run dev          # Development with HMR
```

### Local Development with wp-env

```bash
npm run wp-env start  # Start Docker containers
npm run wp-env stop   # Stop containers

# Run CLI commands
npm run wp-env run cli wp db query "SELECT ..."
```

## Performance Considerations

1. **Fieldset Caching**: Consider caching active fieldsets (currently re-queried per page load)
2. **Location Matching**: Could be optimized with fieldset → post_type index
3. **Meta Box Rendering**: Large numbers of fields benefit from pagination in UI
4. **REST API**: Add pagination for field lists when > 100 fields

## Security

- All REST endpoints require `manage_options` capability
- Input sanitization via `sanitize_*` functions
- Output escaping via `esc_*` functions
- Nonce verification for meta box saves
- WPNONCE validation for REST requests

