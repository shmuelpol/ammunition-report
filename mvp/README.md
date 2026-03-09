# אפליקציית ספירת מלאי תחמושת — POC with Google Drive Integration

## 📱 מה זה?

אפליקציית PWA לספירת מלאי תחמושת ביחידה צבאית, עם יכולת שמירה ישירה ל-Google Drive.

## 🚀 התחלה מהירה

### Local Development
```bash
cd mvp
npm install
npm run dev
# Open http://localhost:3000
```

### Deploy to GitHub Pages
```bash
npm run build
git subtree push --prefix=mvp/dist origin gh-pages
```

**Live URL:** https://shmuelpol.github.io/ammunition-report/

---

## ✨ תכונות

### ✅ Implemented
- ✓ מסך כניסה (דוח, מדווח, רמה, יחידה)
- ✓ הזנת חימושים (פגז, חנ"ה, מרעום, תחלים, קליעית)
- ✓ RTL + עברית מלאה
- ✓ לשוניות לפי רמה (צוות/פלגה/סוללה)
- ✓ סיכום מלא עם טוטאלים וגם 0 לחימושים שלא הוזנו
- ✓ יצוא ל-Excel (שתי לשוניות: פירוט + סיכום)
- ✓ הדפסה/PDF
- ✓ שמירת טיוטות ב-IndexedDB
- ✓ טעינה של טיוטות שמורות
- ✓ PWA installable (manifest + service worker)

### 🆕 NEW: Google Drive Integration
- ✓ **"חבר ל-Google" button** — OAuth 2.0 authentication
- ✓ **"שמור ל-Google Drive"** — Save reports directly to user's Drive
- ✓ Auto-creates folder: "אפליקציית ספירת מלאי תחמושת"
- ✓ Files saved as JSON with timestamp
- ✓ User can access reports from their Drive account

---

## 🎯 Google Drive POC

### How It Works

1. **Authentication**
   - User clicks "🔓 התחבר ל-Google" on summary page
   - OAuth popup → User grants permission
   - Connection persists for the session

2. **Save Report**
   - User fills out report
   - Clicks "💾 שמור ל-Google Drive"
   - Report metadata is saved as JSON file
   - File appears in user's Drive under "אפליקציית ספירת מלאי תחמושת" folder

3. **File Structure**
   ```
   My Drive
   └── אפליקציית ספירת מלאי תחמושת
       ├── דוח_תחמושת_צוות א'_2026-03-09T14-30.json
       ├── דוח_תחמושת_פלגה 1_2026-03-09T15-45.json
       └── דוח_תחמושת_סוללה_2026-03-09T16-00.json
   ```

### Setup Instructions

1. **Get Google API Credentials**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create new project
   - Enable Google Drive API
   - Create OAuth 2.0 Client ID
   - Authorized origins: `http://localhost:3000` + `https://shmuelpol.github.io`

2. **Configure Locally**
   ```bash
   cp .env.example .env.local
   # Add your Client ID to .env.local
   VITE_GOOGLE_CLIENT_ID=your_client_id_here
   ```

3. **Test**
   ```bash
   npm run dev
   # Create a report and save to Drive
   ```

### File: `src/integrations/googleDrive.ts`
- Core Google Drive API wrapper
- Functions: `initGoogleDrive()`, `signInGoogleDrive()`, `saveReportToDrive()`
- Auto-creates folder if it doesn't exist
- Handles OAuth and file uploads

### File: `src/hooks/useGoogleDrive.ts`
- React hook for Google Drive integration
- Manages auth state, sign-in/out, save operations
- Provides loading and error states

### UI Changes in Summary Component
- Google Drive section below export buttons
- Sign-in button or user info + save button
- Status messages (saving, success, error)

---

## 📦 Architecture

### Layers

```
UI Components (React)
    ↓
Zustand Store (State Management)
    ↓
Domain Layer (Types, Catalog, Report Model)
    ↓
Storage Layer (IndexedDB via Dexie)
Export Layer (Excel, PDF)
Integrations (Google Drive, PWA)
```

### Key Files

- `src/domain/types.ts` — Type definitions
- `src/domain/catalog.ts` — Ammunition catalog
- `src/domain/reportModel.ts` — Normalization logic (ensures 0 for missing items)
- `src/store/useAppStore.ts` — Zustand store
- `src/storage/db.ts` — IndexedDB with Dexie
- `src/integrations/googleDrive.ts` — **NEW** Google Drive API
- `src/components/Summary.tsx` — **UPDATED** with Drive section
- `src/export/excelExport.ts` — Excel export

---

## 🌐 GitHub Pages Deployment

### Automatic (GitHub Actions)
```yaml
# .github/workflows/deploy.yml
# Automatically deploys on push to main branch
```

### Manual
```bash
npm run build
git subtree push --prefix=mvp/dist origin gh-pages
```

### Enable in GitHub
Settings → Pages → Deploy from a branch → `gh-pages` / `root`

---

## 🔐 Security & Privacy

- ✓ OAuth 2.0 — Users authenticate with their own Google accounts
- ✓ Client-side only — No backend server needed
- ✓ Data stays in user's Drive — App doesn't store anything
- ✓ No tracking, no analytics
- ⚠️ For production: Add server-side validation, user management, audit logs

---

## 📝 Next Steps (Future)

- [ ] Import reports from Google Drive
- [ ] Merge sub-unit reports (צוות → פלגה → סוללה)
- [ ] Real-time multi-user collaboration (Firestore)
- [ ] Approval workflows
- [ ] Audit trail and versioning
- [ ] Mobile app (React Native)
- [ ] Offline sync when connectivity returns

---

## 🛠️ Local Development

### Commands
```bash
npm run dev        # Start dev server
npm run build      # Build for production
npm run preview    # Preview production build
npm run deploy     # Build + show deploy instructions
```

### Dependencies
- React 18
- TypeScript 5.5
- Vite 5
- Zustand (state)
- Dexie (IndexedDB)
- XLSX (Excel export)

---

## 📄 Documentation

- [אפיון ממשק משתמש](../docs/ui-spec.md) — Full UI specification
- [GOOGLE_DRIVE_SETUP.md](./GOOGLE_DRIVE_SETUP.md) — Drive integration setup
- [DEPLOYMENT.md](./DEPLOYMENT.md) — Deployment instructions

---

## 🐛 Troubleshooting

**Google Drive button not showing?**
- Check that `VITE_GOOGLE_CLIENT_ID` env var is set
- Check browser console for errors
- Verify authorized origins in Google Cloud Console

**Files not saving?**
- Check network tab in DevTools
- Verify Google Drive API is enabled
- Check OAuth scopes

**PWA not installing?**
- Must be accessed over HTTPS (works on GitHub Pages, not localhost)
- Check manifest.json and service worker
- Some browsers require explicit install prompt

---

## 👤 Credits

- Developed as MVP for ammunition inventory management
- Built with React + TypeScript + Vite
- Designed for Hebrew + RTL
- Military-inspired color scheme
