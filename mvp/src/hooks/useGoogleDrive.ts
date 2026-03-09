import { useEffect, useState } from 'react';
import { initGoogleDrive, getGoogleAuthStatus, signInGoogleDrive, signOutGoogleDrive, saveReportToDrive } from '../integrations/googleDrive';
import type { GoogleAuthStatus } from '../integrations/googleDrive';

/**
 * Hook for Google Drive integration
 */
export function useGoogleDrive() {
  const [authStatus, setAuthStatus] = useState<GoogleAuthStatus>({
    isSignedIn: false,
    user: null,
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const initAsync = async () => {
      await initGoogleDrive();
      setAuthStatus(getGoogleAuthStatus());
      setIsLoading(false);
    };

    initAsync();
  }, []);

  const signIn = async () => {
    setIsLoading(true);
    const result = await signInGoogleDrive();
    setAuthStatus(getGoogleAuthStatus());
    setIsLoading(false);
    return result;
  };

  const signOut = async () => {
    setIsLoading(true);
    await signOutGoogleDrive();
    setAuthStatus(getGoogleAuthStatus());
    setIsLoading(false);
  };

  const saveReport = async (data: any, fileName: string) => {
    return saveReportToDrive(data, fileName);
  };

  return {
    isSignedIn: authStatus.isSignedIn,
    user: authStatus.user,
    isLoading,
    signIn,
    signOut,
    saveReport,
  };
}
