/**
 * Google Drive integration — GIS auth + full file operations.
 * Works with a specific shared folder named "ammunition-report".
 */

declare global {
  interface Window {
    gapi?: any;
    google?: any;
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const SHARED_FOLDER_NAME = 'ammunition-report';
const TEMPLATE_FILE_NAME = 'ammunition-types.csv';
const SCOPES = 'https://www.googleapis.com/auth/drive.file https://www.googleapis.com/auth/drive.readonly';

// ===== Types =====

export interface GoogleAuthStatus {
  isSignedIn: boolean;
  user: { email: string; name: string } | null;
}

export interface SaveResult {
  success: boolean;
  fileId?: string;
  error?: string;
}

export interface DriveFile {
  id: string;
  name: string;
  mimeType: string;
  modifiedTime?: string;
}

// ===== State =====

let tokenClient: any = null;
let accessToken: string | null = null;
let gisLoaded = false;

let onSignInCallback: ((status: GoogleAuthStatus) => void) | null = null;
let sharedFolderId: string | null = null;

export function setOnSignInCallback(cb: ((status: GoogleAuthStatus) => void) | null) {
  onSignInCallback = cb;
}

export function isGoogleDriveConfigured(): boolean {
  return CLIENT_ID.length > 0;
}

export function getAccessToken(): string | null {
  return accessToken;
}

// ===== Init =====

function loadGisClient(): Promise<void> {
  return new Promise((resolve) => {
    if (gisLoaded) { resolve(); return; }
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
          try {
            const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
              headers: { Authorization: `Bearer ${accessToken}` },
            });
            const info = await res.json();
            if (onSignInCallback) {
              onSignInCallback({
                isSignedIn: true,
                user: { email: info.email, name: info.name || info.email },
              });
            }
          } catch {
            if (onSignInCallback) {
              onSignInCallback({ isSignedIn: true, user: { email: 'unknown', name: 'unknown' } });
            }
          }
        },
      });
      gisLoaded = true;
      resolve();
    };
    document.head.appendChild(script);
  });
}

export async function initGoogleDrive(): Promise<void> {
  if (!CLIENT_ID) return;
  await loadGisClient();
}

export function signInGoogleDrive(): void {
  if (!tokenClient) return;
  if (accessToken) {
    tokenClient.requestAccessToken({ prompt: '' });
  } else {
    tokenClient.requestAccessToken({ prompt: 'consent' });
  }
}

export function signOutGoogleDrive(): void {
  if (accessToken) {
    window.google.accounts.oauth2.revoke(accessToken);
    accessToken = null;
    sharedFolderId = null;
  }
}

// ===== Core Drive helpers =====

async function driveGet(url: string): Promise<any> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error?.message || `Drive API ${res.status}`);
  }
  return res.json();
}

async function driveGetText(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Drive API ${res.status}`);
  return res.text();
}

// ===== Shared Folder =====

/**
 * Find the shared "ammunition-report" folder.
 * Searches both owned and shared-with-me folders.
 */
export async function findSharedFolder(): Promise<string | null> {
  if (sharedFolderId) return sharedFolderId;

  const q = encodeURIComponent(
    `name='${SHARED_FOLDER_NAME}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
  );
  const data = await driveGet(
    `https://www.googleapis.com/drive/v3/files?q=${q}&spaces=drive&fields=files(id,name)&pageSize=5&includeItemsFromAllDrives=true&supportsAllDrives=true`,
  );

  if (data.files && data.files.length > 0) {
    sharedFolderId = data.files[0].id;
    return sharedFolderId;
  }
  return null;
}

// ===== Template =====

/**
 * Load the ammunition-types.csv template from the shared folder.
 * Returns the raw CSV text, or null if not found.
 */
export async function loadTemplateFromDrive(): Promise<string | null> {
  const folderId = await findSharedFolder();
  if (!folderId) return null;

  const q = encodeURIComponent(
    `name='${TEMPLATE_FILE_NAME}' and '${folderId}' in parents and trashed=false`,
  );
  const data = await driveGet(
    `https://www.googleapis.com/drive/v3/files?q=${q}&spaces=drive&fields=files(id,name)&pageSize=1`,
  );

  if (!data.files || data.files.length === 0) return null;

  const fileId = data.files[0].id;
  return driveGetText(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`);
}

// ===== Unit file operations =====

/**
 * List all unit config files in the shared folder.
 */
export async function listUnitsFromDrive(): Promise<DriveFile[]> {
  const folderId = await findSharedFolder();
  if (!folderId) return [];

  const q = encodeURIComponent(
    `'${folderId}' in parents and name contains '-config.json' and trashed=false`,
  );
  const data = await driveGet(
    `https://www.googleapis.com/drive/v3/files?q=${q}&spaces=drive&fields=files(id,name,modifiedTime)&pageSize=100&orderBy=modifiedTime desc`,
  );
  return data.files || [];
}

/**
 * Read a JSON file from Drive by ID.
 */
export async function readJsonFile(fileId: string): Promise<any> {
  const text = await driveGetText(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`);
  return JSON.parse(text);
}

/**
 * Read a file by name from the shared folder.
 */
export async function readFileByName(fileName: string): Promise<any | null> {
  const folderId = await findSharedFolder();
  if (!folderId) return null;

  const q = encodeURIComponent(
    `name='${fileName}' and '${folderId}' in parents and trashed=false`,
  );
  const data = await driveGet(
    `https://www.googleapis.com/drive/v3/files?q=${q}&spaces=drive&fields=files(id)&pageSize=1`,
  );
  if (!data.files || data.files.length === 0) return null;

  const text = await driveGetText(
    `https://www.googleapis.com/drive/v3/files/${data.files[0].id}?alt=media`,
  );
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

/**
 * Create or update a file in the shared folder.
 * If a file with the same name exists, it is overwritten.
 */
export async function writeFileToDrive(
  fileName: string,
  content: string,
  mimeType: string = 'application/json',
): Promise<SaveResult> {
  if (!accessToken) return { success: false, error: 'Not signed in' };

  const folderId = await findSharedFolder();
  if (!folderId) return { success: false, error: 'Shared folder not found' };

  try {
    // Check if file already exists
    const q = encodeURIComponent(
      `name='${fileName}' and '${folderId}' in parents and trashed=false`,
    );
    const existing = await driveGet(
      `https://www.googleapis.com/drive/v3/files?q=${q}&spaces=drive&fields=files(id)&pageSize=1`,
    );

    if (existing.files && existing.files.length > 0) {
      // Update existing file
      const fileId = existing.files[0].id;
      const res = await fetch(
        `https://www.googleapis.com/upload/drive/v3/files/${fileId}?uploadType=media&fields=id`,
        {
          method: 'PATCH',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': mimeType,
          },
          body: content,
        },
      );
      if (!res.ok) throw new Error(`Update failed: ${res.status}`);
      const result = await res.json();
      return { success: true, fileId: result.id };
    } else {
      // Create new file
      const boundary = '-------upload_boundary';
      const metadata = { name: fileName, parents: [folderId], mimeType };
      const body =
        `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n` +
        `${JSON.stringify(metadata)}\r\n` +
        `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n` +
        `${content}\r\n--${boundary}--`;

      const res = await fetch(
        'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': `multipart/related; boundary=${boundary}`,
          },
          body,
        },
      );
      if (!res.ok) throw new Error(`Create failed: ${res.status}`);
      const result = await res.json();
      return { success: true, fileId: result.id };
    }
  } catch (err: any) {
    console.error('Drive write error:', err);
    return { success: false, error: err.message || 'Failed to write' };
  }
}

// ===== High-level unit operations =====

/**
 * Save unit config JSON to Drive.
 */
export async function saveUnitConfig(unitName: string, config: any): Promise<SaveResult> {
  const safeName = unitName.replace(/[\\/:*?"<>|]/g, '_');
  return writeFileToDrive(`${safeName}-config.json`, JSON.stringify(config, null, 2));
}

/**
 * Save unit data JSON (app state) to Drive.
 */
export async function saveUnitData(unitName: string, data: any): Promise<SaveResult> {
  const safeName = unitName.replace(/[\\/:*?"<>|]/g, '_');
  return writeFileToDrive(`${safeName}-data.json`, JSON.stringify(data, null, 2));
}

/**
 * Save human-readable CSV report to Drive.
 */
export async function saveUnitCSV(unitName: string, csvContent: string): Promise<SaveResult> {
  const safeName = unitName.replace(/[\\/:*?"<>|]/g, '_');
  // Add BOM for Excel Hebrew support
  const bom = '\uFEFF';
  return writeFileToDrive(`${safeName}-report.csv`, bom + csvContent, 'text/csv');
}

/**
 * Load unit config from Drive.
 */
export async function loadUnitConfig(unitName: string): Promise<any | null> {
  const safeName = unitName.replace(/[\\/:*?"<>|]/g, '_');
  return readFileByName(`${safeName}-config.json`);
}

/**
 * Load unit data from Drive.
 */
export async function loadUnitData(unitName: string): Promise<any | null> {
  const safeName = unitName.replace(/[\\/:*?"<>|]/g, '_');
  return readFileByName(`${safeName}-data.json`);
}
