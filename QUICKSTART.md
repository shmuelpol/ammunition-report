# 🚀 Quick Start Guide

## For Developers

### 1️⃣ Clone & Install
```bash
cd d:\miluim\ammu-report\mvp
npm install
```

### 2️⃣ Configure Google Drive (Optional)

Get OAuth Client ID from [Google Cloud Console](https://console.cloud.google.com/):
1. Create project
2. Enable Google Drive API
3. Create OAuth 2.0 Client (Web)
4. Add authorized origins: `http://localhost:3000`
5. Copy Client ID

Then:
```bash
cp .env.example .env.local
# Edit .env.local and add your Client ID
```

### 3️⃣ Start Development Server
```bash
npm run dev
# Visit http://localhost:3000
```

### 4️⃣ Test the App

- **Session Setup**: Enter battalion, date, reporter, unit level, name
- **Ammunition Entry**: Add some shell/charge/fuse/primer/bullet entries
- **Save Draft**: Click "💾 שמור טיוטה" 
- **Summary**: Click "📊 סיכום ויצוע"
- **Export**: Try Excel/PDF export
- **Drive (if configured)**: Click "🔓 התחבר ל-Google" → "💾 שמור ל-Google Drive"

---

## For Deployment

### Build for Production
```bash
npm run build
npm run preview  # Test locally first
```

### Deploy to GitHub Pages

**Option A: Automatic** (Recommended)
```bash
git add .
git commit -m "Your changes"
git push origin main
# GitHub Actions automatically deploys to gh-pages
```

**Option B: Manual**
```bash
npm run build
git subtree push --prefix=mvp/dist origin gh-pages
```

**Enable GitHub Pages:**
- Settings → Pages
- Source: Deploy from a branch
- Branch: `gh-pages` / `root`

**Live at:** https://shmuelpol.github.io/ammunition-report/

---

## Project Structure Overview

```
mvp/
├── src/
│   ├── domain/           ← Business logic (catalog, types, report model)
│   ├── storage/          ← IndexedDB wrapper (Dexie)
│   ├── store/            ← Zustand state management
│   ├── components/       ← React components
│   ├── integrations/     ← Google Drive API (NEW)
│   ├── hooks/            ← Custom hooks (NEW)
│   ├── export/           ← Excel export
│   └── index.css         ← Global styles (RTL, Hebrew)
├── public/
│   ├── manifest.json     ← PWA manifest
│   ├── sw.js             ← Service worker
│   └── favicon.svg       ← Icon
├── .github/workflows/deploy.yml  ← GitHub Actions
└── scripts/deploy.js     ← Deploy helper
```

---

## Key Files to Know

| File | Purpose |
|------|---------|
| `src/domain/catalog.ts` | Add new ammo types here |
| `src/store/useAppStore.ts` | Global state + mutations |
| `src/components/Summary.tsx` | Report + **NEW Google Drive section** |
| `src/integrations/googleDrive.ts` | **NEW** Drive API wrapper |
| `src/hooks/useGoogleDrive.ts` | **NEW** Drive React hook |
| `src/index.css` | Global RTL/Hebrew styles |
| `.env.example` | Environment template |
| `GOOGLE_DRIVE_SETUP.md` | Drive setup instructions |
| `DEPLOYMENT.md` | Deployment guide |
| `POC_SUMMARY.md` | POC documentation |
| `PROJECT_STRUCTURE.md` | This whole project explained |

---

## Common Commands

```bash
# Development
npm run dev              # Start dev server

# Production
npm run build            # Build for production
npm run preview          # Preview production build

# Deployment
npm run deploy           # Show deploy options
```

---

## Environment Variables

### For Google Drive Integration

**File: `.env.local` (development)**
```
VITE_GOOGLE_CLIENT_ID=your_client_id_here
```

**File: GitHub Secrets (for CI/CD)**
- Settings → Secrets and variables → Actions
- Create: `GOOGLE_CLIENT_ID` = your client ID

---

## Troubleshooting

### Issue: "Google is not defined"
**Fix:** Check `VITE_GOOGLE_CLIENT_ID` is set in `.env.local`

### Issue: OAuth unauthorized
**Fix:** Add `http://localhost:3000` to Google Cloud Console authorized origins

### Issue: File not saving to Drive
**Fix:** Verify Google Drive API is enabled in Google Cloud Console

### Issue: Build fails
**Fix:** 
```bash
npm ci          # Clean install
npm run build   # Try again
```

### Issue: GitHub Pages shows blank page
**Fix:** 
- Hard refresh (Ctrl+Shift+R)
- Check browser console for errors
- Verify gh-pages branch has files

---

## Next Steps

### For Local Development
1. ✅ Install dependencies
2. ✅ Start dev server
3. ✅ Test all features
4. ✅ Add Google Drive Client ID (optional)
5. ✅ Create sample reports
6. ✅ Test export (Excel/PDF)

### For Team Testing
1. Deploy to GitHub Pages (see above)
2. Share URL: https://shmuelpol.github.io/ammunition-report/
3. Show Google Drive integration
4. Gather feedback

### For Production
1. Set up Google Drive Client ID restrictions
2. Add backend validation service
3. Set up Firestore for multi-user collaboration
4. Add approval workflows
5. Implement audit logging

---

## Documentation

| Document | Purpose |
|----------|---------|
| [docs/ui-spec.md](./docs/ui-spec.md) | Complete UI design specification |
| [GOOGLE_DRIVE_SETUP.md](./GOOGLE_DRIVE_SETUP.md) | How to configure Google Drive |
| [DEPLOYMENT.md](./DEPLOYMENT.md) | How to deploy to GitHub Pages |
| [POC_SUMMARY.md](../POC_SUMMARY.md) | POC overview & technical details |
| [PROJECT_STRUCTURE.md](../PROJECT_STRUCTURE.md) | Project architecture explained |
| [README.md](./README.md) | Main project readme |

---

## Support & Issues

### Debugging
```bash
# Check for TypeScript errors
npx tsc --noEmit

# Check for build issues
npm run build

# View browser console for frontend errors
F12 (DevTools)
```

### Check GitHub Actions Logs
- Go to repo → Actions tab
- View latest workflow run
- Expand jobs to see build output

### Ask Questions
- Check documentation files
- Review comments in source code
- Look for TODO/FIXME comments

---

## Success Criteria ✅

After setup, you should be able to:

- [ ] Run `npm run dev` without errors
- [ ] See app at http://localhost:3000
- [ ] Create and save a report to IndexedDB
- [ ] Export to Excel
- [ ] Print/PDF export
- [ ] (If Drive configured) Save reports to Google Drive
- [ ] Build successfully with `npm run build`
- [ ] Deploy to GitHub Pages
- [ ] Access production at https://shmuelpol.github.io/ammunition-report/

---

## 🎉 You're Ready!

The MVP is fully functional and ready for:
- 👨‍💻 Development and customization
- 👥 Team testing and feedback
- 🚀 Production deployment
- 📱 Mobile usage (PWA installable)
- 💾 File saving to Google Drive

Happy coding! 🚀
