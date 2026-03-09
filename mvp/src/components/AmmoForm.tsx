import { useState } from 'react';
import { useAppStore } from '../store/useAppStore';
import type { AmmoGroupDef, AmmoRow } from '../domain/types';

interface AmmoFormProps {
  sectionId: string;
}

export function AmmoForm({ sectionId }: AmmoFormProps) {
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
          rows={section.entries[group.type] || []}
          sectionId={sectionId}
        />
      ))}
    </div>
  );
}

interface GroupSectionProps {
  group: AmmoGroupDef;
  rows: AmmoRow[];
  sectionId: string;
}

function AmmoGroupSection({ group, rows, sectionId }: GroupSectionProps) {
  const [isOpen, setIsOpen] = useState(true);
  const { addRow, removeRow, updateRowField } = useAppStore();

  const totalQty = rows.reduce((sum, r) => sum + (r.quantity || 0), 0);

  return (
    <div className={`ammo-group ${isOpen ? 'open' : ''}`}>
      <div className="ammo-group-header" onClick={() => setIsOpen(!isOpen)}>
        <span className="group-icon">{isOpen ? '▼' : '◀'}</span>
        <span className="group-name">{group.displayName}</span>
        {totalQty > 0 && <span className="group-total">{totalQty}</span>}
        {!group.quantityOnly && rows.length > 0 && (
          <span className="group-count">{rows.length} פריטים</span>
        )}
      </div>

      {isOpen && (
        <div className="ammo-group-body">
          {group.quantityOnly ? (
            /* === Quantity-only group (primers) === */
            <div className="primer-input">
              <label>כמות:</label>
              <input
                type="number"
                min="0"
                inputMode="numeric"
                value={rows[0]?.quantity ?? 0}
                onChange={(e) => {
                  updateRowField(
                    sectionId,
                    group.type,
                    0,
                    'quantity',
                    parseInt(e.target.value) || 0,
                  );
                }}
              />
            </div>
          ) : (
            /* === Model-based groups === */
            <>
              {rows.length > 0 && (
                <div className="ammo-table">
                  <div className="ammo-table-header">
                    <span className="col-model">דגם</span>
                    {group.requiresSerial && <span className="col-serial">סדרה</span>}
                    <span className="col-qty">כמות</span>
                    <span className="col-action"></span>
                  </div>

                  {rows.map((row, index) => (
                    <div key={row.id} className="ammo-table-row">
                      <select
                        className="col-model"
                        value={row.modelId}
                        onChange={(e) => {
                          const model = group.models.find((m) => m.id === e.target.value);
                          updateRowField(sectionId, group.type, index, 'modelId', e.target.value);
                          updateRowField(
                            sectionId,
                            group.type,
                            index,
                            'modelName',
                            model?.name || '',
                          );
                        }}
                      >
                        <option value="">בחר דגם...</option>
                        {group.models.map((m) => (
                          <option key={m.id} value={m.id}>
                            {m.name}
                          </option>
                        ))}
                      </select>

                      {group.requiresSerial && (
                        <input
                          className="col-serial"
                          type="text"
                          placeholder="סדרה"
                          value={row.serial || ''}
                          onChange={(e) =>
                            updateRowField(sectionId, group.type, index, 'serial', e.target.value)
                          }
                        />
                      )}

                      <input
                        className="col-qty"
                        type="number"
                        min="0"
                        inputMode="numeric"
                        placeholder="0"
                        value={row.quantity || ''}
                        onChange={(e) =>
                          updateRowField(
                            sectionId,
                            group.type,
                            index,
                            'quantity',
                            parseInt(e.target.value) || 0,
                          )
                        }
                      />

                      <button
                        className="col-action remove-row-btn"
                        onClick={() => removeRow(sectionId, group.type, index)}
                        title="הסר שורה"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <button className="add-row-btn" onClick={() => addRow(sectionId, group.type)}>
                + הוסף דגם {group.displayName}
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
