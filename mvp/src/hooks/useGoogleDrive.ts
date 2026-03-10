import { useEffect, useState, useCallback } from 'react';
import {
  initGoogleDrive,
  signInGoogleDrive,
  signOutGoogleDrive,
  isGoogleDriveConfigured,
  setOnSignInCallback,
  getSavedFolderId,
  saveFolderId,
  clearFolderId,
  validateFolder,
  createFolder,
  ensureSubfolder,
  listSubfolders,
  findFile,
  readFileAsBuffer,
  writeBinaryFile,
  createBackup,
  cleanOldBackups,
  openFolderPicker,
  openFilePicker,
  isPickerAvailable as checkPickerAvailable,
} from '../integrations/googleDrive';
import type { GoogleAuthStatus, DriveFile } from '../integrations/googleDrive';

export interface DriveHookState {
  isConfigured: boolean;
  isSignedIn: boolean;
  user: GoogleAuthStatus['user'];
  isLoading: boolean;
  folderId: string | null;
  isPickerAvailable: boolean;

  signIn: () => void;
  signOut: () => void;

  createRootFolder: (name: string) => Promise<string>;
  pickFolder: () => Promise<string | null>;
  setFolderById: (id: string) => Promise<boolean>;

  listUnits: () => Promise<DriveFile[]>;
  readUnitExcel: (unitFolderId: string, unitName: string) => Promise<ArrayBuffer | null>;
  saveUnitExcel: (
    unitName: string,
    data: ArrayBuffer,
    revision: number,
  ) => Promise<{ success: boolean; error?: string }>;

  pickFile: (mimeTypes?: string) => Promise<{ id: string; name: string } | null>;
  readFileById: (fileId: string) => Promise<ArrayBuffer>;
}

export function useGoogleDrive(): DriveHookState {
  const [authStatus, setAuthStatus] = useState<GoogleAuthStatus>({
    isSignedIn: false,
    user: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const [folderId, setFolderId] = useState<string | null>(getSavedFolderId());

  const isConfigured = isGoogleDriveConfigured();

  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }
    setOnSignInCallback((status) => {
      setAuthStatus(status);
      setIsLoading(false);
    });
    initGoogleDrive().then(() => setIsLoading(false));
    return () => setOnSignInCallback(null);
  }, [isConfigured]);

  const signIn = useCallback(() => signInGoogleDrive(), []);

  const signOut = useCallback(() => {
    signOutGoogleDrive();
    setAuthStatus({ isSignedIn: false, user: null });
    setFolderId(null);
    clearFolderId();
  }, []);

  const createRootFolder = useCallback(async (name: string) => {
    const id = await createFolder(name);
    saveFolderId(id);
    setFolderId(id);
    return id;
  }, []);

  const pickFolder = useCallback(async () => {
    const id = await openFolderPicker();
    if (id) {
      saveFolderId(id);
      setFolderId(id);
    }
    return id;
  }, []);

  const setFolderById = useCallback(async (id: string) => {
    const valid = await validateFolder(id);
    if (valid) {
      saveFolderId(id);
      setFolderId(id);
    }
    return valid;
  }, []);

  const listUnits = useCallback(async () => {
    if (!folderId) return [];
    return listSubfolders(folderId);
  }, [folderId]);

  const readUnitExcel = useCallback(
    async (unitFolderId: string, unitName: string) => {
      const fileName = `${unitName}-data.xlsx`;
      const file = await findFile(unitFolderId, fileName);
      if (!file) return null;
      return readFileAsBuffer(file.id);
    },
    [],
  );

  const saveUnitExcel = useCallback(
    async (unitName: string, data: ArrayBuffer, _revision: number) => {
      if (!folderId) return { success: false, error: 'No folder configured' };

      try {
        const subFolderId = await ensureSubfolder(folderId, unitName);
        const fileName = `${unitName}-data.xlsx`;
        const existing = await findFile(subFolderId, fileName);

        // Backup before overwrite
        if (existing) {
          await createBackup(subFolderId, existing.id, unitName);
          await cleanOldBackups(subFolderId, unitName);
        }

        await writeBinaryFile(
          fileName,
          data,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          subFolderId,
          existing?.id,
        );

        return { success: true };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    },
    [folderId],
  );

  const pickFileCb = useCallback(
    async (mimeTypes?: string) => openFilePicker(mimeTypes),
    [],
  );

  const readFileByIdCb = useCallback(
    async (fileId: string) => readFileAsBuffer(fileId),
    [],
  );

  return {
    isConfigured,
    isSignedIn: authStatus.isSignedIn,
    user: authStatus.user,
    isLoading,
    folderId,
    isPickerAvailable: checkPickerAvailable(),
    signIn,
    signOut,
    createRootFolder,
    pickFolder,
    setFolderById,
    listUnits,
    readUnitExcel,
    saveUnitExcel,
    pickFile: pickFileCb,
    readFileById: readFileByIdCb,
  };
}
