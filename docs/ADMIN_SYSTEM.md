# OpenFields Admin System

**📖 See Also:** [Documentation Index](./INDEX.md) | [Architecture](./ARCHITECTURE.md) | [Field Wrapper System](./FIELD_WRAPPER_SYSTEM.md) | [Developer Guide](./DEVELOPER_GUIDE.md)

## Overview

The OpenFields Admin System is a React/TypeScript SPA that provides an intuitive interface for managing custom fields. It communicates with the WordPress backend via REST API and uses Zustand for state management.

## Architecture

### Entry Point

- **File**: `admin/src/main.tsx`
- **Mounts**: React app into `#openfields-admin` div
- **Bootstrap**: Loads user data via `window.openfieldsAdmin` global
- **Build Tool**: Vite

### Root Component

- **File**: `admin/src/App.tsx`
- **Responsibility**: Main navigation & route handling
- **Pages**:
  - `FieldsetList` - Browse all fieldsets
  - `FieldsetEditor` - Create/edit fieldset
  - `Tools` - Utility functions

## State Management (Zustand)

### Fieldset Store (`stores/fieldset-store.ts`)

Manages all fieldset and field data plus pending changes.

```typescript
interface ExtendedFieldsetStore {
  // Data
  fieldsets: Fieldset[];
  currentFieldset: Fieldset | null;
  fields: Field[];
  
  // UI state
  isLoading: boolean;
  error: string | null;
  unsavedChanges: boolean;
  
  // Pending changes (client-side)
  pendingFieldChanges: Map<string, Partial<Field>>;
  pendingFieldAdditions: Field[];
  pendingFieldDeletions: string[];
  
  // Actions
  fetchFieldsets(): Promise<void>;
  fetchFieldset(id: number): Promise<void>;
  createFieldset(data: Partial<Fieldset>): Promise<Fieldset>;
  updateFieldset(id: number, data: Partial<Fieldset>): Promise<void>;
  deleteFieldset(id: number): Promise<void>;
  duplicateFieldset(id: number): Promise<Fieldset>;
  
  // Field operations
  fetchFields(fieldsetId: number): Promise<void>;
  addFieldLocal(field: Partial<Field>): void;
  updateFieldLocal(id: string, data: Partial<Field>): void;
  deleteFieldLocal(id: string): void;
  reorderFieldsLocal(fields: Field[]): void;
  saveAllChanges(): Promise<void>;
}
```

**Key Pattern**: Local staging of changes before saving. This allows users to:
1. Add/edit multiple fields
2. Reorder fields
3. Delete fields
4. **Then click Save** to send all changes to server atomically

### UI Store (`stores/ui-store.ts`)

Manages toast notifications and modal states.

```typescript
interface UIStore {
  showToast(
    type: 'success' | 'error' | 'info',
    message: string,
    duration?: number
  ): void;
  // Modal state...
}
```

## API Client (`api/index.ts`)

Provides type-safe REST client with auto-transforms for field data.

### Transform Functions

**Frontend ↔ Backend data format differences:**

```typescript
// Backend returns fields with settings split into top-level properties:
// { placeholder, default_value, instructions, conditional_logic, wrapper_config, field_config }

// Frontend expects unified settings object:
// { settings: { placeholder, default_value, instructions, ... } }

transformFieldFromAPI()      // Converts backend → frontend
transformFieldToAPI()        // Converts frontend → backend
```

### API Methods

```typescript
const fieldsetApi = {
  getAll(),
  get(id),
  create(data),
  update(id, data),
  delete(id),
  duplicate(id),
  export(id),
  import(data),
};

const fieldApi = {
  getByFieldset(fieldsetId),
  create(fieldsetId, data),
  update(id, data),
  delete(id),
};

const locationApi = {
  getLocationTypes(),
};
```

## Pages

### FieldsetList (`pages/FieldsetList.tsx`)

**Purpose**: Browse, create, and manage fieldsets

**Features**:
- List all fieldsets with status badge
- Create new fieldset button
- Edit fieldset link
- Delete fieldset
- Duplicate fieldset
- View field count

### FieldsetEditor (`pages/FieldsetEditor/index.tsx`)

**Purpose**: Edit fieldset name, description, location rules, and manage fields

**Layout**:
```
┌─ Sticky Header ──────────────────────────┐
│ Title Input          [Save Changes] Btn  │
└──────────────────────────────────────────┘
│
├─ FieldsSection
│  - Add field button
│  - Drag-to-reorder list
│  - Field edit/delete actions
│  - Shows: Label, Type, Status
│
├─ SettingsSection
│  - Active/Inactive toggle
│  - Slug/Key input
│  - Description textarea
│
└─ LocationsSection
   - Location rule builder
   - Add/remove rules
   - AND/OR logic visualization
```

### Components Breakdown

#### **FieldsSection** (`FieldsetEditor/components/FieldsSection.tsx`)

**Responsibility**: Display and manage field list

**Features**:
- Add new field dropdown
- Drag-to-reorder (using SortableJS/dnd-kit)
- Field card showing type & label
- Edit field button → opens TypeSpecificSettings modal
- Delete field button → stages deletion locally
- Preview field configuration

**State Flow**:
1. User adds field → `addFieldLocal()` → shown in list immediately
2. User edits field → `updateFieldLocal()` → updates in place
3. User reorders → `reorderFieldsLocal()` → updates menu_order
4. User clicks Save → `saveAllChanges()` → sends to API

#### **LocationsSection** (`FieldsetEditor/components/LocationsSection.tsx`)

**Responsibility**: Visual builder for location rules

**Rule Structure**:
- Multiple **groups** (OR logic between groups)
- Each group has multiple **rules** (AND logic between rules)
- Each rule: Type selector → Operator selector → Value selector

**Example**:
```
GROUP 1:
  Rule: Post Type == Page    AND
  Rule: Page Template == default
            [OR logic separator]
GROUP 2:
  Rule: Post Type == Post
```

**This means**: Show on (page AND default template) OR (post)

**Frontend Format** (sent to backend):
```typescript
[
  {
    id: '1',
    rules: [
      { type: 'post_type', operator: '==', value: 'page' },
      { type: 'page_template', operator: '==', value: 'default' }
    ]
  },
  {
    id: '2',
    rules: [
      { type: 'post_type', operator: '==', value: 'post' }
    ]
  }
]
```

**Database Format** (stored in `wp_openfields_locations`):
```
fieldset_id | param          | operator | value   | group_id
1           | post_type      | ==       | page    | 0
1           | page_template  | ==       | default | 0
1           | post_type      | ==       | post    | 1
```

#### **SettingsSection** (`FieldsetEditor/components/SettingsSection.tsx`)

**Responsibility**: Fieldset-level configuration

**Fields**:
- Title (header input, synced with fieldset)
- Slug/Field Key (auto-generated, editable)
- Description (rich text optional)
- Status (Active/Inactive toggle)
- Position (normal/side selector)
- Priority (high/low/default selector)

#### **TypeSpecificSettings** (`FieldsetEditor/components/TypeSpecificSettings.tsx`)

**Responsibility**: Render field-type-specific settings UI

**Pattern**: Each field type has a settings component:
- `TextFieldSettings.tsx` - min length, max length, pattern
- `NumberFieldSettings.tsx` - min value, max value, step
- `SelectFieldSettings.tsx` - choices, multi-select toggle
- `TextareaFieldSettings.tsx` - rows, rich text toggle
- `SwitchFieldSettings.tsx` - on/off labels

**Registry Pattern**:
```typescript
// fields/index.ts
const fieldSettingsRegistry = {
  text: TextFieldSettings,
  number: NumberFieldSettings,
  select: SelectFieldSettings,
  textarea: TextareaFieldSettings,
  // ...
};

// Usage in TypeSpecificSettings:
const SettingsComponent = fieldSettingsRegistry[fieldType];
<SettingsComponent 
  value={settings}
  onChange={handleSettingChange}
/>
```

## Field Type System

### Field Registry (`lib/field-registry.ts`)

Defines all available field types with metadata:

```typescript
export const FIELD_TYPES = [
  {
    id: 'text',
    label: 'Text',
    icon: 'type',
    description: 'Single line text input',
    settings: {
      placeholder: { type: 'text', default: '' },
      default_value: { type: 'text', default: '' },
      required: { type: 'boolean', default: false },
      instructions: { type: 'text', default: '' },
      min_length: { type: 'number', default: 0 },
      max_length: { type: 'number', default: null },
      pattern: { type: 'text', default: '' },
    }
  },
  // ... more field types
];
```

### Field Settings Component Template

Each field type has a settings component following this pattern:

```typescript
interface FieldSettingsProps {
  field: Field;
  onUpdate: (field: Partial<Field>) => void;
}

export function TextFieldSettings({ field, onUpdate }: FieldSettingsProps) {
  const settings = field.settings || {};
  
  const handleChange = (key: string, value: any) => {
    onUpdate({
      ...field,
      settings: {
        ...settings,
        [key]: value,
      }
    });
  };

  return (
    <div className="field-settings">
      <InputField
        label="Placeholder"
        value={settings.placeholder || ''}
        onChange={(val) => handleChange('placeholder', val)}
      />
      <InputField
        label="Max Length"
        type="number"
        value={settings.max_length || ''}
        onChange={(val) => handleChange('max_length', val)}
      />
      {/* ... more settings */}
    </div>
  );
}
```

## Meta Box Display (Browser)

When user visits post/page edit screen:

1. **WordPress** registers meta boxes via PHP `add_meta_boxes` action
2. **Gutenberg/Block Editor** renders meta boxes below content
3. **JavaScript** (in `meta-box.js`) initializes field interactions:
   - Color picker
   - Media uploader for image fields
   - Conditional logic evaluation
   - Value persistence

### Meta Box Rendering Flow

```
WordPress Post/Page Edit
    ↓
add_meta_boxes hook fires
    ↓
OpenFields_Meta_Box::register_meta_boxes()
    ↓
Location matching: Does fieldset location match current post?
    ↓
YES → add_meta_box() called
    ↓
render_meta_box() outputs HTML
    ↓
Gutenberg shows in sidebar below content
    ↓
save_post hook → OpenFields_Meta_Box::save_post()
    ↓
Field values saved to postmeta with of_ prefix
```

## Data Persistence Strategy

### Three-Tier Change Management

```typescript
TIER 1: User edits field in UI
  ↓ (immediate)
TIER 2: Local Zustand store updates
  ↓ (user clicks field setting)
TIER 3: `updateFieldLocal()` staged in pendingFieldChanges Map
  ↓ (user clicks Save)
API call: POST to /fieldsets/{id}/fields with all changes
```

**Benefits**:
- Users can batch multiple field changes
- Undo possible by not clicking Save
- Single HTTP request for multiple operations
- Atomic save (all-or-nothing)

### Unsaved Changes Tracking

```typescript
// In FieldsetEditor
const unsavedChanges = useFieldsetStore((state) => state.unsavedChanges);

// Triggers when:
// 1. Field added locally
// 2. Field updated locally
// 3. Field deleted locally
// 4. Field reordered
// 5. Fieldset title/description changed
// 6. Location rules changed

// Disables Save button when false
// Could add browser warning on page leave
```

## Styling System

- **Framework**: Tailwind CSS
- **Component Library**: Shadcn UI (built on Radix)
- **Global Styles**: `styles/main.css`
- **Inline Styles**: Minimal, used for dynamic values

## Error Handling

### API Errors

```typescript
try {
  const fieldset = await fieldsetApi.update(id, data);
} catch (error) {
  showToast('error', error.message || 'Update failed');
  setError(error);
}
```

### Validation Errors

- Frontend: React hook form validates before submission
- Backend: REST API validates and returns 400 with message
- Display: Toast notification with error message

### Network Errors

- Auto-retry for GET requests
- Manual retry button for failed mutations
- Connection status indicator (optional enhancement)

## Performance Optimizations

1. **Selective Re-renders**: Zustand selectors prevent unnecessary component updates
2. **Lazy Load**: Pages loaded on-demand
3. **Memoization**: `useMemo`/`useCallback` for expensive computations
4. **Image Optimization**: Field type icons lazy-loaded
5. **Code Splitting**: Each page bundle separate

## Testing Approach

### E2E Workflow

1. Create fieldset
2. Add fields of various types
3. Configure location rules
4. Set field-specific settings
5. Save everything
6. Go to post/page edit → verify meta boxes appear
7. Fill in field values
8. Save post
9. Reload → verify values persist

### Unit Tests (potential)

- Field registry lookup
- Location rule matching
- API client transforms
- Store actions

## Accessibility (A11y)

Current:
- Semantic HTML
- ARIA labels on inputs
- Keyboard navigation in dropdowns

Future:
- Screen reader testing
- High contrast mode
- Keyboard-only workflow validation
- Focus indicators

## Browser Support

- Chrome/Edge (latest)
- Firefox (latest)
- Safari (latest)
- IE11 - Not supported (uses ES2020+, optional chaining)

## Development Workflow

### Local Development

```bash
cd admin

# Terminal 1: Watch mode
npm run dev

# Terminal 2: Build admin changes
npm run build

# The built files go to plugin/assets/admin/
```

### Debugging

- **React DevTools**: Chrome extension
- **Redux DevTools**: Alternative (not currently used)
- **Zustand Middleware**: Log store mutations:
  ```typescript
  const store = create(
    devtools(
      (set) => { /* ... */ }
    )
  );
  ```
- **Network Tab**: Monitor REST API calls

### Adding New Features

1. Create new component in appropriate directory
2. Add types to `types/index.ts` if needed
3. Update store if state needed
4. Update API client if new endpoints
5. Test with mock data locally
6. Test with real WordPress instance

