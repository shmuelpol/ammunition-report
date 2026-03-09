import { useEffect, useState, useCallback } from 'react';
import { initGoogleDrive, signInGoogleDrive, signOutGoogleDrive, saveReportToDrive, isGoogleDriveConfigured, setOnSignInCallback } from '../integrations/googleDrive';
import type { GoogleAuthStatus } from '../integrations/googleDrive';

/**
 * Hook for Google Drive integration (using modern GIS token client)
 */
export function useGoogleDrive() {
  const [authStatus, setAuthStatus] = useState<GoogleAuthStatus>({
    isSignedIn: false,
    user: null,
  });
  const [isLoading, setIsLoading] = useState(true);
  const isConfigured = isGoogleDriveConfigured();

  useEffect(() => {
    if (!isConfigured) {
      setIsLoading(false);
      return;
    }

    // Register callback so the integration can notify us when sign-in completes
    setOnSignInCallback((status) => {
      setAuthStatus(status);
      setIsLoading(false);
    });

    const initAsync = async () => {
      await initGoogleDrive();
      setIsLoading(false);
    };

    initAsync();

    return () => setOnSignInCallback(null);
  }, [isConfigured]);

  const signIn = useCallback(() => {
    signInGoogleDrive();
    // The callback registered above will update state when the popup completes
  }, []);

  const signOut = useCallback(() => {
    signOutGoogleDrive();
    setAuthStatus({ isSignedIn: false, user: null });
  }, []);

  const saveReport = useCallback(async (data: any, fileName: string) => {
    return saveReportToDrive(data, fileName);
  }, []);

  return {
    isSignedIn: authStatus.isSignedIn,
    user: authStatus.user,
    isLoading,
    isConfigured,
    signIn,
    signOut,
    saveReport,
  };
}
