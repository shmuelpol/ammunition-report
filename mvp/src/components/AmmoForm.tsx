import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { AmmoGroupDef, AmmoDataRow } from '../domain/types';

interface AmmoFormProps {
  sectionId: string;
  columnId: string;
}

export function AmmoForm({ sectionId, columnId }: AmmoFormProps) {
  const session = useAppStore((s) => s.session);
  const catalog = useAppStore((s) => s.catalog);

  if (!session) return null;

  const section = session.sections.find((s) => s.id === sectionId);
  if (!section) return null;

  return (
    <div className="ammo-form">
      {catalog.map((group) => (
        <AmmoGroupSection
          key={group.type}
          group={group}
          sectionId={sectionId}
          columnId={columnId}
          rows={section.rows.filter((r) => r.ammoType === group.type)}
        />
      ))}
    </div>
  );
}

interface GroupSectionProps {
  group: AmmoGroupDef;
  sectionId: string;
  columnId: string;
  rows: AmmoDataRow[];
}

function AmmoGroupSection({ group, sectionId, columnId, rows }: GroupSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { updateQuantity, addLotRow, removeLotRow } = useAppStore();
  const [newLotModel, setNewLotModel] = useState('');
  const [newLotName, setNewLotName] = useState('');

  const totalQty = rows.reduce(
    (sum, r) => sum + (r.quantities[columnId] || 0),
    0,
  );

  return (
    <div className={`ammo-group ${isOpen ? 'open' : ''}`}>
      <div className="ammo-group-header" onClick={() => setIsOpen(!isOpen)}>
        <span className="group-icon">{isOpen ? '▼' : '◀'}</span>
        <span className="group-name">{group.displayName}</span>
        {totalQty > 0 && <span className="group-total">{totalQty}</span>}
      </div>

      {isOpen && (
        <div className="ammo-group-body">
          {group.quantityOnly ? (
            /* Primer — single quantity */
            <div className="primer-input">
              <label>כמות:</label>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={rows[0]?.quantities[columnId] ?? 0}
                onChange={(e) => {
                  if (rows[0]) {
                    updateQuantity(
                      sectionId,
                      rows[0].id,
                      columnId,
                      parseInt(e.target.value) || 0,
                    );
                  }
                }}
              />
            </div>
          ) : group.hasLots ? (
            /* Charge group — models with lot sub-rows */
            <div className="ammo-table">
              {group.models.map((model) => {
                const modelRows = rows.filter((r) => r.modelId === model.id);
                return (
                  <div key={model.id} style={{ marginBottom: 12 }}>
                    <div
                      style={{
                        fontWeight: 600,
                        fontSize: '0.9em',
                        marginBottom: 4,
                        color: 'var(--primary-dark)',
                      }}
                    >
                      {model.name}
                    </div>
                    {modelRows.map((row) => (
                      <div key={row.id} className="ammo-table-row">
                        <span
                          className="col-serial"
                          style={{
                            fontSize: '0.85em',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          לוט {row.lot}
                        </span>
                        <input
                          className="col-qty"
                          type="number"
                          min="0"
                          inputMode="numeric"
                          value={row.quantities[columnId] || ''}
                          onChange={(e) =>
                            updateQuantity(
                              sectionId,
                              row.id,
                              columnId,
                              parseInt(e.target.value) || 0,
                            )
                          }
                        />
                        <button
                          className="col-action remove-row-btn"
                          onClick={() => removeLotRow(sectionId, row.id)}
                          title="הסר לוט"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                    <div style={{ display: 'flex', gap: 4, marginTop: 4 }}>
                      <input
                        type="text"
                        placeholder="מספר לוט"
                        value={newLotModel === model.id ? newLotName : ''}
                        onFocus={() => setNewLotModel(model.id)}
                        onChange={(e) => {
                          setNewLotModel(model.id);
                          setNewLotName(e.target.value);
                        }}
                        style={{
                          flex: 1,
                          padding: '6px 8px',
                          border: '1px dashed var(--border)',
                          borderRadius: 4,
                          fontSize: '0.85em',
                        }}
                      />
                      <button
                        className="add-row-btn"
                        style={{
                          width: 'auto',
                          padding: '6px 12px',
                          margin: 0,
                        }}
                        onClick={() => {
                          if (
                            newLotModel === model.id &&
                            newLotName.trim()
                          ) {
                            addLotRow(
                              sectionId,
                              model.id,
                              model.name,
                              newLotName.trim(),
                            );
                            setNewLotName('');
                          }
                        }}
                      >
                        + לוט
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            /* Standard group — pre-populated models with quantity */
            <div className="ammo-table">
              {rows.map((row) => (
                <div key={row.id} className="ammo-table-row">
                  <span className="col-model" style={{ fontWeight: 500 }}>
                    {row.modelName}
                  </span>
                  <input
                    className="col-qty"
                    type="number"
                    min="0"
                    inputMode="numeric"
                    value={row.quantities[columnId] || ''}
                    onChange={(e) =>
                      updateQuantity(
                        sectionId,
                        row.id,
                        columnId,
                        parseInt(e.target.value) || 0,
                      )
                    }
                  />
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
