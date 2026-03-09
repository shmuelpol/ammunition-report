# אפליקציית ספירת מלאי תחמושת — Complete Project Index

## 📋 Overview

This is a **Progressive Web App (PWA)** for ammunition inventory management in military units, with:
- ✅ Hebrew RTL interface
- ✅ Local data storage (IndexedDB)
- ✅ **NEW:** Google Drive integration for file saving
- ✅ **NEW:** GitHub Pages deployment
- ✅ Excel/PDF export
- ✅ Mobile responsive design

---

## 🚀 Quick Access

### For First-Time Users
👉 **START HERE:** [QUICKSTART.md](./QUICKSTART.md)
- 5-minute setup
- Command cheat sheet
- Troubleshooting

### For Detailed Documentation
- **UI Design:** [docs/ui-spec.md](./docs/ui-spec.md) — Complete interface specification
- **Project Structure:** [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) — How code is organized
- **Google Drive Setup:** [mvp/GOOGLE_DRIVE_SETUP.md](./mvp/GOOGLE_DRIVE_SETUP.md) — Drive integration guide
- **Deployment:** [mvp/DEPLOYMENT.md](./mvp/DEPLOYMENT.md) — How to deploy
- **POC Summary:** [POC_SUMMARY.md](./POC_SUMMARY.md) — POC technical overview

### For Original Requirements
- **Architecture Context:** [ammo_app_architecture_context.md](./ammo_app_architecture_context.md) — Original spec

---

## 📁 Directory Structure

```
ammu-report/ (root)
│
├── 📄 QUICKSTART.md                 ← START HERE
├── 📄 PROJECT_STRUCTURE.md          ← Full architecture guide
├── 📄 POC_SUMMARY.md                ← POC details
├── 📄 ammo_app_architecture_context.md  ← Original requirements
│
├── docs/                            ← Documentation
│   ├── ui-spec.md                   ← UI specification
│   ├── architecture-spec.md         ← (Template) Architecture details
│   └── code-architecture.md         ← (Template) Code design
│
├── mvp/                             ← Main application
│   ├── src/
│   │   ├── domain/                  ← Business logic
│   │   ├── storage/                 ← Dexie + IndexedDB
│   │   ├── store/                   ← Zustand state management
│   │   ├── components/              ← React UI components
│   │   ├── integrations/            ← Google Drive API integration
│   │   ├── hooks/                   ← Custom React hooks
│   │   ├── export/                  ← Excel export
│   │   └── index.css                ← Global RTL/Hebrew styles
│   ├── public/
│   │   ├── manifest.json            ← PWA manifest
│   │   ├── sw.js                    ← Service worker
│   │   └── favicon.svg              ← Icon
│   ├── .github/
│   │   └── workflows/deploy.yml     ← GitHub Actions CI/CD
│   ├── scripts/deploy.js            ← Deploy helper
│   ├── .env.example                 ← Environment template
│   ├── GOOGLE_DRIVE_SETUP.md        ← Drive setup guide
│   ├── DEPLOYMENT.md                ← Deployment instructions
│   ├── README.md                    ← App readme
│   └── package.json                 ← Dependencies
│
└── actual-git-repo/                 ← (Placeholder for git clone)
```

---

## 🎯 Use Cases

### Case 1: Unit Commander Creates Report
1. Opens app at https://shmuelpol.github.io/ammunition-report/
2. Enters battalion, date, reporter name, unit name
3. Selects unit level (צוות/פלגה/סוללה)
4. Fills in ammunition by type and model
5. Clicks "סיכום ויצוא"
6. Exports to Excel or PDF
7. (Optional) Saves to Google Drive for backup

### Case 2: Platoon Gathers Sub-Unit Reports
1. Team leaders fill their reports independently
2. Save to their own Google Drive
3. Platoon leader opens app
4. (Future) Import team reports into platoon report
5. System merges totals
6. Exports consolidated report

### Case 3: Field Operations
1. Unit has no internet initially
2. Fills report locally (IndexedDB)
3. Internet available later
4. Clicks "שמור ל-Google Drive"
5. Report synced to cloud

---

## 🔧 Technology Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **UI** | React 18 + TypeScript | Component framework |
| **Styling** | CSS (RTL-first) | Global + scoped styles |
| **Build** | Vite 5 | Fast bundler |
| **State** | Zustand | Lightweight state management |
| **Storage** | Dexie + IndexedDB | Client-side database |
| **Export** | XLSX | Excel generation |
| **Integration** | Google Drive API | Cloud file saving |
| **Deployment** | GitHub Pages | Free static hosting |
| **CI/CD** | GitHub Actions | Automated builds |
| **PWA** | Service Worker | Installable + offline |

---

## ✨ Features

### Core Features
- ✅ **Session Setup** — Battalion, date, reporter, unit level, name
- ✅ **Ammunition Entry** — 5 types (shell, charge, fuse, primer, bullet)
- ✅ **Data-Driven Forms** — Generated from catalog
- ✅ **Hierarchical Input** — צוות → פלגה → סוללה (team → platoon → battery)
- ✅ **Automatic Calculation** — Totals per section, per type, grand total
- ✅ **Zero Handling** — Ammo types not entered show as 0 in reports
- ✅ **Draft Management** — Save/load/delete local drafts
- ✅ **Export Options** — Excel (detailed + summary), PDF/Print

### NEW: Google Drive Integration
- ✅ **OAuth 2.0 Authentication** — User's own Google account
- ✅ **Auto-Folder Creation** — "אפליקציית ספירת מלאי תחמושת" in user's Drive
- ✅ **File Saving** — Save report as JSON with timestamp
- ✅ **User Feedback** — Loading states, success/error messages
- ✅ **Security** — No backend needed, data stays in user's Drive

### NEW: GitHub Pages Deployment
- ✅ **GitHub Actions CI/CD** — Automatic build & deploy on push
- ✅ **Live URL** — https://shmuelpol.github.io/ammunition-report/
- ✅ **Free Hosting** — No server costs
- ✅ **HTTPS** — Secure by default
- ✅ **PWA Ready** — Installable on Android

### PWA Features
- ✅ **Installable** — Add to home screen (Android)
- ✅ **Offline Support** — Shell caching via service worker
- ✅ **RTL Support** — Full right-to-left interface
- ✅ **Responsive** — Works on phone, tablet, desktop

---

## 📊 Data Model

### Session
```
{
  id: string
  battalionNumber: string              // e.g., "334"
  reportDateTime: string               // ISO 8601
  reporterName: string                 // e.g., "ישראל כהן"
  unitLevel: "team" | "platoon" | "battery"
  unitName: string                     // e.g., "צוות א'"
  sections: Section[]
}
```

### Section (represents belly/outside/alpha/ramsaw)
```
{
  id: string
  type: "belly" | "outside" | "alpha" | "ramsaw"
  label: string
  parentGroup?: string                 // team name for team-level sections
  entries: {
    "shell": AmmoRow[]
    "charge": AmmoRow[]
    "fuse": AmmoRow[]
    "primer": AmmoRow[]
    "bullet": AmmoRow[]
  }
}
```

### AmmoRow (single entered item)
```
{
  id: string
  modelId: string                      // e.g., "shell-m107"
  modelName: string                    // e.g., "נפיץ M107"
  quantity: number
  serial?: string                      // only for charge (חנ"ה)
}
```

### Normalized Report (for export)
```
{
  sectionLabels: string[]              // All columns (בטן, חוץ, אלפ"א, רמסע)
  groupTotals: {
    "shell": GroupReport
    "charge": GroupReport
    ...
  }
  grandTotal: number
}
```

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 16+ with npm
- Git (for GitHub deployment)
- Modern browser (Chrome, Firefox, Safari, Edge)

### 2. Local Setup (5 minutes)
```bash
cd d:\miluim\ammu-report\mvp
npm install
npm run dev
# Visit http://localhost:3000
```

### 3. Optional: Configure Google Drive
See [mvp/GOOGLE_DRIVE_SETUP.md](./mvp/GOOGLE_DRIVE_SETUP.md)

### 4. Deploy to GitHub Pages
See [mvp/DEPLOYMENT.md](./mvp/DEPLOYMENT.md)

---

## 📖 Documentation Roadmap

| Document | Status | Purpose |
|----------|--------|---------|
| [QUICKSTART.md](./QUICKSTART.md) | ✅ Complete | 5-minute setup guide |
| [docs/ui-spec.md](./docs/ui-spec.md) | ✅ Complete | Full UI specification |
| [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md) | ✅ Complete | Code architecture |
| [mvp/README.md](./mvp/README.md) | ✅ Complete | App overview |
| [mvp/GOOGLE_DRIVE_SETUP.md](./mvp/GOOGLE_DRIVE_SETUP.md) | ✅ Complete | Drive integration |
| [mvp/DEPLOYMENT.md](./mvp/DEPLOYMENT.md) | ✅ Complete | Deployment guide |
| [POC_SUMMARY.md](./POC_SUMMARY.md) | ✅ Complete | POC technical details |
| [docs/architecture-spec.md](./docs/architecture-spec.md) | 📝 Template | (To be filled) Storage/sync |
| [docs/code-architecture.md](./docs/code-architecture.md) | 📝 Template | (To be filled) Code design |

---

## 🎓 Key Architectural Decisions

### 1. Catalog-Driven UI
- Ammunition types defined in one place
- Forms auto-generate from catalog
- Reports include all catalog items (even 0 values)
- **Benefit:** Easy to maintain and extend

### 2. Local-First with Cloud Option
- Primary: IndexedDB locally
- Optional: Google Drive for backup
- **Benefit:** Works offline, optional cloud sync

### 3. Layered Architecture
```
UI Components
    ↓
Zustand Store
    ↓
Domain Layer (Types, Business Logic)
    ↓
Storage Layer (Dexie, Integrations)
```
- **Benefit:** Each layer independent, testable, replaceable

### 4. Data Normalization
- Reports always include all catalog items
- Missing entries default to 0
- **Benefit:** Complies with requirement "unselected ammo appears as 0"

### 5. Server-Optional Design
- No backend required for MVP
- All data client-side
- **Benefit:** Cheap to host, quick to deploy, works offline

---

## 🔐 Security Model

### Current (MVP)
- ✅ OAuth 2.0 for Google Drive
- ✅ No passwords stored
- ✅ Data in user's own Google Drive
- ✅ No tracking/analytics

### Future Considerations
- [ ] Backend API for validation
- [ ] Firestore for multi-user real-time
- [ ] Approval workflows
- [ ] Audit logging
- [ ] User management

---

## 🐛 Known Limitations

| Limitation | Impact | Future Fix |
|-----------|--------|-----------|
| No multi-user sync | One user per session | Firestore or backend |
| No approval workflow | No authorization control | Add approval state |
| No audit trail | Can't track changes | Firestore audit logs |
| No merge logic implemented | Can't combine sub-unit reports | Implement merge function |
| No data encryption | Data visible in Drive JSON | Encrypt before save |

---

## 📱 Supported Platforms

| Platform | Status | Notes |
|----------|--------|-------|
| Chrome Desktop | ✅ Full | Development target |
| Firefox Desktop | ✅ Full | Tested |
| Safari Desktop | ✅ Full | Tested |
| Edge Desktop | ✅ Full | Tested |
| Chrome Mobile | ✅ PWA | Installable |
| Firefox Mobile | ✅ Mobile | No PWA install |
| Safari iOS | ⚠️ Limited | No PWA, IndexedDB issues |
| Internet Explorer | ❌ Not supported | Requires modern JS |

---

## 📝 Contributing

### Adding New Ammo Type
1. Edit `src/domain/catalog.ts`
2. Add to `ammoCatalog` array
3. Forms/reports auto-update

### Adding Export Format
1. Create new file in `src/export/`
2. Implement export function
3. Add button to `Summary.tsx`

### Fixing a Bug
1. Identify affected file
2. Write test (if applicable)
3. Fix and test locally
4. Commit with clear message
5. Push to `main` → auto-deploys

---

## 🎯 Success Metrics

### User Adoption
- [ ] Unit commanders can create report in <5 minutes
- [ ] Report can be exported to Excel
- [ ] Reports can be saved to Google Drive
- [ ] App is installable on Android

### Code Quality
- [ ] TypeScript strict mode
- [ ] No console errors
- [ ] Works offline (PWA shell)
- [ ] <2s startup time

### Technical
- [ ] Deploys automatically to GitHub Pages
- [ ] Build succeeds consistently
- [ ] No broken links in documentation
- [ ] All features documented

---

## 🤝 Support

### Getting Help
1. Check [QUICKSTART.md](./QUICKSTART.md) for common issues
2. Review [docs/ui-spec.md](./docs/ui-spec.md) for feature details
3. Look at code comments in `src/` files
4. Check browser DevTools console for errors

### Reporting Issues
- Create GitHub issue with:
  - Steps to reproduce
  - Expected vs actual behavior
  - Browser/OS version
  - Screenshots if applicable

### Requesting Features
- Open GitHub discussion or issue
- Describe use case
- Explain benefit
- Suggest implementation approach

---

## 📚 Additional Resources

### Learning Materials
- [React Docs](https://react.dev)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)
- [Vite Guide](https://vitejs.dev/)
- [MDN Web Docs](https://developer.mozilla.org/)

### API Documentation
- [Google Drive API](https://developers.google.com/drive)
- [GitHub Actions](https://docs.github.com/en/actions)
- [Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)

---

## 📞 Contact & Credits

### Project
- **Purpose:** Military unit ammunition inventory management
- **Technology:** React + TypeScript + Vite + Google Drive API
- **Hosting:** GitHub Pages
- **Version:** 0.2.0 (with Google Drive POC)

### Original  Requirements
- Reference: `ammo_app_architecture_context.md`
- Last Updated: March 8, 2026

---

## ✅ Checklist for New Users

- [ ] Read [QUICKSTART.md](./QUICKSTART.md)
- [ ] Install Node.js
- [ ] Clone or download project
- [ ] Run `npm install` in `mvp/`
- [ ] Run `npm run dev`
- [ ] Test creating a report
- [ ] Read [docs/ui-spec.md](./docs/ui-spec.md) for full feature list
- [ ] (Optional) Configure Google Drive per [GOOGLE_DRIVE_SETUP.md](./mvp/GOOGLE_DRIVE_SETUP.md)
- [ ] Deploy to GitHub Pages per [DEPLOYMENT.md](./mvp/DEPLOYMENT.md)

---

## 🎉 Summary

You now have:

✅ Complete MVP app for ammunition inventory management
✅ Google Drive integration for file saving
✅ GitHub Pages deployment ready
✅ Full documentation
✅ Production-ready code structure
✅ Ready for team testing and feedback

**Next Step:** 👉 Open [QUICKSTART.md](./QUICKSTART.md) and get started!
