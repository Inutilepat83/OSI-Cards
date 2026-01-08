# OSI Cards - Sections Directory

**Single Source of Truth for All Sections**

This directory contains all 23 section types used in OSI Cards. Each section is a self-contained module with everything needed for development, styling, and documentation.

## ✨ NEW: Smart Auto-Discovery System

**Sections are now truly plug-and-play!**

- 🚀 **Add section**: Drop folder + run `npm run sections:build` → Done!
- 🗑️ **Remove section**: Delete folder + run `npm run sections:build` → Done!
- ♻️ **No manual updates** to registry, exports, styles, or docs needed!

The build system automatically discovers sections and compiles all artifacts. Zero chance of forgetting to update something!

---

## 📁 Directory Structure

Each section folder contains exactly **5 files**:

```
section-name/
├── section-name.component.ts     # Component logic + inline styles
├── section-name.component.html   # Template
├── section.definition.json       # Schema, metadata, test fixtures
├── section-name.scss             # External styles (optional, inherits design system)
└── README.md                     # Complete documentation
```

---

## 📊 Available Sections (23 Total)

| Section | Type | Aliases | Description |
|---------|------|---------|-------------|
| analytics-section | `analytics` | metrics, stats, kpi | Performance metrics and KPIs |
| brand-colors-section | `brand-colors` | colors | Brand color palette display |
| chart-section | `chart` | - | Data visualization (Frappe Charts) |
| contact-card-section | `contact-card` | contacts, team | Contact information cards |
| event-section | `event` | timeline | Event and calendar displays |
| faq-section | `faq` | - | Frequently asked questions |
| financials-section | `financials` | - | Financial data display |
| gallery-section | `gallery` | - | Image galleries |
| list-section | `list` | checklist | Lists and structured items |
| table-section | `table` | data-table, grid | Tabular data with sorting, filtering, pagination |
| map-section | `map` | location | Location maps (Leaflet) |
| network-card-section | `network-card` | partners | Network relationships |
| news-section | `news` | - | News and updates |
| overview-section | `overview` | - | Extended information display |
| product-section | `product` | - | Product information |
| quotation-section | `quotation` | testimonials | Quotes and testimonials |
| social-media-section | `social-media` | - | Social media links |
| solutions-section | `solutions` | - | Business solutions |
| text-reference-section | `text-reference` | references | Document references |
| timeline-section | `timeline` | - | Timeline visualization |
| video-section | `video` | - | Video content |

---

## 🎨 Enhanced Design System

### Modern Architecture

All section SCSS files inherit from the **enhanced design system** with comprehensive styling tools:

```scss
// Every section SCSS file starts with:
@use '../../../styles/components/sections/design-system' as *;
```

### What You Get ✨

**🎨 Design Tokens:**
- Spacing scale (8px base system)
- Typography scale with semantic sizes
- Shadow system (6 levels + glow effects)
- Border radius scale
- Transition & timing utilities
- Modern color system

**✨ Modern Effects:**
- Glass morphism cards
- Gradient accents & backgrounds
- Shimmer/shine effects
- Elevated cards with lift
- Glow effects & animated borders
- Ripple effects & skeleton loading
- Neumorphism (soft UI)

**🧩 Component Mixins:**
- Enhanced card variants (elevated, glass, neumorphic)
- Stat/metric cards with labels & values
- Modern badges & chips
- Avatars & avatar groups
- Icon buttons & progress indicators
- Tooltips & input fields
- Empty states

**📝 Typography System:**
- 6 heading levels + 4 body sizes
- Semantic text variants
- Labels, captions, code styles
- Number displays & truncation utilities

**🛠️ Utility Classes:**
- Spacing, layout, typography
- Colors, borders, shadows
- Responsive utilities
- (Optional - for rapid development)

**📖 See `DESIGN_SYSTEM_GUIDE.md` for complete documentation**

---

## 🚀 Quick Start

### View a Section

```bash
cd analytics-section
# All files are here!
```

### Customize Section Styles

1. Open the section's SCSS file:
   ```bash
   vim analytics-section/analytics-section.scss
   ```

2. Add custom styles (they inherit design system automatically):
   ```scss
   // Custom analytics grid
   .analytics-grid-custom {
     @include section-grid(180px, 16px);

     // Add custom properties
     background: var(--accent-color-10);
   }
   ```

3. Rebuild (if needed):
   ```bash
   npm run build:styles
   ```

### Add a New Section (Plug-and-Play!)

**New in v2.0**: Sections are now truly plug-and-play! Just add the folder and run one command.

1. Create folder:
   ```bash
   mkdir new-section
   ```

2. Add 5 required files:
   - `new-section.component.ts` (component)
   - `new-section.component.html` (template)
   - `new.definition.json` (schema)
   - `new-section.scss` (styles - use `_SECTION_SCSS_TEMPLATE.scss`)
   - `README.md` (documentation)

3. Auto-compile everything:
   ```bash
   npm run sections:build
   ```

**That's it!** The build system will:
- ✅ Auto-discover your new section
- ✅ Add it to section-registry.json
- ✅ Export it in index.ts
- ✅ Include it in style bundle
- ✅ Generate documentation
- ✅ No manual edits needed!

### Remove a Section

1. Delete the folder:
   ```bash
   rm -rf old-section
   ```

2. Rebuild:
   ```bash
   npm run sections:build
   ```

**Done!** Everything is cleaned up automatically.

---

## 📚 Documentation

### Per-Section Documentation
Each section has its own `README.md` with:
- Overview and description
- Use cases
- Field/item schema
- Code examples
- Best practices

### General Guides
- `SCSS_USAGE_GUIDE.md` - How to use section SCSS files
- `_SECTION_SCSS_TEMPLATE.scss` - Template for new sections

---

## 🔄 Auto-Generated Files

Running `npm run sections:build` automatically generates:

**Core Artifacts:**
- `section-registry.json` - Compiled from all `*.definition.json` files
- `sections/index.ts` - Component exports (auto-discovered)
- `_all-sections.generated.scss` - Style bundle (auto-imported)
- `docs/SECTIONS_GENERATED.md` - Documentation (auto-compiled)

**Additional Generated Files:**
- `generated-section-types.ts` - TypeScript types
- `section-component-map.generated.ts` - Component mappings
- `fixtures.generated.ts` - Test fixtures
- Test JSON files (complete, minimal, edge-cases)

**Never edit these files directly!** They're regenerated from section folders via `npm run sections:build` or `npm run generate:all`.

---

## ✅ Standards

### File Naming
- Component: `section-name.component.ts`
- Template: `section-name.component.html`
- Definition: `section.definition.json`
- Styles: `section-name.scss`
- Docs: `README.md`

### SCSS Structure
1. Import design system
2. Define `:host` styles
3. Add custom section-specific styles

### Definition Format
- Type, name, description
- Selector, use cases, best practices
- Rendering configuration
- Field/item schema
- Test fixtures (complete, minimal, edgeCases)

---

## 🎯 Benefits

1. **Single Source of Truth** - Everything in one directory
2. **Self-Contained** - Each section is independent
3. **Design System Integrated** - Inherits master styles
4. **Customizable** - Add section-specific styles easily
5. **Well-Documented** - README in every section
6. **Auto-Generated** - Registry and types stay in sync
7. **Clean & Optimized** - No duplicates or clutter

---

## 📖 Learn More

- Read individual section `README.md` files for specific usage
- See `SCSS_USAGE_GUIDE.md` for styling examples
- Check `_SECTION_SCSS_TEMPLATE.scss` for the base template
- View `../../../docs/SECTION_TYPES.md` for quick reference

---

**This directory is the complete system for all OSI Cards sections!** 🎉

