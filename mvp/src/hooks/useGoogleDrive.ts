import { useEffect, useState, useCallback } from 'react';
import {
  initGoogleDrive,
  signInGoogleDrive,
  signOutGoogleDrive,
  isGoogleDriveConfigured,
  setOnSignInCallback,
  findSharedFolder,
  loadTemplateFromDrive,
  listUnitsFromDrive,
  loadUnitConfig,
  loadUnitData,
  saveUnitConfig,
  saveUnitData,
  saveUnitCSV,
} from '../integrations/googleDrive';
import type { GoogleAuthStatus, DriveFile } from '../integrations/googleDrive';
import { parseCatalogCSV } from '../domain/catalog';
import type { AmmoGroupDef, UnitConfig } from '../domain/types';

export interface DriveState {
  // Auth
  isConfigured: boolean;
  isSignedIn: boolean;
  user: GoogleAuthStatus['user'];
  isLoading: boolean;
  signIn: () => void;
  signOut: () => void;
  // Shared folder
  folderFound: boolean | null; // null = not checked yet
  checkFolder: () => Promise<boolean>;
  // Template
  catalog: AmmoGroupDef[] | null;
  templateError: string | null;
  loadTemplate: () => Promise<AmmoGroupDef[] | null>;
  // Units
  listUnits: () => Promise<DriveFile[]>;
  loadConfig: (unitName: string) => Promise<UnitConfig | null>;
  loadData: (unitName: string) => Promise<any | null>;
  saveConfig: (unitName: string, config: UnitConfig) => Promise<boolean>;
  saveData: (unitName: string, data: any) => Promise<boolean>;
  saveCsv: (unitName: string, csv: string) => Promise<boolean>;
}

export function useGoogleDrive(): DriveState {
  const [authStatus, setAuthStatus] = useState<GoogleAuthStatus>({ isSignedIn: false, user: null });
  const [isLoading, setIsLoading] = useState(true);
  const [folderFound, setFolderFound] = useState<boolean | null>(null);
  const [catalog, setCatalog] = useState<AmmoGroupDef[] | null>(null);
  const [templateError, setTemplateError] = useState<string | null>(null);

  const isConfigured = isGoogleDriveConfigured();

  useEffect(() => {
    if (!isConfigured) { setIsLoading(false); return; }
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
    setFolderFound(null);
    setCatalog(null);
  }, []);

  const checkFolder = useCallback(async () => {
    const id = await findSharedFolder();
    const found = id !== null;
    setFolderFound(found);
    return found;
  }, []);

  const loadTemplate = useCallback(async () => {
    setTemplateError(null);
    try {
      const csv = await loadTemplateFromDrive();
      if (!csv) {
        setTemplateError(`הקובץ ammunition-types.csv לא נמצא בתיקייה ammunition-report`);
        return null;
      }
      const parsed = parseCatalogCSV(csv);
      if (parsed.length === 0) {
        setTemplateError('קובץ התבנית ריק או בפורמט שגוי');
        return null;
      }
      setCatalog(parsed);
      return parsed;
    } catch (err: any) {
      setTemplateError(err.message || 'שגיאה בטעינת תבנית');
      return null;
    }
  }, []);

  const listUnitsCallback = useCallback(() => listUnitsFromDrive(), []);
  const loadConfigCb = useCallback((name: string) => loadUnitConfig(name), []);
  const loadDataCb = useCallback((name: string) => loadUnitData(name), []);
  
  const saveConfigCb = useCallback(async (name: string, config: UnitConfig) => {
    const r = await saveUnitConfig(name, config);
    return r.success;
  }, []);

  const saveDataCb = useCallback(async (name: string, data: any) => {
    const r = await saveUnitData(name, data);
    return r.success;
  }, []);

  const saveCsvCb = useCallback(async (name: string, csv: string) => {
    const r = await saveUnitCSV(name, csv);
    return r.success;
  }, []);

  return {
    isConfigured,
    isSignedIn: authStatus.isSignedIn,
    user: authStatus.user,
    isLoading,
    signIn,
    signOut,
    folderFound,
    checkFolder,
    catalog,
    templateError,
    loadTemplate,
    listUnits: listUnitsCallback,
    loadConfig: loadConfigCb,
    loadData: loadDataCb,
    saveConfig: saveConfigCb,
    saveData: saveDataCb,
    saveCsv: saveCsvCb,
  };
}
