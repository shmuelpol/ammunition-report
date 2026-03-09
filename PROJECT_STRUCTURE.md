# Project Structure & File Organization

```
ammu-report/
├── docs/
│   ├── ui-spec.md                    # Complete UI specification
│   ├── architecture-spec.md          # (Template) Architecture details
│   └── code-architecture.md          # (Template) Code design
│
├── mvp/                              # Main application directory
│   ├── src/
│   │   ├── main.tsx                  # Entry point
│   │   ├── App.tsx                   # Root component (navigation)
│   │   ├── index.css                 # Global RTL/Hebrew styling
│   │   │
│   │   ├── domain/                   # Business logic (pure functions)
│   │   │   ├── types.ts              # Type definitions (UnitLevel, AmmoGroupType, etc.)
│   │   │   ├── catalog.ts            # Ammunition catalog (data-driven)
│   │   │   └── reportModel.ts        # Report normalization (ensures 0 for missing items)
│   │   │
│   │   ├── storage/                  # Data persistence layer
│   │   │   └── db.ts                 # Dexie IndexedDB wrapper
│   │   │
│   │   ├── store/                    # State management
│   │   │   └── useAppStore.ts        # Zustand store (session, ammo entries, drafts)
│   │   │
│   │   ├── components/               # React UI components
│   │   │   ├── SessionSetup.tsx      # Login/setup screen
│   │   │   ├── SectionTabs.tsx       # Tab navigation + form container
│   │   │   ├── AmmoForm.tsx          # Ammunition entry form
│   │   │   └── Summary.tsx           # Report summary + export + **Google Drive**
│   │   │
│   │   ├── hooks/                    # **NEW** Custom React hooks
│   │   │   └── useGoogleDrive.ts     # Google Drive integration hook
│   │   │
│   │   ├── integrations/             # **NEW** External service integrations
│   │   │   └── googleDrive.ts        # Google Drive API wrapper
│   │   │
│   │   ├── export/                   # Export adapters
│   │   │   └── excelExport.ts        # XLSX export logic
│   │   │
│   │   ├── pwa/                      # (Optional) PWA utilities
│   │   └── utils/                    # Helper functions
│   │
│   ├── public/
│   │   ├── manifest.json             # PWA manifest (RTL, Hebrew)
│   │   ├── sw.js                     # Service Worker (offline + caching)
│   │   └── favicon.svg               # Military-themed icon
│   │
│   ├── .github/
│   │   └── workflows/
│   │       └── deploy.yml            # **NEW** GitHub Actions CI/CD
│   │
│   ├── scripts/
│   │   └── deploy.js                 # **NEW** Manual deployment helper
│   │
│   ├── .env.example                  # **NEW** Environment template
│   ├── .gitignore
│   ├── package.json                  # **UPDATED** with deploy script
│   ├── vite.config.ts                # Vite configuration
│   ├── tsconfig.json                 # TypeScript config
│   ├── tsconfig.app.json
│   ├── tsconfig.node.json
│   ├── index.html                    # HTML template (RTL, manifest)
│   ├── README.md                     # **UPDATED** Main docs
│   ├── GOOGLE_DRIVE_SETUP.md         # **NEW** Drive integration guide
│   ├── DEPLOYMENT.md                 # **NEW** Deployment instructions
│   └── dist/                         # Build output (generated)
│
├── ammo_app_architecture_context.md  # Original requirements document
├── POC_SUMMARY.md                    # **NEW** This POC summary
└── README.md                         # (root) Project overview
```

---

## Key Abstraction Layers

### 1. Domain Layer (`src/domain/`)
- **Purpose**: Pure business logic independent of UI/storage
- **Types**: `UnitLevel`, `AmmoGroupType`, `ReportSession`, `Section`
- **Catalog**: Data-driven ammunition definitions
- **Report**: Normalization ensuring 0 for missing items
- **No dependencies**: Pure functions, testable

### 2. Storage Layer (`src/storage/`)
- **Purpose**: Abstract data persistence
- **Current**: IndexedDB via Dexie
- **Future**: Can swap for Firebase, Firestore, backend API
- **Interface**: `saveDraft()`, `loadDraft()`, `listDrafts()`

### 3. State Management (`src/store/`)
- **Tool**: Zustand (lightweight)
- **Sessions**: In-memory + persisted to IndexedDB
- **Mutations**: `addRow()`, `removeRow()`, `updateRowField()`
- **Async**: `saveDraft()`, `loadDraftById()`, `refreshDrafts()`

### 4. UI Layer (`src/components/`)
- **Architecture**: Component-per-screen model
- **Data flow**: Store subscriptions + props
- **Forms**: Data-driven from catalog
- **Responsive**: Mobile-first RTL

### 5. Integration Layer (`src/integrations/`)
- **Current**: Google Drive API
- **Future**: Hooks for backend, sync, auth services
- **Decoupled**: Easy to add/remove without touching UI

---

## Data Flow Example

**User enters 12 shells of type M107 in "Belly" section:**

```
1. UI (AmmoForm.tsx)
   ↓ User fills dropdown + quantity
2. Event Handler
   ↓ dispatch updateRowField()
3. Zustand Store
   ↓ Immutable update to session.sections[i].entries['shell'][j]
4. Component Re-renders
   ↓ Shows updated quantity + recalculates total
5. (Optional) Auto-save
   ↓ dispatch saveDraft()
6. Storage Layer (db.ts)
   ↓ Dexie.drafts.put(session)
7. IndexedDB
   ↓ Persists to browser storage
```

**User saves to Google Drive:**

```
1. UI (Summary.tsx)
   ↓ Click "שמור ל-Google Drive"
2. Hook Dispatch (useGoogleDrive.ts)
   ↓ saveReport(session, fileName)
3. Integration (googleDrive.ts)
   ↓ initGoogleDrive() → signInGoogleDrive() → saveReportToDrive()
4. OAuth 2.0
   ↓ Google authentication popup
5. Google Drive API
   ↓ file.create({ data: session_json })
6. User's Drive
   ↓ File saved in "אפליקציית ספירת מלאι תחמושת" folder
7. UI Feedback (toast)
   ↓ "✓ נשמר לתיקייה ב-Google Drive"
```

---

## Catalog-Driven Architecture

**All forms, reports, and exports are derived from:**

```typescript
// src/domain/catalog.ts
export const ammoCatalog: AmmoGroupDef[] = [
  {
    type: 'shell',
    displayName: 'פגז',
    requiresSerial: false,
    quantityOnly: false,
    models: [
      { id: 'shell-m107', name: 'נפיץ M107' },
      // ...
    ]
  },
  // ... other groups
]
```

**Benefits:**
- ✅ Add new ammo type → Edit catalog only
- ✅ Forms auto-generate from catalog
- ✅ Reports include all catalog items (even 0)
- ✅ Export columns match catalog
- ✅ Easy to maintain

**Form Example:**
```tsx
// Loops through ammoCatalog, creates input rows
ammoCatalog.map(group => (
  <AmmoGroupSection
    group={group}
    rows={section.entries[group.type] || []}
  />
))
```

**Report Example:**
```tsx
// Reports all catalog groups with 0 if no entries
ammoCatalog.map(group => {
  const groupData = report.groupTotals[group.type]
  // Always includes all models, even if quantity is 0
})
```

---

## Environment Variables

### Required for Google Drive

```env
# .env.local (development)
VITE_GOOGLE_CLIENT_ID=your_client_id_from_google_cloud

# GitHub Actions (Settings → Secrets)
GOOGLE_CLIENT_ID=<same_client_id>
```

### Used in Code

```typescript
// src/integrations/googleDrive.ts
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
```

---

## Build & Deployment

### Local Development
```bash
cd mvp
npm install
npm run dev        # http://localhost:3000
```

### Production Build
```bash
npm run build       # Creates dist/
npm run preview     # http://localhost:4173 (production preview)
```

### Deploy to GitHub Pages

**Automatic:**
```bash
git push origin main   # GitHub Actions builds + deploys automatically
```

**Manual:**
```bash
npm run build
git subtree push --prefix=mvp/dist origin gh-pages
```

**URL:** https://shmuelpol.github.io/ammunition-report/

---

## Browser Support

- ✅ Chrome/Edge (current + 1 version)
- ✅ Firefox (current + 1 version)
- ✅ Safari (current + 1 version)
- ✅ Android Chrome via PWA

**Requirements:**
- JavaScript enabled
- IndexedDB supported
- Service Worker support (for PWA)
- HTTPS for PWA install

---

## Code Quality

### TypeScript
- ✅ Strict mode enabled
- ✅ All types defined
- ✅ No `any` types

### Styling
- ✅ CSS variables for theming
- ✅ RTL-first design
- ✅ Mobile-first responsive
- ✅ Print-friendly styles

### Performance
- ✅ ~550KB production JS (mostly from xlsx library)
- ✅ ~14KB CSS (gzipped)
- ✅ Vite dev server <1s startup
- ✅ Production build ~2s

---

## Testing Recommendations

### Unit Tests
- Domain logic: `catalog.ts`, `reportModel.ts`
- Store mutations: `useAppStore.ts`
- API wrapper: `googleDrive.ts`

### Integration Tests
- Storage layer with Dexie
- Google Drive API interactions
- Export formats

### E2E Tests
- Full user flow: Setup → Entry → Summary → Export → Save
- Google Drive integration
- Draft loading/management
- PWA offline functionality

### Manual Testing
- ✅ Different unit levels (צוות/פלגה/סוללה)
- ✅ All ammo types and models
- ✅ Mobile responsiveness (viewport <480px)
- ✅ Hebrew RTL rendering
- ✅ PDF printing
- ✅ Excel export columns
- ✅ Draft persistence
- ✅ Service worker offline mode

---

## Security & Privacy

### ✅ Current Implementation
- OAuth 2.0 → Users authenticate
- Client-side only → No secrets on client
- Data in user's Drive → App doesn't store
- No tracking/analytics
- HTTPS enforced (GitHub Pages)

### ⚠️ Future Considerations
- Server-side validation for multi-user scenarios
- Audit logging for compliance
- Rate limiting on API endpoints
- Data encryption at rest
- User access controls
- Report approval workflows

---

## Extension Points

### Adding New Ammo Type
1. Edit `src/domain/catalog.ts`
2. Add to `ammoCatalog` array
3. Done! (Forms, reports auto-update)

### Adding New Export Format
1. Create `src/export/pdfExport.ts` (or whatever format)
2. Implement `exportToFormat(session, report)` function
3. Add button to `src/components/Summary.tsx`
4. Add CSS for the button

### Adding Backend Sync
1. Create `src/integrations/backend.ts`
2. Implement sync functions
3. Dispatch from store when needed
4. Update Summary with upload progress

### Adding Real-Time Collaboration
1. Integrate Firestore/Supabase
2. Listen to document changes
3. Merge conflicts handling
4. Update UI with live cursors (optional)

---

## Maintenance Notes

### Dependencies
- **React 18**: Active LTS, security updates
- **TypeScript 5.5**: Latest stable
- **Vite 5**: Active development
- **Dexie 4**: Stable IndexedDB wrapper
- **Zustand 4**: Simple state, no updates needed often
- **XLSX 0.18**: Stable, used for Excel export

### Browser Data
- IndexedDB quota: ~50MB on most browsers
- Can be cleared via browser DevTools
- No automatic cleanup in app

### GitHub Pages
- Auto-deploys on push to `main`
- Keep `gh-pages` branch clean (only build output)
- GitHub Actions runs are logged in Actions tab

---

## Resources

- [React Documentation](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/)
- [Zustand Docs](https://github.com/pmndrs/zustand)
- [Dexie.js](https://dexie.org/)
- [Google Drive API](https://developers.google.com/drive)
- [GitHub Actions](https://docs.github.com/en/actions)
- [MDN - Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
