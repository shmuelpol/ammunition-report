# Deployment Instructions

## GitHub Pages Setup

### Option 1: Using GitHub Actions (Automatic)

1. Push code to `main` branch
2. GitHub Actions will automatically build and deploy to gh-pages
3. Enable GitHub Pages in repository settings:
   - Settings → Pages → Build and deployment
   - Source: Deploy from a branch
   - Branch: `gh-pages` / `root`

### Option 2: Manual Deployment

```bash
# Build the application
npm run build

# Deploy to gh-pages branch
git subtree push --prefix=mvp/dist origin gh-pages
```

## URL

Once deployed, the app will be available at:
```
https://shmuelpol.github.io/ammunition-report/
```

## Environment Variables

The app requires a `.env.local` file locally (or GitHub Secrets for CI/CD):

```
VITE_GOOGLE_CLIENT_ID=your_google_client_id
```

For GitHub Actions, add repository secrets in:
Settings → Secrets and variables → Actions

Then reference in workflow:
```yaml
env:
  VITE_GOOGLE_CLIENT_ID: ${{ secrets.GOOGLE_CLIENT_ID }}
```

## Base Path Configuration

The app is served from `/ammunition-report/` on GitHub Pages.
If needed for routing, configure in `vite.config.ts`:
```typescript
export default defineConfig({
  base: '/ammunition-report/',
  ...
});
```

## Troubleshooting

- **Blank page on GitHub Pages**: Check browser console for errors
- **Google Drive not loading**: Verify VITE_GOOGLE_CLIENT_ID is set correctly
- **OAuth fails**: Ensure authorized origin is added to Google Cloud Console
- **File downloads fail**: Check CORS and service worker cache

## Development Server

```bash
npm run dev
# Visit http://localhost:3000
```

## Production Build

```bash
npm run build
# Output in dist/
npm run preview
# Preview the production build
```
