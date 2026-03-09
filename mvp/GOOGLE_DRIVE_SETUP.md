# Google Drive Integration Guide

## Setup

1. **Create OAuth 2.0 Credentials**
   - Go to [Google Cloud Console](https://console.cloud.google.com/)
   - Create a new project for "Ammunition Report"
   - Enable the Google Drive API
   - Create an OAuth 2.0 Client ID (type: Web application)
   - Add authorized JavaScript origins: `http://localhost:3000` and `https://shmuelpol.github.io`
   - Copy the Client ID

2. **Configure Environment**
   ```bash
   cp .env.example .env.local
   ```
   - Add your Google Client ID to `.env.local`:
   ```
   VITE_GOOGLE_CLIENT_ID=your_client_id_here
   ```

3. **Run Locally**
   ```bash
   npm run dev
   ```

## Usage

1. User clicks "🔓 התחבר ל-Google" on the summary screen
2. Authenticates with their Google account
3. At the end of the report, clicks "💾 שמור ל-Google Drive"
4. Report is saved as JSON in "אפליקציית ספירת מלאי תחמושת" folder
5. User can access reports from their Google Drive

## File Structure

Reports are saved as:
```
My Drive
└── אפליקציית ספירת מלאי תחמושת
    ├── דוח_תחמושת_צוות א'_2026-03-09T14-30.json
    ├── דוח_תחמושת_פלגה 1_2026-03-09T15-45.json
    └── ...
```

## Security Notes

- OAuth 2.0 credentials are public (embedded in JS)
- Users authenticate with their own Google accounts
- Files are saved to their personal Google Drive
- Server-side validation would be needed for production multi-user scenarios
