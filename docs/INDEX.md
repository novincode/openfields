# OpenFields Documentation Index

Complete guide to OpenFields documentation. Start here to navigate all resources.

---

## 📚 Quick Navigation

| Document | Purpose | For Whom |
|----------|---------|----------|
| [**DEVELOPER_GUIDE.md**](./DEVELOPER_GUIDE.md) | Complete API reference and code examples | Plugin developers |
| [**ARCHITECTURE.md**](./ARCHITECTURE.md) | System design, database schema, class overview | System designers, architects |
| [**BUILD.md**](./BUILD.md) | Build process, versioning, deployment | DevOps, release management |
| [**PLUGIN_STRUCTURE.md**](./PLUGIN_STRUCTURE.md) | File organization and module breakdown | New contributors |
| [**ADMIN_SYSTEM.md**](./ADMIN_SYSTEM.md) | React UI, state management, components | Frontend developers |
| [**WORDPRESS_GUIDELINES.md**](./WORDPRESS_GUIDELINES.md) | WordPress.org compliance checklist | Release managers |
| [**WORDPRESS_CHECKLIST.md**](./WORDPRESS_CHECKLIST.md) | WordPress feature integration tests | QA, testers |
| [**FIELD_WRAPPER_SYSTEM.md**](./FIELD_WRAPPER_SYSTEM.md) | Field CSS classes, layout system | Frontend developers |
| [**QUICK_REFERENCE.md**](./QUICK_REFERENCE.md) | Common tasks and patterns | All developers |
| [**VISION.md**](./VISION.md) | Project goals, roadmap, philosophy | Project managers, stakeholders |
| [**AI_CONTEXT.md**](./AI_CONTEXT.md) | Project context for AI assistants | AI tools, code generators |

---

## 🚀 Getting Started

**New to OpenFields?**

1. Read [README.md](../README.md) for overview and installation
2. Follow [**DEVELOPER_GUIDE.md**](./DEVELOPER_GUIDE.md) → Getting Started section
3. Check [QUICK_REFERENCE.md](./QUICK_REFERENCE.md) for common patterns

**Contributing?**

1. Read [CONTRIBUTING.md](../CONTRIBUTING.md)
2. Review [PLUGIN_STRUCTURE.md](./PLUGIN_STRUCTURE.md)
3. Check [ARCHITECTURE.md](./ARCHITECTURE.md) for system design

**Releasing?**

1. Follow [BUILD.md](./BUILD.md) build process
2. Check [WORDPRESS_GUIDELINES.md](./WORDPRESS_GUIDELINES.md) for compliance
3. Run tests from [WORDPRESS_CHECKLIST.md](./WORDPRESS_CHECKLIST.md)

---

## 📖 Documentation by Role

### For Frontend Developers (React)

- Start: [ADMIN_SYSTEM.md](./ADMIN_SYSTEM.md)
- Styling: [FIELD_WRAPPER_SYSTEM.md](./FIELD_WRAPPER_SYSTEM.md)
- Layout: [ARCHITECTURE.md](./ARCHITECTURE.md) → Admin Section
- API: [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)

### For Backend Developers (PHP)

- Start: [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
- Architecture: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Storage: [ARCHITECTURE.md](./ARCHITECTURE.md) → Database Schema
- Structure: [PLUGIN_STRUCTURE.md](./PLUGIN_STRUCTURE.md)

### For Full-Stack Developers

- Overview: [ARCHITECTURE.md](./ARCHITECTURE.md)
- Frontend: [ADMIN_SYSTEM.md](./ADMIN_SYSTEM.md)
- Backend: [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md)
- Integration: [FIELD_WRAPPER_SYSTEM.md](./FIELD_WRAPPER_SYSTEM.md)

### For DevOps / Release Managers

- Building: [BUILD.md](./BUILD.md)
- Compliance: [WORDPRESS_GUIDELINES.md](./WORDPRESS_GUIDELINES.md)
- Testing: [WORDPRESS_CHECKLIST.md](./WORDPRESS_CHECKLIST.md)
- Deployment: [BUILD.md](./BUILD.md) → Release Build section

### For Project Managers

- Vision: [VISION.md](./VISION.md)
- Roadmap: [VISION.md](./VISION.md) → Roadmap
- Status: [AI_CONTEXT.md](./AI_CONTEXT.md) → Progress

---

## 🔗 Cross-References

### Database & Storage
- [Database Schema](./ARCHITECTURE.md#database-schema)
- [Meta Storage](./ARCHITECTURE.md#meta-storage)
- [Storage Layer Details](./DEVELOPER_GUIDE.md#storage-layer)

### Field Types
- [All Field Types](./DEVELOPER_GUIDE.md#field-registry)
- [Field Type Implementation](./PLUGIN_STRUCTURE.md#field-types)
- [Custom Field Type Guide](./DEVELOPER_GUIDE.md#creating-custom-field-types)

### Admin Interface
- [Admin System Overview](./ADMIN_SYSTEM.md)
- [React Components](./ADMIN_SYSTEM.md#component-architecture)
- [Field Wrapper Classes](./FIELD_WRAPPER_SYSTEM.md)

### APIs & Integration
- [Public PHP API](./DEVELOPER_GUIDE.md#public-api)
- [REST API](./DEVELOPER_GUIDE.md#rest-api)
- [Hooks & Filters](./DEVELOPER_GUIDE.md#hooks-and-filters)

### Build & Release
- [Build Process](./BUILD.md)
- [Version Management](./BUILD.md#versioning)
- [WordPress.org Compliance](./WORDPRESS_GUIDELINES.md)

---

## 🎯 Common Tasks

### I want to...

**Add a new field type**
→ [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md#creating-custom-field-types) + [ADMIN_SYSTEM.md](./ADMIN_SYSTEM.md#adding-new-field-types)

**Modify the admin UI**
→ [ADMIN_SYSTEM.md](./ADMIN_SYSTEM.md) + [FIELD_WRAPPER_SYSTEM.md](./FIELD_WRAPPER_SYSTEM.md)

**Add a new location rule**
→ [DEVELOPER_GUIDE.md](./DEVELOPER_GUIDE.md#location-rules) + [ARCHITECTURE.md](./ARCHITECTURE.md#location-matching)

**Build for release**
→ [BUILD.md](./BUILD.md#release-build)

**Prepare for WordPress.org**
→ [WORDPRESS_GUIDELINES.md](./WORDPRESS_GUIDELINES.md)

**Understand the system**
→ [ARCHITECTURE.md](./ARCHITECTURE.md) + [PLUGIN_STRUCTURE.md](./PLUGIN_STRUCTURE.md)

**Find common patterns**
→ [QUICK_REFERENCE.md](./QUICK_REFERENCE.md)

---

## 📝 Document Details

### DEVELOPER_GUIDE.md
Main API reference and tutorials. Covers:
- Local development setup
- System architecture (three layers)
- Public PHP API functions
- REST API endpoints
- Field registry system
- Creating custom field types
- Hooks and filters
- Examples and code snippets

### ARCHITECTURE.md
Technical reference for system design:
- Database schema (all tables)
- Meta storage strategy
- Key PHP classes and methods
- Class relationships and dependencies
- API endpoints reference
- Frontend component hierarchy

### BUILD.md
Build process and deployment:
- Development vs release builds
- Versioning strategy
- Asset management
- Webpack/Vite configuration
- CI/CD integration
- Release checklist

### PLUGIN_STRUCTURE.md
Codebase organization:
- Directory structure
- File purposes
- Module breakdown
- Class naming conventions
- File organization patterns

### ADMIN_SYSTEM.md
React admin interface:
- Component architecture
- State management (Zustand)
- Field type system in React
- UI component library (shadcn/ui)
- Adding new field types
- Custom styling system

### FIELD_WRAPPER_SYSTEM.md
CSS and layout system:
- Wrapper CSS classes
- Field sizing and widths
- Custom CSS per fieldset
- Responsive design
- Common styling patterns

### WORDPRESS_GUIDELINES.md
WordPress.org compliance:
- Plugin submission checklist
- Code standards
- Security requirements
- Compatibility requirements
- Translation readiness
- Documentation requirements

### WORDPRESS_CHECKLIST.md
Testing and validation:
- Feature checklist
- Browser compatibility
- WordPress version compatibility
- Plugin interaction tests
- Database compatibility
- Admin functionality tests

### QUICK_REFERENCE.md
Common code snippets and patterns:
- Getting field values
- Saving field values
- Custom hooks
- Query examples
- Common patterns

### VISION.md
Project goals and direction:
- Project philosophy
- Feature roadmap
- Version milestones
- Design principles
- Long-term vision

### AI_CONTEXT.md
Context for AI-assisted development:
- Project summary
- Key files and their purposes
- Common patterns and conventions
- Known issues and solutions
- Development notes

---

## 🔄 How Documents Link Together

```
README.md (Entry point)
    ↓
CONTRIBUTING.md (How to contribute)
    ↓
PLUGIN_STRUCTURE.md (Understand layout)
    ├→ ARCHITECTURE.md (System design)
    ├→ DEVELOPER_GUIDE.md (API reference)
    │   ├→ QUICK_REFERENCE.md (Common patterns)
    │   └→ BUILD.md (Building & releasing)
    │
    ├→ ADMIN_SYSTEM.md (React UI)
    │   └→ FIELD_WRAPPER_SYSTEM.md (CSS system)
    │
    └→ WORDPRESS_GUIDELINES.md (Compliance)
        └→ WORDPRESS_CHECKLIST.md (Testing)

VISION.md (Project roadmap) ← Referenced by AI_CONTEXT.md
```

---

## 💡 Tips

- **Use Ctrl+F (Cmd+F)** to search within documents
- **Check cross-reference links** at the top of each document
- **Refer to QUICK_REFERENCE.md** for code snippets
- **Keep this index open** while navigating docs
- **Update docs when adding features** (see CONTRIBUTING.md)

---

## 📞 Need Help?

- **Getting started**: Check DEVELOPER_GUIDE.md → Getting Started
- **Common questions**: See QUICK_REFERENCE.md
- **Architecture questions**: See ARCHITECTURE.md
- **Contributing**: See CONTRIBUTING.md
- **Reporting issues**: See GitHub Issues

---

Made with ❤️ by the OpenFields team
