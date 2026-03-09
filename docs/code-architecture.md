# High-Level Code Architectural Design

> **Status**: Not yet filled

## Topics to Cover

### 1. Project Structure
- Folder layout and conventions
- Feature-based vs layer-based organization
- Import/dependency rules

### 2. Domain Layer
- Core types and interfaces
- Catalog definition model
- Report normalization pipeline
- Validation layer

### 3. State Management
- Store structure (Zustand)
- Session lifecycle
- Ammo entry mutations
- Derived state and selectors

### 4. Storage Layer
- Abstract storage interface
- IndexedDB implementation (Dexie)
- Data migration strategy
- Draft management

### 5. UI Layer
- Component hierarchy
- Data-driven form generation from catalog
- Tab/section routing logic
- Responsive patterns

### 6. Export Layer
- Report model → Excel adapter
- Report model → PDF/Print adapter
- Format versioning

### 7. PWA Layer
- Service worker lifecycle
- Cache strategy
- Update mechanism

### 8. Extension Points
- Adding new ammo types
- Adding sync/backend
- Adding import from sub-units
- Adding authentication
