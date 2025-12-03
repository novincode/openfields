# OpenFields Quick Reference

## API Endpoints Quick Reference

All require `manage_options` capability.

### Fieldsets
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/fieldsets` | List all fieldsets |
| POST | `/fieldsets` | Create fieldset |
| GET | `/fieldsets/{id}` | Get single fieldset |
| PUT | `/fieldsets/{id}` | Update fieldset |
| DELETE | `/fieldsets/{id}` | Delete fieldset |
| POST | `/fieldsets/{id}/duplicate` | Duplicate fieldset |

### Fields
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/fieldsets/{fid}/fields` | List fieldset's fields |
| POST | `/fieldsets/{fid}/fields` | Create field |
| PUT | `/fields/{id}` | Update field |
| DELETE | `/fields/{id}` | Delete field |

### Other
| Method | Endpoint | Purpose |
|--------|----------|---------|
| GET | `/field-types` | Get available field types |
| GET | `/locations/types` | Get location type options |
| GET | `/debug/locations` | Debug: all fieldsets & locations |

## Database Tables

### `wp_openfields_fieldsets`
Main fieldset data. Key columns:
- `id` - Primary key
- `title` - Fieldset name
- `field_key` - Unique slug
- `status` - 'active' or 'inactive'
- `settings` - JSON: `{ location_groups: [...], position: 'normal', priority: 'high' }`

### `wp_openfields_fields`
Field definitions. Key columns:
- `id` - Primary key
- `fieldset_id` - Foreign key to fieldsets
- `label` - Display name
- `name` - Field key (used in postmeta as `of_{name}`)
- `type` - Field type (text, email, textarea, etc.)
- `settings` - JSON: type-specific settings
- `menu_order` - Display order (0-based)

### `wp_openfields_locations`
Location matching rules. Format:
- `fieldset_id` - Which fieldset
- `param` - Rule type (post_type, page_template, etc.)
- `operator` - '==' or '!='
- `value` - The value to match
- `group_id` - For OR grouping (same group = AND logic)

**Example**: Show on (page AND default template) OR (post)
```
fieldset_id=1, param=post_type, operator===, value=page, group_id=0
fieldset_id=1, param=page_template, operator===, value=default, group_id=0
fieldset_id=1, param=post_type, operator===, value=post, group_id=1
```

## Frontend Data Structures

### LocationGroup (sent to API)
```typescript
{
  id: string;              // Unique ID for UI
  rules: [
    {
      type: 'post_type' | 'page_template' | ...;
      operator: '==' | '!=';
      value: 'page' | 'default' | ...;
    }
  ];
}
```

### Fieldset (API response)
```typescript
{
  id: number;
  title: string;
  field_key: string;
  description: string;
  is_active: boolean;
  settings: {
    location_groups: LocationGroup[];
    position?: 'normal' | 'side';
    priority?: 'high' | 'default' | 'low';
  };
}
```

### Field (API response)
```typescript
{
  id: number;
  label: string;
  name: string;
  type: 'text' | 'email' | 'textarea' | 'number' | 'select' | ...;
  settings: {
    placeholder?: string;
    default_value?: any;
    instructions?: string;
    required?: boolean;
    conditional_logic?: any;
    wrapper?: any;
    // ... type-specific settings
  };
}
```

## Common Queries

### Get all fieldsets with field count
```sql
SELECT fs.*, COUNT(f.id) as field_count
FROM wp_openfields_fieldsets fs
LEFT JOIN wp_openfields_fields f ON f.fieldset_id = fs.id
WHERE fs.status = 'active'
GROUP BY fs.id;
```

### Get location rules for fieldset
```sql
SELECT * FROM wp_openfields_locations WHERE fieldset_id = :id ORDER BY group_id;
```

### Get values saved for a post
```sql
SELECT * FROM wp_postmeta WHERE post_id = :post_id AND meta_key LIKE 'of_%';
```

### Delete all data (for testing)
```sql
DELETE FROM wp_openfields_locations;
DELETE FROM wp_openfields_fields;
DELETE FROM wp_openfields_fieldsets;
```

## Development Shortcuts

### CLI Commands
```bash
# Start environment
npm run wp-env start

# Stop environment
npm run wp-env stop

# View logs
npm run wp-env run cli cat /var/www/html/wp-content/debug.log

# Run database query
npm run wp-env run cli wp db query "SELECT * FROM wp_openfields_fieldsets"

# Clear debug.log
npm run wp-env run cli rm /var/www/html/wp-content/debug.log
```

### Admin URLs
```
WordPress:     http://localhost:8888
WP Admin:      http://localhost:8888/wp-admin
OpenFields:    http://localhost:8888/wp-admin?page=openfields
```

### Rest API Testing
```bash
# Get all fieldsets (requires auth token in real WordPress)
curl http://localhost:8888/wp-json/openfields/v1/fieldsets

# Get debug info
curl http://localhost:8888/wp-json/openfields/v1/debug/locations | jq
```

## Common Gotchas

### Issue: Meta boxes not showing
**Check**:
1. Is fieldset marked as active? (Not inactive)
2. Do location rules match current post type?
3. Check debug.log for matching errors
4. Verify fields exist in fieldset

### Issue: Field values not saving
**Check**:
1. Is field name valid? (Alphanumeric + underscore)
2. Is save_post hook being fired? Check debug.log
3. Are values in postmeta? `SELECT * FROM wp_postmeta WHERE post_id = X`
4. Is prefix correct? (Should be `of_fieldname`)

### Issue: Location rules not working
**Check**:
1. Are there rows in wp_openfields_locations?
2. Is param spelled correctly? (post_type, page_template, etc.)
3. Is the value correct? (e.g., 'page' not 'Page')
4. Check matching logic in debug.log

### Issue: React app not updating
**Check**:
1. Are you using proper selector? `useStore((state) => state.fieldsets)`
2. Is unsavedChanges flag set? Should be true after edits
3. Did you call saveAllChanges()? Check network tab
4. Is API returning successful response? Check browser DevTools

## Field Type Defaults

When creating a new field, ensure these are set:

```typescript
{
  label: 'Field Label',
  name: 'field_name',           // alphanumeric + underscore
  type: 'text',                 // must be registered
  settings: {
    placeholder: '',
    default_value: '',
    instructions: '',
    required: false,
  }
}
```

## Zustand Store Usage Patterns

### Correct - Component subscribes to specific state
```typescript
const fieldsets = useFieldsetStore((state) => state.fieldsets);
const fetchFieldsets = useFieldsetStore((state) => state.fetchFieldsets);

// Component only re-renders when fieldsets change
```

### Incorrect - Component subscribes to entire store
```typescript
const store = useFieldsetStore();
const fieldsets = store.fieldsets;

// Component re-renders on ANY store change
```

### Batching Changes
```typescript
// Option 1: Stage changes locally
store.addFieldLocal({ label: 'Field 1' });
store.addFieldLocal({ label: 'Field 2' });
// Then click Save → single API call

// Option 2: Direct API
await fieldApi.create(fieldsetId, field1);
await fieldApi.create(fieldsetId, field2);
// Two separate API calls
```

## Performance Tips

1. **Use lazy loading for pages**
2. **Memoize expensive computations** with useMemo
3. **Use selectors** in Zustand hooks
4. **Paginate** fieldsets if > 100
5. **Cache** location type options
6. **Debounce** search inputs
7. **Use React.memo** for list items

## Testing Checklist

- [ ] Create fieldset with all field types
- [ ] Set location rules: post_type = page
- [ ] Create a page
- [ ] Verify meta boxes appear on page edit
- [ ] Fill in field values
- [ ] Save page
- [ ] Reload page - values still there?
- [ ] Check postmeta has `of_` prefixed keys
- [ ] Edit page again - values loaded?
- [ ] Try switching to post - meta box not shown?
- [ ] Duplicate fieldset - all fields copied?
- [ ] Delete fieldset - clean up locations table?

## Documentation Map

- **VISION.md** - Project goals, current status, roadmap
- **PLUGIN_STRUCTURE.md** - System architecture, database schema, API design
- **ADMIN_SYSTEM.md** - React UI, state management, field types
- **DEVELOPER_GUIDE.md** - How to add features, debug, test
- **QUICK_REFERENCE.md** (this file) - Cheat sheet for common tasks

