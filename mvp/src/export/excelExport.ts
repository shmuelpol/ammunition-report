import * as XLSX from 'xlsx';
import type { ReportSession, AmmoGroupDef } from '../domain/types';

/**
 * Export in the old manual Excel format for backward compatibility.
 * Used when a user imported an old-format file and wants to export it back.
 */
export function exportOldFormat(
  session: ReportSession,
  catalog: AmmoGroupDef[],
) {
  const wb = XLSX.utils.book_new();

  // Per sub-unit sheets
  for (const section of session.sections) {
    const allColumns = [...section.gunIds, ...section.storageLocations];
    const header = [
      'תחמושת',
      ...allColumns,
      'סה"כ קנים',
      'סה"כ בונקר',
      'סה"כ',
    ];
    const data: (string | number)[][] = [header];

    for (const group of catalog) {
      const groupRows = section.rows.filter((r) => r.ammoType === group.type);
      for (const row of groupRows) {
        const rowLabel = row.lot
          ? `${row.modelName} ${row.lot}`
          : row.modelName;
        const rowData: (string | number)[] = [rowLabel];

        let gunTotal = 0;
        let storageTotal = 0;

        for (let i = 0; i < allColumns.length; i++) {
          const qty = row.quantities[allColumns[i]] || 0;
          rowData.push(qty);
          if (i < section.gunIds.length) gunTotal += qty;
          else storageTotal += qty;
        }

        rowData.push(gunTotal, storageTotal, gunTotal + storageTotal);
        data.push(rowData);
      }
      data.push([]); // separator
    }

    const ws = XLSX.utils.aoa_to_sheet(data);
    if (!ws['!views']) ws['!views'] = [];
    (ws['!views'] as Array<{ RTL?: boolean }>)[0] = { RTL: true };
    XLSX.utils.book_append_sheet(wb, ws, section.label);
  }

  // Summary sheet
  const summaryHeader = [
    'תחמושת',
    ...session.sections.map((s) => s.label),
    'סה"כ',
  ];
  const summaryData: (string | number)[][] = [summaryHeader];

  for (const group of catalog) {
    const allKeys = new Set<string>();
    for (const section of session.sections) {
      for (const row of section.rows) {
        if (row.ammoType === group.type) {
          allKeys.add(`${row.modelId}|${row.lot}`);
        }
      }
    }
    for (const key of allKeys) {
      const [modelId, lot] = key.split('|');
      const model = group.models.find((m) => m.id === modelId);
      const label = lot
        ? `${model?.name || modelId} ${lot}`
        : model?.name || modelId;

      const perSection = session.sections.map((section) => {
        const matchingRow = section.rows.find(
          (r) =>
            r.ammoType === group.type &&
            r.modelId === modelId &&
            r.lot === lot,
        );
        return matchingRow
          ? Object.values(matchingRow.quantities).reduce((a, b) => a + b, 0)
          : 0;
      });

      summaryData.push([
        label,
        ...perSection,
        perSection.reduce((a, b) => a + b, 0),
      ]);
    }
    summaryData.push([]);
  }

  const ws = XLSX.utils.aoa_to_sheet(summaryData);
  if (!ws['!views']) ws['!views'] = [];
  (ws['!views'] as Array<{ RTL?: boolean }>)[0] = { RTL: true };
  XLSX.utils.book_append_sheet(wb, ws, 'ריכוז גדודי');

  const safeName = session.unitName.replace(/[\\/:*?"<>|]/g, '_');
  XLSX.writeFile(wb, `${safeName}-export-old-format.xlsx`);
}
