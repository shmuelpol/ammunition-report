import * as XLSX from 'xlsx';
import type { ReportSession, AmmoGroupDef } from '../domain/types';
import type { NormalizedReport } from '../domain/reportModel';

/**
 * Export the report as an Excel file with two sheets:
 * 1. פירוט (Detail) — every model per section
 * 2. סיכום (Summary) — totals per group per section
 */
export function exportToExcel(session: ReportSession, report: NormalizedReport, catalog: AmmoGroupDef[]) {
  const wb = XLSX.utils.book_new();

  // ===== Sheet 1: Detail =====
  const detailData: (string | number)[][] = [];

  // Header row
  detailData.push(['קטגוריה', 'דגם', ...report.sectionLabels, 'סה"כ']);

  for (const group of catalog) {
    const groupData = report.groupTotals[group.type];
    if (!groupData) continue;

    for (const model of groupData.models) {
      detailData.push([group.displayName, model.modelName, ...model.perSection, model.total]);
    }

    // Group subtotal row
    detailData.push([
      `סה"כ ${group.displayName}`,
      '',
      ...groupData.sectionTotals,
      groupData.grandTotal,
    ]);

    // Empty separator row
    detailData.push([]);
  }

  // Grand total
  const grandTotalsPerSection = report.sectionLabels.map((_, i) => {
    return catalog.reduce((sum, g) => {
      return sum + (report.groupTotals[g.type]?.sectionTotals[i] || 0);
    }, 0);
  });
  detailData.push(['סה"כ כללי', '', ...grandTotalsPerSection, report.grandTotal]);

  const ws1 = XLSX.utils.aoa_to_sheet(detailData);
  ws1['!cols'] = [
    { wch: 15 },
    { wch: 20 },
    ...report.sectionLabels.map(() => ({ wch: 15 })),
    { wch: 10 },
  ];

  // Set RTL view
  if (!ws1['!views']) ws1['!views'] = [];
  (ws1['!views'] as Array<{ RTL?: boolean }>)[0] = { RTL: true };

  XLSX.utils.book_append_sheet(wb, ws1, 'פירוט');

  // ===== Sheet 2: Summary =====
  const summaryData: (string | number)[][] = [];
  summaryData.push(['קטגוריה', ...report.sectionLabels, 'סה"כ']);

  for (const group of catalog) {
    const groupData = report.groupTotals[group.type];
    if (!groupData) continue;
    summaryData.push([group.displayName, ...groupData.sectionTotals, groupData.grandTotal]);
  }

  // Grand total row
  summaryData.push(['סה"כ כללי', ...grandTotalsPerSection, report.grandTotal]);

  const ws2 = XLSX.utils.aoa_to_sheet(summaryData);
  ws2['!cols'] = [
    { wch: 15 },
    ...report.sectionLabels.map(() => ({ wch: 15 })),
    { wch: 10 },
  ];
  if (!ws2['!views']) ws2['!views'] = [];
  (ws2['!views'] as Array<{ RTL?: boolean }>)[0] = { RTL: true };

  XLSX.utils.book_append_sheet(wb, ws2, 'סיכום');

  // ===== Download =====
  const safeName = session.unitName.replace(/[\\/:*?"<>|]/g, '_');
  const dateStr = session.reportDateTime.replace(/[:.]/g, '-');
  const filename = `דוח_תחמושת_${safeName}_${dateStr}.xlsx`;

  XLSX.writeFile(wb, filename);
}
