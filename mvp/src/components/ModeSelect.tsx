import { useAppStore } from '../store/useAppStore';

/**
 * Mode selection: New unit or Update existing unit.
 */
export function ModeSelect() {
  const { setView, setMode } = useAppStore();

  return (
    <div className="setup-container">
      <div className="setup-header">
        <div className="setup-logo">🎯</div>
        <h1>ספירת מלאי תחמושת</h1>
        <p className="setup-subtitle">בחר מצב עבודה</p>
      </div>

      <div className="mode-cards">
        <div
          className="mode-card"
          onClick={() => {
            setMode('new');
            setView('create-unit');
          }}
        >
          <div className="mode-icon">🆕</div>
          <h2>יחידה חדשה</h2>
          <p>הגדר יחידה חדשה, תת-יחידות, וצור קבצי נתונים חדשים</p>
        </div>

        <div
          className="mode-card"
          onClick={() => {
            setMode('update');
            setView('select-unit');
          }}
        >
          <div className="mode-icon">📂</div>
          <h2>עדכון יחידה קיימת</h2>
          <p>טען נתונים קיימים מ-Drive ועדכן (ירי, העברה, תקלה וכו')</p>
        </div>
      </div>
    </div>
  );
}
