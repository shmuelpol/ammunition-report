import { useState } from 'react';
import { useAppStore, generateTeamNames } from '../store/useAppStore';
import { useGoogleDrive } from '../hooks/useGoogleDrive';
import type { UnitLevel, UnitConfig } from '../domain/types';
import { UNIT_LEVEL_LABELS } from '../domain/types';

/**
 * Create a new unit: define name, level, sub-units, save config to Drive.
 */
export function CreateUnit() {
  const { catalog, startNewUnit, setView } = useAppStore();
  const drive = useGoogleDrive();

  const [battalionNumber, setBattalionNumber] = useState(localStorage.getItem('ammo-battalion') || '');
  const [reporterName, setReporterName] = useState(localStorage.getItem('ammo-reporter') || '');
  const [unitLevel, setUnitLevel] = useState<UnitLevel>('team');
  const [unitName, setUnitName] = useState('');
  const [teamCount, setTeamCount] = useState(2);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const teamNames = generateTeamNames(teamCount);

  const handleCreate = async () => {
    if (!reporterName.trim()) { alert('נא להזין שם מדווח'); return; }
    if (!unitName.trim()) { alert('נא להזין שם יחידה'); return; }

    setSaving(true);
    setError('');

    const config: UnitConfig = {
      unitName: unitName.trim(),
      unitLevel,
      battalionNumber: battalionNumber.trim(),
      teamNames: unitLevel !== 'team' ? teamNames : [],
      createdAt: new Date().toISOString(),
      createdBy: reporterName.trim(),
    };

    // Save config to Drive
    const ok = await drive.saveConfig(unitName.trim(), config);
    if (!ok) {
      setError('שגיאה בשמירה ל-Google Drive');
      setSaving(false);
      return;
    }

    // Save prefs
    localStorage.setItem('ammo-reporter', reporterName.trim());
    localStorage.setItem('ammo-battalion', battalionNumber.trim());

    // Start session
    startNewUnit(config, catalog);
  };

  return (
    <div className="setup-container">
      <div className="setup-header">
        <div className="setup-logo">🆕</div>
        <h1>יחידה חדשה</h1>
        <p className="setup-subtitle">הגדרת יחידה חדשה ותת-יחידות</p>
      </div>

      <div className="setup-card">
        <div className="form-group">
          <label>מספר גדוד</label>
          <input type="text" value={battalionNumber} onChange={(e) => setBattalionNumber(e.target.value)} />
        </div>

        <div className="form-group">
          <label>שם מדווח</label>
          <input type="text" value={reporterName} onChange={(e) => setReporterName(e.target.value)} placeholder="הכנס שם..." />
        </div>

        <div className="form-group">
          <label>רמת יחידה</label>
          <div className="level-selector">
            {(['team', 'platoon', 'battery'] as UnitLevel[]).map((level) => (
              <button
                key={level}
                className={`level-btn ${unitLevel === level ? 'active' : ''}`}
                onClick={() => setUnitLevel(level)}
              >
                {UNIT_LEVEL_LABELS[level]}
              </button>
            ))}
          </div>
        </div>

        <div className="form-group">
          <label>שם יחידה</label>
          <input type="text" value={unitName} onChange={(e) => setUnitName(e.target.value)}
            placeholder={`לדוגמה: ${UNIT_LEVEL_LABELS[unitLevel]} א'`} />
        </div>

        {unitLevel !== 'team' && (
          <div className="form-group">
            <label>מספר צוותים</label>
            <div className="counter-control">
              <button onClick={() => setTeamCount(Math.max(1, teamCount - 1))}>−</button>
              <span>{teamCount}</span>
              <button onClick={() => setTeamCount(Math.min(10, teamCount + 1))}>+</button>
            </div>
            <div className="team-names">
              {teamNames.map((name, i) => (
                <span key={i} className="team-badge">{name}</span>
              ))}
            </div>
          </div>
        )}

        {error && <p className="gate-error">{error}</p>}

        <button className="start-btn" onClick={handleCreate} disabled={saving}>
          {saving ? '⏳ שומר...' : '✅ צור יחידה והתחל'}
        </button>

        <button className="back-link" onClick={() => setView('mode-select')}>
          ← חזור לבחירת מצב
        </button>
      </div>
    </div>
  );
}
