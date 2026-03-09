/**
 * Google Drive integration service
 * Allows users to save ammunition reports directly to their Google Drive
 */

declare global {
  interface Window {
    gapi?: any;
    google?: any;
  }
}

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';
const FOLDER_NAME = 'אפליקציית ספירת מלאי תחמושת';
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

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

let authStatus: GoogleAuthStatus = {
  isSignedIn: false,
  user: null,
};

/**
 * Initialize Google API client
 */
export async function initGoogleDrive(): Promise<void> {
  if (!CLIENT_ID) {
    console.warn('Google Drive integration disabled: VITE_GOOGLE_CLIENT_ID not set');
    return;
  }

  return new Promise((resolve) => {
    const script = document.createElement('script');
    script.src = 'https://apis.google.com/js/platform.js';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      window.gapi.load('client:auth2', async () => {
        try {
          await window.gapi.client.init({
            clientId: CLIENT_ID,
            scope: SCOPES.join(' '),
          });

          const auth = window.gapi.auth2.getAuthInstance();
          if (auth.isSignedIn.get()) {
            const user = auth.currentUser.get();
            authStatus.isSignedIn = true;
            authStatus.user = {
              email: user.getBasicProfile().getEmail(),
              name: user.getBasicProfile().getName(),
            };
          }

          auth.isSignedIn.listen(() => {
            if (auth.isSignedIn.get()) {
              const user = auth.currentUser.get();
              authStatus.isSignedIn = true;
              authStatus.user = {
                email: user.getBasicProfile().getEmail(),
                name: user.getBasicProfile().getName(),
              };
              console.log('✓ Signed in to Google Drive');
            } else {
              authStatus.isSignedIn = false;
              authStatus.user = null;
            }
          });

          resolve();
        } catch (err) {
          console.warn('Failed to init Google Drive:', err);
          resolve();
        }
      });
    };
    document.head.appendChild(script);
  });
}

/**
 * Sign in to Google Drive
 */
export async function signInGoogleDrive(): Promise<boolean> {
  if (!window.gapi) return false;

  try {
    const auth = window.gapi.auth2.getAuthInstance();
    await auth.signIn();
    return authStatus.isSignedIn;
  } catch (err) {
    console.error('Sign in failed:', err);
    return false;
  }
}

/**
 * Sign out from Google Drive
 */
export async function signOutGoogleDrive(): Promise<void> {
  if (!window.gapi) return;

  try {
    const auth = window.gapi.auth2.getAuthInstance();
    await auth.signOut();
  } catch (err) {
    console.error('Sign out failed:', err);
  }
}

/**
 * Get current auth status
 */
export function getGoogleAuthStatus(): GoogleAuthStatus {
  return { ...authStatus };
}

/**
 * Save a report to Google Drive as JSON
 */
export async function saveReportToDrive(reportData: any, fileName: string): Promise<SaveResult> {
  if (!authStatus.isSignedIn || !window.gapi) {
    return {
      success: false,
      error: 'Not signed in to Google Drive',
    };
  }

  try {
    // Ensure folder exists
    const folderId = await getOrCreateFolder(FOLDER_NAME);

    const fileMetadata = {
      name: fileName,
      parents: [folderId],
      mimeType: 'application/json',
    };

    const fileContent = JSON.stringify(reportData, null, 2);

    const response = await window.gapi.client.drive.files.create({
      resource: fileMetadata,
      media: {
        mimeType: 'application/json',
        body: fileContent,
      },
      fields: 'id, webViewLink, name, createdTime',
    });

    return {
      success: true,
      fileId: response.result.id,
    };
  } catch (err: any) {
    console.error('Failed to save to Drive:', err);
    return {
      success: false,
      error: err.message || 'Failed to save to Drive',
    };
  }
}

/**
 * Get or create a folder in user's drive
 */
async function getOrCreateFolder(folderName: string): Promise<string> {
  try {
    // Search for existing folder
    const response = await window.gapi.client.drive.files.list({
      q: `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
      spaces: 'drive',
      fields: 'files(id)',
      pageSize: 1,
    });

    if (response.result.files && response.result.files.length > 0) {
      return response.result.files[0].id;
    }

    // Create new folder
    const createResponse = await window.gapi.client.drive.files.create({
      resource: {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
      },
      fields: 'id',
    });

    return createResponse.result.id;
  } catch (err) {
    console.error('Failed to manage folder:', err);
    throw err;
  }
}

/**
 * List recent reports from Google Drive
 */
export async function listReportsFromDrive(): Promise<any[]> {
  if (!authStatus.isSignedIn || !window.gapi) {
    return [];
  }

  try {
    const folderId = await getOrCreateFolder(FOLDER_NAME);

    const response = await window.gapi.client.drive.files.list({
      q: `parents='${folderId}' and mimeType='application/json' and trashed=false`,
      spaces: 'drive',
      fields: 'files(id, name, createdTime, modifiedTime, webViewLink)',
      orderBy: 'modifiedTime desc',
      pageSize: 20,
    });

    return response.result.files || [];
  } catch (err) {
    console.error('Failed to list Drive files:', err);
    return [];
  }
}

/**
 * Export a report to Google Drive as Excel (via Sheets)
 */
export async function exportReportToSheetsOnDrive(
  reportData: any,
  fileName: string,
): Promise<SaveResult> {
  if (!authStatus.isSignedIn || !window.gapi) {
    return {
      success: false,
      error: 'Not signed in to Google Drive',
    };
  }

  try {
    const folderId = await getOrCreateFolder(FOLDER_NAME);

    // Create a Google Sheet
    const fileMetadata = {
      name: fileName,
      parents: [folderId],
      mimeType: 'application/vnd.google-apps.spreadsheet',
    };

    const response = await window.gapi.client.drive.files.create({
      resource: fileMetadata,
      fields: 'id, webViewLink, name',
    });

    // TODO: Populate the sheet with report data using Google Sheets API

    return {
      success: true,
      fileId: response.result.id,
    };
  } catch (err: any) {
    console.error('Failed to export to Sheets:', err);
    return {
      success: false,
      error: err.message || 'Failed to export',
    };
  }
}
