/**
 * Google Drive integration — GIS auth + Picker API + drive.file scope only.
 * Binary file upload/download for Excel workbooks.
 */

declare global {
  interface Window {
    gapi?: any;
    google?: any;
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY || '';
const APP_ID = import.meta.env.VITE_GOOGLE_APP_ID || '';
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const FOLDER_KEY = 'ammo-drive-folder-id';

// ===== Types =====

export interface GoogleAuthStatus {
  isSignedIn: boolean;
  user: { email: string; name: string } | null;
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
let pickerLoaded = false;
let onSignInCallback: ((status: GoogleAuthStatus) => void) | null = null;
let currentUserEmail = '';

export function setOnSignInCallback(cb: ((status: GoogleAuthStatus) => void) | null) {
  onSignInCallback = cb;
}

export function isGoogleDriveConfigured(): boolean {
  return CLIENT_ID.length > 0;
}

export function getAccessToken(): string | null {
  return accessToken;
}

export function getUserEmail(): string {
  return currentUserEmail;
}

// ===== Folder ID in localStorage =====

export function getSavedFolderId(): string | null {
  return localStorage.getItem(FOLDER_KEY);
}

export function saveFolderId(id: string): void {
  localStorage.setItem(FOLDER_KEY, id);
}

export function clearFolderId(): void {
  localStorage.removeItem(FOLDER_KEY);
}

// ===== Script loading =====

function loadGisClient(): Promise<void> {
  return new Promise((resolve) => {
    if (gisLoaded) {
      resolve();
      return;
    }
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
            currentUserEmail = info.email || 'unknown';
            onSignInCallback?.({
              isSignedIn: true,
              user: { email: info.email, name: info.name || info.email },
            });
          } catch {
            onSignInCallback?.({
              isSignedIn: true,
              user: { email: 'unknown', name: 'unknown' },
            });
          }
        },
      });
      gisLoaded = true;
      resolve();
    };
    document.head.appendChild(script);
  });
}

function loadPickerApi(): Promise<void> {
  return new Promise((resolve) => {
    if (pickerLoaded) {
      resolve();
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/api.js';
    script.onload = () => {
      window.gapi.load('picker', () => {
        pickerLoaded = true;
        resolve();
      });
    };
    document.head.appendChild(script);
  });
}

// ===== Init / Auth =====

export async function initGoogleDrive(): Promise<void> {
  if (!CLIENT_ID) return;
  await loadGisClient();
  if (API_KEY) {
    await loadPickerApi();
  }
}

export function signInGoogleDrive(): void {
  if (!tokenClient) return;
  tokenClient.requestAccessToken({ prompt: accessToken ? '' : 'consent' });
}

export function signOutGoogleDrive(): void {
  if (accessToken) {
    window.google.accounts.oauth2.revoke(accessToken);
    accessToken = null;
    currentUserEmail = '';
  }
}

export function isPickerAvailable(): boolean {
  return pickerLoaded && !!API_KEY;
}

// ===== Google Picker =====

export function openFolderPicker(): Promise<string | null> {
  return new Promise((resolve) => {
    if (!pickerLoaded || !accessToken) {
      resolve(null);
      return;
    }
    const view = new window.google.picker.DocsView(window.google.picker.ViewId.FOLDERS)
      .setSelectFolderEnabled(true)
      .setMimeTypes('application/vnd.google-apps.folder');

    new window.google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(accessToken)
      .setDeveloperKey(API_KEY)
      .setAppId(APP_ID)
      .setTitle('בחר תיקייה')
      .setCallback((data: any) => {
        if (data.action === window.google.picker.Action.PICKED) {
          resolve(data.docs[0].id);
        } else if (data.action === window.google.picker.Action.CANCEL) {
          resolve(null);
        }
      })
      .build()
      .setVisible(true);
  });
}

export function openFilePicker(mimeTypes?: string): Promise<{ id: string; name: string } | null> {
  return new Promise((resolve) => {
    if (!pickerLoaded || !accessToken) {
      resolve(null);
      return;
    }
    const view = new window.google.picker.DocsView().setIncludeFolders(false);
    if (mimeTypes) view.setMimeTypes(mimeTypes);

    new window.google.picker.PickerBuilder()
      .addView(view)
      .setOAuthToken(accessToken)
      .setDeveloperKey(API_KEY)
      .setAppId(APP_ID)
      .setTitle('בחר קובץ')
      .setCallback((data: any) => {
        if (data.action === window.google.picker.Action.PICKED) {
          resolve({ id: data.docs[0].id, name: data.docs[0].name });
        } else if (data.action === window.google.picker.Action.CANCEL) {
          resolve(null);
        }
      })
      .build()
      .setVisible(true);
  });
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

// ===== Folder operations =====

export async function createFolder(name: string, parentId?: string): Promise<string> {
  const metadata: Record<string, any> = {
    name,
    mimeType: 'application/vnd.google-apps.folder',
  };
  if (parentId) metadata.parents = [parentId];

  const res = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(metadata),
  });
  if (!res.ok) throw new Error(`Create folder failed: ${res.status}`);
  const data = await res.json();
  return data.id;
}

export async function ensureSubfolder(parentId: string, name: string): Promise<string> {
  const q = encodeURIComponent(
    `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
  );
  const data = await driveGet(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id)&pageSize=1`,
  );
  if (data.files && data.files.length > 0) {
    return data.files[0].id;
  }
  return createFolder(name, parentId);
}

export async function validateFolder(folderId: string): Promise<boolean> {
  try {
    await driveGet(
      `https://www.googleapis.com/drive/v3/files/${folderId}?fields=id,name,mimeType`,
    );
    return true;
  } catch {
    return false;
  }
}

// ===== File operations =====

export async function listSubfolders(parentId: string): Promise<DriveFile[]> {
  const q = encodeURIComponent(
    `'${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`,
  );
  const data = await driveGet(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,modifiedTime)&pageSize=100&orderBy=name`,
  );
  return data.files || [];
}

export async function findFile(parentId: string, fileName: string): Promise<DriveFile | null> {
  const q = encodeURIComponent(
    `name='${fileName}' and '${parentId}' in parents and trashed=false`,
  );
  const data = await driveGet(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,mimeType,modifiedTime)&pageSize=1`,
  );
  if (data.files && data.files.length > 0) return data.files[0];
  return null;
}

export async function readFileAsBuffer(fileId: string): Promise<ArrayBuffer> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`,
    { headers: { Authorization: `Bearer ${accessToken}` } },
  );
  if (!res.ok) throw new Error(`Drive API ${res.status}`);
  return res.arrayBuffer();
}

export async function writeBinaryFile(
  fileName: string,
  data: ArrayBuffer,
  mimeType: string,
  parentId: string,
  existingFileId?: string,
): Promise<string> {
  if (!accessToken) throw new Error('Not signed in');

  if (existingFileId) {
    const res = await fetch(
      `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=media&fields=id`,
      {
        method: 'PATCH',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': mimeType,
        },
        body: data,
      },
    );
    if (!res.ok) throw new Error(`Update failed: ${res.status}`);
    return (await res.json()).id;
  }

  // Multipart upload for new file
  const metadata = JSON.stringify({ name: fileName, parents: [parentId] });
  const boundary = '-------ammo_upload_boundary';

  const encoder = new TextEncoder();
  const metaPart = encoder.encode(
    `--${boundary}\r\nContent-Type: application/json; charset=UTF-8\r\n\r\n${metadata}\r\n`,
  );
  const binHeader = encoder.encode(
    `--${boundary}\r\nContent-Type: ${mimeType}\r\n\r\n`,
  );
  const ending = encoder.encode(`\r\n--${boundary}--`);

  const body = new Uint8Array(metaPart.length + binHeader.length + data.byteLength + ending.length);
  body.set(metaPart, 0);
  body.set(binHeader, metaPart.length);
  body.set(new Uint8Array(data), metaPart.length + binHeader.length);
  body.set(ending, metaPart.length + binHeader.length + data.byteLength);

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
  return (await res.json()).id;
}

// ===== Backup management =====

export async function copyFile(
  fileId: string,
  newName: string,
  parentId: string,
): Promise<string> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}/copy`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: newName, parents: [parentId] }),
    },
  );
  if (!res.ok) throw new Error(`Copy failed: ${res.status}`);
  return (await res.json()).id;
}

export async function deleteFile(fileId: string): Promise<void> {
  const res = await fetch(
    `https://www.googleapis.com/drive/v3/files/${fileId}`,
    {
      method: 'DELETE',
      headers: { Authorization: `Bearer ${accessToken}` },
    },
  );
  if (!res.ok) throw new Error(`Delete failed: ${res.status}`);
}

export async function createBackup(
  parentId: string,
  dataFileId: string,
  unitName: string,
): Promise<void> {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '').slice(0, 15);
  const backupName = `${unitName}-data.xlsx.backup-${timestamp}`;
  await copyFile(dataFileId, backupName, parentId);
}

export async function cleanOldBackups(
  parentId: string,
  unitName: string,
  keepCount = 10,
): Promise<void> {
  const q = encodeURIComponent(
    `name contains '${unitName}-data.xlsx.backup-' and '${parentId}' in parents and trashed=false`,
  );
  const data = await driveGet(
    `https://www.googleapis.com/drive/v3/files?q=${q}&fields=files(id,name,createdTime)&pageSize=100&orderBy=createdTime desc`,
  );
  const files = data.files || [];
  if (files.length > keepCount) {
    for (const f of files.slice(keepCount)) {
      try {
        await deleteFile(f.id);
      } catch {
        /* ignore cleanup errors */
      }
    }
  }
}
