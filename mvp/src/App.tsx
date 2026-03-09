import { useAppStore } from './store/useAppStore';
import { DriveGate } from './components/DriveGate';
import { ModeSelect } from './components/ModeSelect';
import { CreateUnit } from './components/CreateUnit';
import { SelectUnit } from './components/SelectUnit';
import { SectionTabs } from './components/SectionTabs';
import { Summary } from './components/Summary';
import { UNIT_LEVEL_LABELS } from './domain/types';

export default function App() {
  const { view, session, setView, clearSession } = useAppStore();

  return (
    <div className="app">
      {view === 'drive-gate' && <DriveGate />}
      {view === 'mode-select' && <ModeSelect />}
      {view === 'create-unit' && <CreateUnit />}
      {view === 'select-unit' && <SelectUnit />}

      {(view === 'entry' || view === 'summary') && session && (
        <div className="app-header">
          <div className="header-info">
            <span className="header-unit">{session.unitName}</span>
            <span className="header-level">{UNIT_LEVEL_LABELS[session.unitLevel]}</span>
            <span className="header-battalion">גדוד {session.battalionNumber}</span>
          </div>
          <div className="header-actions">
            <button
              className="header-btn"
              onClick={() => clearSession()}
              title="חזור לתפריט ראשי"
            >
              🏠
            </button>
          </div>
        </div>
      )}

      {view === 'entry' && <SectionTabs />}
      {view === 'summary' && <Summary />}
    </div>
  );
}
