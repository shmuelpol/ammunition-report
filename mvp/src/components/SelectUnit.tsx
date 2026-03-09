import { useEffect, useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import { useGoogleDrive } from '../hooks/useGoogleDrive';
import type { DriveFile } from '../integrations/googleDrive';
import type { ReportSession, UnitConfig } from '../domain/types';

/**
 * Select an existing unit from Drive and load its data.
 */
export function SelectUnit() {
  const { catalog, loadExistingSession, setView, startNewUnit } = useAppStore();
  const drive = useGoogleDrive();
  const [units, setUnits] = useState<DriveFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingUnit, setLoadingUnit] = useState<string | null>(null);
  const [error, setError] = useState('');

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const files = await drive.listUnits();
      setUnits(files);
      setLoading(false);
    };
    load();
  }, []);

  const handleLoadUnit = async (file: DriveFile) => {
    const unitName = file.name.replace('-config.json', '');
    setLoadingUnit(unitName);
    setError('');

    try {
      // Load config
      const config: UnitConfig | null = await drive.loadConfig(unitName);
      if (!config) {
        setError(`לא נמצא קובץ הגדרות עבור ${unitName}`);
        setLoadingUnit(null);
        return;
      }

      // Try loading existing data
      const data = await drive.loadData(unitName);

      if (data && data.sections) {
        // Load existing session data
        const session: ReportSession = {
          id: data.id || Date.now().toString(36),
          battalionNumber: config.battalionNumber,
          reportDateTime: data.reportDateTime || new Date().toISOString(),
          reporterName: data.reporterName || config.createdBy,
          unitLevel: config.unitLevel,
          unitName: config.unitName,
          sections: data.sections,
          createdAt: data.createdAt || config.createdAt,
          updatedAt: data.updatedAt || new Date().toISOString(),
        };
        loadExistingSession(session);
      } else {
        // No data yet — start fresh from config
        startNewUnit(config, catalog);
      }
    } catch (err: any) {
      setError(err.message || 'שגיאה בטעינת נתונים');
      setLoadingUnit(null);
    }
  };

  return (
    <div className="setup-container">
      <div className="setup-header">
        <div className="setup-logo">📂</div>
        <h1>בחירת יחידה</h1>
        <p className="setup-subtitle">טען נתונים קיימים מ-Drive</p>
      </div>

      <div className="setup-card">
        {loading ? (
          <div className="gate-status">
            <div className="gate-spinner" />
            <p>טוען רשימת יחידות...</p>
          </div>
        ) : units.length === 0 ? (
          <div className="gate-status">
            <p>לא נמצאו יחידות בתיקייה. צור יחידה חדשה תחילה.</p>
            <button className="start-btn" onClick={() => {
              useAppStore.getState().setMode('new');
              setView('create-unit');
            }}>
              🆕 צור יחידה חדשה
            </button>
          </div>
        ) : (
          <div className="unit-list">
            {units.map((file) => {
              const unitName = file.name.replace('-config.json', '');
              return (
                <div key={file.id} className="unit-card" onClick={() => handleLoadUnit(file)}>
                  <div className="unit-card-info">
                    <strong>{unitName}</strong>
                    {file.modifiedTime && (
                      <span className="unit-card-date">
                        עודכן: {new Date(file.modifiedTime).toLocaleString('he-IL')}
                      </span>
                    )}
                  </div>
                  <div className="unit-card-action">
                    {loadingUnit === unitName ? '⏳' : '←'}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {error && <p className="gate-error">{error}</p>}

        <button className="back-link" onClick={() => setView('mode-select')}>
          ← חזור לבחירת מצב
        </button>
      </div>
    </div>
  );
}
