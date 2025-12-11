# OpenFields Developer Guide

Welcome to OpenFields! This guide covers everything you need to know to contribute, extend, or understand the system.

**📖 See Also:** [Documentation Index](./INDEX.md) | [Architecture](./ARCHITECTURE.md) | [Build Process](./BUILD.md) | [Admin System](./ADMIN_SYSTEM.md)

## Quick Links

- [Plugin Structure](./PLUGIN_STRUCTURE.md) - Architecture, database schema, API endpoints
- [Admin System](./ADMIN_SYSTEM.md) - React UI, state management, field type system
- [Architecture](./ARCHITECTURE.md) - System design and database schema
- [Build System](./BUILD.md) - Building and releasing the plugin
- [Vision & Roadmap](./VISION.md) - Project goals and current status

## Getting Started

### Prerequisites

- Node.js 16+ & npm/pnpm
- Docker (for wp-env local development)
- WordPress 6.0+
- PHP 7.4+

### Local Development Setup

```bash
# Clone repository
git clone https://github.com/novincode/openfields.git
cd openfields

# Start WordPress environment
npm run wp-env start

# In separate terminal: Watch for admin build changes
cd admin
npm install
npm run dev

# In another terminal: Trigger admin build
cd admin
npm run build
```

**Access**:
- WordPress: http://localhost:8888
- WP Admin: http://localhost:8888/wp-admin
- OpenFields: http://localhost:8888/wp-admin?page=openfields

### Plugin Activation

1. Go to Plugins page in WordPress admin
2. Find "OpenFields" in plugin list
3. Click Activate
4. Visit Tools → OpenFields to start

## Understanding the System

### The Three Layers

```
┌─────────────────────────────────────────┐
│   WordPress Posts/Pages (Frontend)      │
│   - Display field values to site users  │
│   - Load from postmeta (of_ prefix)     │
└─────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────┐
│   WordPress Admin - Meta Boxes           │
│   - User fills in field values on edit  │
│   - Saved to postmeta on save_post      │
└─────────────────────────────────────────┘
                    ↕
┌─────────────────────────────────────────┐
│   OpenFields Admin Interface (React)    │
│   - Create fieldsets & fields           │
│   - Configure location rules            │
│   - Manage field-specific settings      │
│   - All changes sent via REST API       │
└─────────────────────────────────────────┘
```

### How Location Matching Works

When user edits a page in WordPress:

```
POST edit screen loaded
    ↓
add_meta_boxes action fires
    ↓
OpenFields_Meta_Box::register_meta_boxes()
    ↓
Get context: { post_type: 'page', post_id: 5, page_template: 'default', ... }
    ↓
OpenFields_Location_Manager::get_fieldsets_for_context()
    ↓
Query all active fieldsets
    ↓
For each fieldset, check: Do location rules match context?
    ↓
Rule matching example:
  Rule: post_type == 'page' AND page_template == 'default'
  Context: { post_type: 'page', page_template: 'default' }
  Result: ✓ MATCH - show meta box
    ↓
add_meta_box() registers matched fieldsets
    ↓
Gutenberg/Classic Editor displays meta boxes
```

### Field Settings Flow

When user configures a field:

```
Frontend: User enters field settings in FieldsetEditor
    ↓
Store: updateFieldLocal() stages changes in pendingFieldChanges Map
    ↓
User clicks Save Changes button
    ↓
saveAllChanges() batch operation:
  - DELETE fields in pendingFieldDeletions
  - POST new fields in pendingFieldAdditions
  - PUT modified fields in pendingFieldChanges
    ↓
API: All requests sent to REST endpoints
    ↓
Backend: Updates wp_openfields_fields table
    ↓
Store: Clears pending changes, marks as saved
    ↓
UI: Toast notification "Saved successfully"
```

## Common Tasks

### Adding a New Field Type

**Step 1: Backend - Register Field Type**

```php
// In OpenFields_Field_Registry class
public function get_field_types() {
    return array(
        // ... existing types
        'my_field' => array(
            'label'       => 'My Custom Field',
            'icon'        => 'icon-name',
            'description' => 'Description of field',
            'category'    => 'advanced',
        ),
    );
}
```

**Step 2: Frontend - Create Settings Component**

```typescript
// admin/src/fields/MyFieldSettings.tsx
import { Field } from '../types';

interface MyFieldSettingsProps {
  field: Field;
  onUpdate: (field: Partial<Field>) => void;
}

export function MyFieldSettings({ field, onUpdate }: MyFieldSettingsProps) {
  const settings = field.settings || {};
  
  const handleChange = (key: string, value: any) => {
    onUpdate({
      ...field,
      settings: { ...settings, [key]: value }
    });
  };

  return (
    <div>
      <label>
        <input
          type="checkbox"
          checked={settings.my_option || false}
          onChange={(e) => handleChange('my_option', e.target.checked)}
        />
        Enable my option
      </label>
    </div>
  );
}
```

**Step 3: Frontend - Register in Registry**

```typescript
// admin/src/fields/index.ts
import { MyFieldSettings } from './MyFieldSettings';

export const fieldSettingsRegistry = {
  // ... existing types
  my_field: MyFieldSettings,
};
```

**Step 4: Backend - Render in Meta Box**

```php
// In OpenFields_Meta_Box::render_field_input()
case 'my_field':
    // Render your custom HTML
    echo '<input type="text" name="' . esc_attr($field_name) . '" value="' . esc_attr($value) . '" />';
    break;
```

### Adding a New Location Type

**Step 1: Register Location Type**

```php
// In OpenFields_Location_Manager::__construct()
$this->register_location_type(
    'my_location',
    array(
        'label'    => __('My Location Type', 'openfields'),
        'callback' => array($this, 'match_my_location'),
        'options'  => array($this, 'get_my_location_options'),
    )
);
```

**Step 2: Implement Matcher Callback**

```php
public function match_my_location($value, $operator, $context) {
    $current = $context['my_field'] ?? '';
    return $this->compare($current, $value, $operator);
}
```

**Step 3: Implement Options Callback**

```php
public function get_my_location_options() {
    return array(
        array('name' => 'value1', 'label' => 'Value 1'),
        array('name' => 'value2', 'label' => 'Value 2'),
    );
}
```

**Step 4: Update Context in Meta Box**

```php
// In OpenFields_Meta_Box::register_meta_boxes()
$context = array(
    'post_type'     => $post_type,
    'post_id'       => $post->ID,
    'my_field'      => get_my_field_value(), // Add your field
    // ... existing fields
);
```

### Debugging

**Enable WordPress Debug Mode**

```php
// wp-config.php
define('WP_DEBUG', true);
define('WP_DEBUG_LOG', true);
define('WP_DEBUG_DISPLAY', false);
```

**Check Debug Log**

```bash
cd openfields
npm run wp-env run cli tail -f /var/www/html/wp-content/debug.log
```

**Database Queries**

```bash
# List all fieldsets
npm run wp-env run cli wp db query "SELECT * FROM wp_openfields_fieldsets"

# List all fields for fieldset 2
npm run wp-env run cli wp db query "SELECT * FROM wp_openfields_fields WHERE fieldset_id = 2"

# List all location rules for fieldset 2
npm run wp-env run cli wp db query "SELECT * FROM wp_openfields_locations WHERE fieldset_id = 2"
```

**React DevTools**

Install React DevTools Chrome extension. Then in browser:
- Open DevTools (F12)
- Go to "React" tab
- Inspect components in real-time
- Check Zustand store state

**API Debugging**

Use REST API debug endpoint:

```bash
# Get all fieldsets and locations
curl http://localhost:8888/wp-json/openfields/v1/debug/locations
```

Or visit directly: http://localhost:8888/wp-json/openfields/v1/debug/locations

## Testing Workflow

### Creating a Test Fieldset

1. **Via Admin UI**:
   - Click "New Fieldset"
   - Enter title & description
   - Add fields (text, email, textarea, etc.)
   - Configure location rules
   - Click "Save Changes"

2. **Via CLI** (for quick iteration):
   ```bash
   # Create fieldset
   npm run wp-env run cli wp openfields fieldset create \
     --title="Test" \
     --description="Test fieldset"
   
   # Add field
   npm run wp-env run cli wp openfields field create \
     --fieldset-id=1 \
     --label="Test Field" \
     --type="text"
   ```

### Testing Location Matching

1. Create fieldset with location rule: `post_type == page`
2. Go to Pages → Add New
3. Scroll down → Should see meta box
4. Go to Posts → Add New
5. Scroll down → Should NOT see meta box

### Testing Field Value Persistence

1. Add a page with the fieldset
2. Fill in field values
3. Click "Publish" or "Save"
4. Reload page
5. Verify field values are still filled
6. Check postmeta: `wp_postmeta` table should have `of_FIELDNAME` entries

## Architecture Decisions

### Why Zustand?

- Lightweight (1KB)
- No boilerplate like Redux
- Good TypeScript support
- Good for staging changes locally

### Why Tailwind + Shadcn?

- Rapidly build UI
- Consistent design
- Accessible components (Radix under hood)
- Easy to customize

### Why REST API Only?

- WordPress native
- Works with existing tools
- Easy to debug (just HTTP)
- Stateless

### Why Stage Changes Locally?

- Better UX - undo possible until save
- Batch operations - single HTTP request
- Atomic saves - all or nothing
- Reduced API load

## Performance Tips

1. **Use selectors in components**:
   ```typescript
   const fieldsets = useFieldsetStore((state) => state.fieldsets);
   // NOT: const store = useFieldsetStore(); store.fieldsets
   ```
   This prevents re-renders when other store values change.

2. **Memoize callbacks**:
   ```typescript
   const handleSave = useCallback(() => { /* ... */ }, [dependencies]);
   ```

3. **Lazy load pages**:
   ```typescript
   const FieldsetEditor = lazy(() => import('./FieldsetEditor'));
   ```

4. **Cache location options**:
   Currently fetched every time, could be cached with TTL.

## Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

IE11 not supported (uses ES2020+, optional chaining, nullish coalescing).

## Code Style

### PHP

- WordPress Coding Standards
- 4-space indentation
- DocBlocks on all functions/classes
- Use `error_log()` for debugging

### TypeScript/React

- ESLint config in place
- Prettier formatting
- 2-space indentation
- Strict mode enabled
- No `any` types when possible

## Git Workflow

```bash
# Create feature branch
git checkout -b feature/field-type-xyz

# Make changes, commit frequently
git commit -m "Add XYZ field type"

# Push and create PR
git push origin feature/field-type-xyz

# PR triggers CI checks:
# - ESLint
# - TypeScript
# - Build verification
```

## Release Checklist

- [ ] Update `OPENFIELDS_VERSION` in `openfields.php`
- [ ] Update `version` in `admin/package.json`
- [ ] Run `npm run build` in admin folder
- [ ] Test all field types
- [ ] Test location matching
- [ ] Test on both Gutenberg and Classic Editor
- [ ] Update CHANGELOG.md
- [ ] Create git tag: `git tag v0.2.0`
- [ ] Push tag: `git push origin v0.2.0`

## Useful Resources

- [WordPress Plugin Dev Handbook](https://developer.wordpress.org/plugins/)
- [REST API Handbook](https://developer.wordpress.org/rest-api/)
- [WordPress Coding Standards](https://developer.wordpress.org/coding-standards/)
- [React Docs](https://react.dev)
- [TypeScript Docs](https://www.typescriptlang.org/docs/)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [Tailwind Docs](https://tailwindcss.com/docs)

## Getting Help

- Check existing issues on GitHub
- Review test fieldsets in `/docs/examples`
- Look at existing field types for patterns
- Check debug.log for errors
- Ask in discussions or open an issue

## Contributing

1. Fork the repository
2. Create feature branch
3. Make changes with tests
4. Submit PR with description
5. Address review feedback
6. Merge when approved

See CONTRIBUTING.md for detailed guidelines.

