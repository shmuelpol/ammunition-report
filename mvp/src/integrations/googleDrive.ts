/**
 * Google Drive integration service — using Google Identity Services (GIS)
 * The legacy gapi.auth2 was retired by Google. This uses the modern token client.
 */

declare global {
  interface Window {
    gapi?: any;
    google?: any;
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const FOLDER_NAME = 'אפליקציית ספירת מלאי תחמושת';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';

/**
 * Check if Google Drive integration is configured
 */
export function isGoogleDriveConfigured(): boolean {
  return CLIENT_ID.length > 0;
}

export interface GoogleAuthStatus {
  isSignedIn: boolean;
  user: {
    email: string;
    name: string;
  } | null;
}

export interface SaveResult {
  success: boolean;
  fileId?: string;
  error?: string;
}

let tokenClient: any = null;
let accessToken: string | null = null;
let gapiLoaded = false;
let gisLoaded = false;

// Callback that the hook will set to be notified when sign-in completes
let onSignInCallback: ((status: GoogleAuthStatus) => void) | null = null;

export function setOnSignInCallback(cb: ((status: GoogleAuthStatus) => void) | null) {
  onSignInCallback = cb;
}

/**
 * Load the gapi client and the Drive discovery doc
 */
function loadGapiClient(): Promise<void> {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi.load('client', async () => {
        await window.gapi.client.init({});
        await window.gapi.client.load('https://www.googleapis.com/discovery/v1/apis/drive/v3/rest');
        gapiLoaded = true;
        resolve();
      });
    };
    document.head.appendChild(script);
  });
}

/**
 * Load the GIS token client
 */
function loadGisClient(): Promise<void> {
  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.onload = () => {
      tokenClient = window.google.accounts.oauth2.initTokenClient({
        client_id: CLIENT_ID,
        scope: SCOPES,
        callback: async (tokenResponse: any) => {
          if (tokenResponse.error) {
            console.error('Token error:', tokenResponse.error);
            return;
          }
          accessToken = tokenResponse.access_token;

          // Fetch user info
          try {
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            const info = await res.json();
            const status: GoogleAuthStatus = {
              isSignedIn: true,
              user: { email: info.email, name: info.name || info.email },
            };
            if (onSignInCallback) onSignInCallback(status);
          } catch {
            const status: GoogleAuthStatus = {
              isSignedIn: true,
              user: { email: 'unknown', name: 'unknown' },
            };
            if (onSignInCallback) onSignInCallback(status);
          }
        },
      });
      gisLoaded = true;
      resolve();
    };
    document.head.appendChild(script);
  });
}

/**
 * Initialize both libraries
 */
export async function initGoogleDrive(): Promise<void> {
  if (!CLIENT_ID) return;
  await Promise.all([loadGapiClient(), loadGisClient()]);
}

/**
 * Request an access token (opens Google sign-in popup)
 */
export function signInGoogleDrive(): void {
  if (!tokenClient) {
    console.error('Google Identity Services not loaded');
    return;
  }
  // If we already have a token, request silently; otherwise show consent
  if (accessToken) {
    tokenClient.requestAccessToken({ prompt: '' });
  } else {
    tokenClient.requestAccessToken({ prompt: 'consent' });
  }
}

/**
 * Sign out — revoke the token
 */
export function signOutGoogleDrive(): void {
  if (accessToken) {
    window.google.accounts.oauth2.revoke(accessToken);
    accessToken = null;
  }
}

/**
 * Save a report to Google Drive as JSON
 */
export async function saveReportToDrive(reportData: any, fileName: string): Promise<SaveResult> {
  if (!accessToken || !gapiLoaded) {
    return { success: false, error: 'Not signed in to Google Drive' };
  }

  try {
    const folderId = await getOrCreateFolder(FOLDER_NAME);
    const fileContent = JSON.stringify(reportData, null, 2);

    // Use multipart upload for file + metadata
    const boundary = '-------batch_boundary';
    const metadata = {
      name: fileName,
      parents: [folderId],
      mimeType: 'application/json',
    };

    const body =
      `--${boundary}\r\n` +
      `Content-Type: application/json; charset=UTF-8\r\n\r\n` +
      `${JSON.stringify(metadata)}\r\n` +
      `--${boundary}\r\n` +
      `Content-Type: application/json\r\n\r\n` +
      `${fileContent}\r\n` +
      `--${boundary}--`;

    const response = await fetch(
      'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,webViewLink',
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': `multipart/related; boundary=${boundary}`,
        },
        body,
      },
    );

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || `HTTP ${response.status}`);
    }

    const result = await response.json();
    return { success: true, fileId: result.id };
  } catch (err: any) {
    console.error('Failed to save to Drive:', err);
    return { success: false, error: err.message || 'Failed to save' };
  }
}

/**
 * Get or create a folder in user's drive
 */
async function getOrCreateFolder(folderName: string): Promise<string> {
  // Search for existing folder
  const searchRes = await fetch(
    `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(
      `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
    )}&spaces=drive&fields=files(id)&pageSize=1`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  const searchData = await searchRes.json();

  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Create new folder
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files?fields=id', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });
  const createData = await createRes.json();
  return createData.id;
}
