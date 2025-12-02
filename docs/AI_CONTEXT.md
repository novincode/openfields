# AI Context & Development Guidelines for OpenFields

This document provides essential context for AI assistants working on the OpenFields project. Use this to maintain consistency, avoid common mistakes, and follow WordPress best practices.

---

## 🎯 Project Core Principles

### 1. WordPress Guidelines First
- **ALWAYS** use unique prefix `openfields_` for functions, `OpenFields_` for classes
- **NEVER** use generic names like `get_fields()` - always prefix
- **ALWAYS** escape output: `esc_html()`, `esc_attr()`, `esc_url()`
- **ALWAYS** sanitize input: `sanitize_text_field()`, `wp_kses_post()`
- **ALWAYS** use nonces for forms and AJAX
- **ALWAYS** check capabilities with `current_user_can()`
- **NO** external CDN dependencies - bundle everything
- **NO** premium features or upsells
- Text domain: `openfields` (matches slug)

### 2. Code Organization
- **Keep it modular**: Each field type in its own file
- **Headless design**: PHP handles data, React handles UI
- **Type safety**: Use TypeScript everywhere in admin
- **Clean separation**: Storage logic separate from rendering
- **Single responsibility**: Each class/function does one thing well

### 3. Developer Experience
- **Simple naming**: `FieldSet` not `FS`, `TextField` not `TF`
- **Self-documenting code**: Clear variable names, minimal comments needed
- **Consistent patterns**: Follow established conventions in codebase
- **No magic**: Explicit over implicit

---

## 🚫 Common Mistakes to Avoid

### WordPress-Specific

❌ **Don't do this:**
```php
function get_field($name) { // Generic name - will conflict!
    return get_post_meta(get_the_ID(), $name, true);
}

echo $user_input; // Not escaped!
update_post_meta($_POST['id'], 'key', $_POST['value']); // Not sanitized!
```

✅ **Do this:**
```php
function openfields_get_field($name, $post_id = null) {
    $post_id = $post_id ?? get_the_ID();
    return get_post_meta($post_id, 'of_' . $name, true);
}

echo esc_html($user_input);
$id = absint($_POST['id']);
$value = sanitize_text_field($_POST['value']);
check_admin_referer('openfields_save_nonce');
update_post_meta($id, 'of_key', $value);
```

### Plugin Approval Issues

❌ **What gets rejected:**
- External file loading (Google Fonts CDN, jQuery from CDN)
- Missing text domains or wrong text domain
- No nonce verification
- Direct file access without `ABSPATH` check
- Using `WP_PLUGIN_DIR` constant (use `plugin_dir_path()`)
- Inline scripts/styles without proper enqueuing
- Missing capability checks on admin actions
- Generic function/class names without prefix

✅ **What gets approved:**
```php
// Security check
if (!defined('ABSPATH')) exit;

// Proper paths
define('OPENFIELDS_PATH', plugin_dir_path(__FILE__));

// Enqueue properly
function openfields_enqueue_admin_assets($hook) {
    if ('toplevel_page_openfields' !== $hook) return;
    
    wp_enqueue_script(
        'openfields-admin',
        plugins_url('assets/admin/js/admin.js', OPENFIELDS_PLUGIN_FILE),
        ['wp-element'],
        OPENFIELDS_VERSION,
        true
    );
}
add_action('admin_enqueue_scripts', 'openfields_enqueue_admin_assets');
```

### TypeScript/React Mistakes

❌ **Avoid:**
```typescript
// Any types
const data: any = fetchData();

// Untyped props
function Field(props) { ... }

// Direct DOM manipulation
document.getElementById('field').innerHTML = value;
```

✅ **Proper approach:**
```typescript
// Explicit types
interface FieldData {
    id: string;
    type: FieldType;
    value: unknown;
}
const data: FieldData = await fetchData();

// Typed props
interface FieldProps {
    field: Field;
    onChange: (value: unknown) => void;
}
function Field({ field, onChange }: FieldProps) { ... }

// React way
<div dangerouslySetInnerHTML={{ __html: sanitizedValue }} />
// Or better: use proper React rendering
```

---

## 📁 File Organization Rules

### PHP Structure
```
includes/
├── class-openfields.php          # Main plugin class (singleton)
├── class-installer.php           # DB setup, activation hooks
├── class-assets.php              # Script/style enqueuing
├── class-rest-api.php            # REST endpoints
│
├── fields/
│   ├── class-field-registry.php  # Central registry
│   ├── class-base-field.php      # Abstract base class
│   └── types/
│       ├── class-text-field.php  # One file per field type
│       └── ...
│
├── storage/
│   ├── class-storage-manager.php # Routes to correct storage
│   ├── class-post-meta-storage.php
│   └── ...
│
└── api/
    └── functions.php             # Public API (get_field, etc.)
```

**Rules:**
- One class per file
- Class name matches filename: `class-field-registry.php` → `OpenFields_Field_Registry`
- Abstract classes prefixed with `Base_` or `Abstract_`
- Interfaces prefixed with `Interface_`

### React Structure
```
admin/src/
├── components/
│   ├── ui/              # shadcn components (auto-generated)
│   ├── layout/          # Header, Sidebar, etc.
│   ├── field-builder/   # DnD builder components
│   └── shared/          # Reusable components
│
├── pages/               # Route components
│   ├── FieldsetList.tsx
│   └── FieldsetEditor.tsx
│
├── stores/              # Zustand stores
│   └── fieldsetStore.ts
│
├── types/               # TypeScript types
│   ├── field.types.ts
│   └── api.types.ts
│
└── lib/                 # Utilities
    ├── api.ts           # API client
    └── utils.ts         # Helpers
```

**Rules:**
- Components in PascalCase: `FieldCanvas.tsx`
- Hooks in camelCase with `use` prefix: `useFieldsets.ts`
- Types/interfaces in PascalCase with `.types.ts` suffix
- One main component per file
- Co-locate related components in folders

---

## 🗄️ Database Guidelines

### Naming Conventions
- Table prefix: `{$wpdb->prefix}openfields_`
- Column names: `snake_case`
- Foreign keys: `{table}_id` (e.g., `fieldset_id`)
- Timestamps: `created_at`, `updated_at`

### Required Columns
Every table should have:
```sql
id bigint(20) unsigned NOT NULL AUTO_INCREMENT,
created_at datetime NOT NULL,
updated_at datetime NOT NULL,
PRIMARY KEY (id)
```

### Queries
Always use `$wpdb->prepare()`:

❌ **Never:**
```php
$wpdb->query("DELETE FROM {$table} WHERE id = {$id}");
```

✅ **Always:**
```php
$wpdb->query($wpdb->prepare(
    "DELETE FROM {$table} WHERE id = %d",
    $id
));
```

---

## 🎨 React/TypeScript Patterns

### State Management (Zustand)
```typescript
interface FieldsetState {
    fieldsets: Fieldset[];
    loading: boolean;
    error: string | null;
    
    // Actions
    fetchFieldsets: () => Promise<void>;
    createFieldset: (data: Partial<Fieldset>) => Promise<void>;
}

export const useFieldsetStore = create<FieldsetState>((set, get) => ({
    fieldsets: [],
    loading: false,
    error: null,
    
    fetchFieldsets: async () => {
        set({ loading: true, error: null });
        try {
            const response = await api.get('/openfields/v1/fieldsets');
            set({ fieldsets: response.data, loading: false });
        } catch (error) {
            set({ error: error.message, loading: false });
        }
    },
}));
```

### Component Patterns
```typescript
// Props interface
interface FieldItemProps {
    field: Field;
    onUpdate: (field: Field) => void;
    onDelete: (id: string) => void;
}

// Component
export function FieldItem({ field, onUpdate, onDelete }: FieldItemProps) {
    const handleChange = (updates: Partial<Field>) => {
        onUpdate({ ...field, ...updates });
    };
    
    return (
        <div className="field-item">
            {/* ... */}
        </div>
    );
}
```

### API Client Pattern
```typescript
// lib/api.ts
class OpenFieldsAPI {
    private baseUrl = '/wp-json/openfields/v1';
    
    async get<T>(endpoint: string): Promise<T> {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
            headers: {
                'X-WP-Nonce': window.openfieldsData.nonce,
            },
        });
        
        if (!response.ok) throw new Error('API request failed');
        return response.json();
    }
}

export const api = new OpenFieldsAPI();
```

---

## 🔐 Security Checklist

Before committing any code:

- [ ] All output escaped with appropriate function
- [ ] All input sanitized before storage
- [ ] Nonces present and verified on forms/AJAX
- [ ] Capability checks on all admin actions
- [ ] No `eval()` or dynamic code execution
- [ ] SQL queries use `$wpdb->prepare()`
- [ ] File uploads validate MIME types
- [ ] CSRF protection on state-changing operations
- [ ] No sensitive data in frontend JavaScript
- [ ] API endpoints check permissions

---

## 🧪 Testing Guidelines

### PHP Tests
```php
// tests/test-field-registry.php
class Test_Field_Registry extends WP_UnitTestCase {
    public function test_register_field_type() {
        $result = OpenFields_Field_Registry::register(
            'text',
            'OpenFields_Text_Field'
        );
        
        $this->assertTrue($result);
        $this->assertContains('text', OpenFields_Field_Registry::get_field_types());
    }
}
```

### TypeScript Tests
```typescript
// admin/src/lib/__tests__/api.test.ts
import { describe, it, expect } from 'vitest';
import { api } from '../api';

describe('OpenFields API', () => {
    it('should fetch fieldsets', async () => {
        const fieldsets = await api.get('/fieldsets');
        expect(Array.isArray(fieldsets)).toBe(true);
    });
});
```

---

## 📝 Documentation Standards

### PHP Docblocks
```php
/**
 * Retrieve field value for a given context.
 *
 * @since 1.0.0
 *
 * @param string   $field_name The field name/key.
 * @param int|null $object_id  Optional. Post/User/Term ID. Default current post.
 * @return mixed Field value or null if not found.
 */
function openfields_get_field($field_name, $object_id = null) {
    // ...
}
```

### TypeScript JSDoc
```typescript
/**
 * Fetches all fieldsets from the API.
 * 
 * @returns Promise resolving to array of fieldsets
 * @throws Error if API request fails
 */
async fetchFieldsets(): Promise<Fieldset[]> {
    // ...
}
```

---

## 🔄 Git Workflow

### Commit Messages
```
feat: add repeater field type
fix: resolve conditional logic evaluation bug
docs: update API documentation
refactor: simplify storage manager
test: add unit tests for field registry
chore: update dependencies
```

### Branch Naming
- `feature/repeater-field`
- `fix/conditional-logic`
- `docs/api-reference`

---

## 🌍 Internationalization

### PHP
```php
// Good
__('Field Settings', 'openfields')
_e('Save Changes', 'openfields')
_n('%d field', '%d fields', $count, 'openfields')

// With context
_x('Date', 'field type', 'openfields')

// Never
__($variable, 'openfields') // Variable strings can't be translated!
```

### React
```typescript
// Use wp.i18n
import { __ } from '@wordpress/i18n';

function FieldSettings() {
    return <h2>{__('Field Settings', 'openfields')}</h2>;
}
```

---

## 🚀 Performance Guidelines

### PHP
- Cache field definitions in transients
- Use `wp_cache_get/set` for frequently accessed data
- Lazy load field values (don't fetch all at once)
- Index database columns used in WHERE clauses

### React
- Lazy load heavy components (Monaco editor)
- Use React.memo for expensive renders
- Debounce search inputs
- Virtual scrolling for long field lists

---

## 📋 Field Type Implementation Checklist

When adding a new field type:

- [ ] Create `class-{type}-field.php` extending `OpenFields_Base_Field`
- [ ] Implement `get_type()`, `get_schema()`, `render()`, `validate()`, `sanitize()`
- [ ] Register in field registry
- [ ] Add TypeScript type definition
- [ ] Create React component in admin
- [ ] Add icon to field palette
- [ ] Write unit tests
- [ ] Document in user docs
- [ ] Add to field type list in README

---

## 🎯 Vision Alignment

When making decisions, ask:

1. **Does this follow WordPress best practices?** (Most important)
2. **Is this developer-friendly?** (Clear, simple, well-documented)
3. **Is this maintainable?** (Modular, tested, consistent)
4. **Does this improve on ACF?** (Better UX, better DX)

Our goal: Make custom fields **easier**, **faster**, and **more enjoyable** for WordPress developers.

---

## 🔗 Quick Reference Links

- [WordPress Coding Standards](https://developer.wordpress.org/coding-standards/wordpress-coding-standards/)
- [Plugin Handbook](https://developer.wordpress.org/plugins/)
- [Plugin Review Guidelines](https://developer.wordpress.org/plugins/wordpress-org/detailed-plugin-guidelines/)
- [React TypeScript Cheatsheet](https://react-typescript-cheatsheet.netlify.app/)
- [shadcn/ui Documentation](https://ui.shadcn.com/)

---

**Remember**: This is a long-term project. Consistency matters more than speed. Take time to do it right the first time.
