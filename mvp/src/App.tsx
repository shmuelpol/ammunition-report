import { useAppStore } from './store/useAppStore';
import { SessionSetup } from './components/SessionSetup';
import { SectionTabs } from './components/SectionTabs';
import { Summary } from './components/Summary';
import { UNIT_LEVEL_LABELS } from './domain/types';

export default function App() {
  const { view, session, setView, clearSession } = useAppStore();

  return (
    <div className="app">
      {view === 'setup' && <SessionSetup />}

      {view !== 'setup' && session && (
        <div className="app-header">
          <div className="header-info">
            <span className="header-unit">{session.unitName}</span>
            <span className="header-level">{UNIT_LEVEL_LABELS[session.unitLevel]}</span>
            <span className="header-battalion">גדוד {session.battalionNumber}</span>
          </div>
          <div className="header-actions">
            <button
              className="header-btn"
              onClick={() => setView('setup')}
              title="חזור למסך הכניסה"
            >
              🏠
            </button>
            <button
              className="header-btn danger"
              onClick={() => {
                if (confirm('האם אתה בטוח שברצונך לנקות את הדוח ולהתחיל מחדש?')) {
                  clearSession();
                }
              }}
              title="נקה הכל"
            >
              🗑️
            </button>
          </div>
        </div>
      )}

      {view === 'entry' && <SectionTabs />}
      {view === 'summary' && <Summary />}
    </div>
  );
}
