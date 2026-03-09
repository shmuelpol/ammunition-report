import { useState, useEffect } from 'react';
import { useAppStore, generateTeamNames } from '../store/useAppStore';
import { UnitLevel, UNIT_LEVEL_LABELS } from '../domain/types';

function getCurrentDateTimeLocal(): string {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60000);
  return local.toISOString().slice(0, 16);
}

export function SessionSetup() {
  const { startSession, getLastPrefs, refreshDrafts, drafts, loadDraftById, deleteDraftById } =
    useAppStore();
  const prefs = getLastPrefs();

  const [battalionNumber, setBattalionNumber] = useState(prefs.battalionNumber);
  const [reportDateTime, setReportDateTime] = useState(getCurrentDateTimeLocal());
  const [reporterName, setReporterName] = useState(prefs.reporterName);
  const [unitLevel, setUnitLevel] = useState<UnitLevel>(prefs.unitLevel || 'team');
  const [unitName, setUnitName] = useState('');
  const [teamCount, setTeamCount] = useState(2);

  useEffect(() => {
    refreshDrafts();
  }, []);

  const teamNames = generateTeamNames(teamCount);

  const handleStart = () => {
    if (!reporterName.trim()) {
      alert('נא להזין שם מדווח');
      return;
    }
    if (!unitName.trim()) {
      alert('נא להזין שם יחידה');
      return;
    }

    startSession({
      battalionNumber,
      reportDateTime,
      reporterName: reporterName.trim(),
      unitLevel,
      unitName: unitName.trim(),
      teamNames: unitLevel !== 'team' ? teamNames : [],
    });
  };

  return (
    <div className="setup-container">
      <div className="setup-header">
        <div className="setup-logo">🎯</div>
        <h1>ספירת מלאי תחמושת</h1>
        <p className="setup-subtitle">מערכת דיווח מלאי</p>
      </div>

      <div className="setup-card">
        <div className="form-group">
          <label>מספר גדוד</label>
          <input
            type="text"
            value={battalionNumber}
            onChange={(e) => setBattalionNumber(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>תאריך ושעה</label>
          <input
            type="datetime-local"
            value={reportDateTime}
            onChange={(e) => setReportDateTime(e.target.value)}
          />
        </div>

        <div className="form-group">
          <label>שם מדווח</label>
          <input
            type="text"
            value={reporterName}
            onChange={(e) => setReporterName(e.target.value)}
            placeholder="הכנס שם..."
          />
        </div>

        <div className="form-group">
          <label>רמת משתמש</label>
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
          <input
            type="text"
            value={unitName}
            onChange={(e) => setUnitName(e.target.value)}
            placeholder={`לדוגמה: ${UNIT_LEVEL_LABELS[unitLevel]} א'`}
          />
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
                <span key={i} className="team-badge">
                  {name}
                </span>
              ))}
            </div>
          </div>
        )}

        <button className="start-btn" onClick={handleStart}>
          התחל ספירה
        </button>
      </div>

      {drafts.length > 0 && (
        <div className="drafts-section">
          <h3>טיוטות שמורות</h3>
          {drafts.map((draft) => (
            <div key={draft.id} className="draft-card">
              <div className="draft-info">
                <strong>{draft.unitName}</strong>
                <span>{UNIT_LEVEL_LABELS[draft.unitLevel]} • {draft.reporterName}</span>
                <span>{new Date(draft.updatedAt).toLocaleString('he-IL')}</span>
              </div>
              <div className="draft-actions">
                <button onClick={() => loadDraftById(draft.id)}>טען</button>
                <button
                  className="danger"
                  onClick={() => {
                    if (confirm('למחוק טיוטה זו?')) deleteDraftById(draft.id);
                  }}
                >
                  מחק
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
