import { ReportSession, AmmoGroupDef } from './types';

// ===== Normalized report types =====

export interface NormalizedReport {
  sectionLabels: string[];
  groupTotals: Record<string, GroupReport>;
  grandTotal: number;
}

export interface GroupReport {
  models: ModelReport[];
  sectionTotals: number[];
  grandTotal: number;
}

export interface ModelReport {
  modelId: string;
  modelName: string;
  perSection: number[];
  total: number;
}

/**
 * Build a normalized report from session data and a dynamic catalog.
 */
export function buildNormalizedReport(session: ReportSession, catalog: AmmoGroupDef[]): NormalizedReport {
  const sectionLabels = session.sections.map((s) => {
    if (s.parentGroup) return `${s.parentGroup} - ${s.label}`;
    return s.label;
  });

  const groupTotals: Record<string, GroupReport> = {};
  let grandTotal = 0;

  for (const group of catalog) {
    const groupReport: GroupReport = {
      models: [],
      sectionTotals: new Array(session.sections.length).fill(0),
      grandTotal: 0,
    };

    if (group.quantityOnly) {
      // Primers — single quantity per section
      const perSection = session.sections.map((s) => {
        const entries = s.entries[group.type] || [];
        return entries[0]?.quantity || 0;
      });
      const total = perSection.reduce((a, b) => a + b, 0);

      groupReport.models.push({
        modelId: 'primer-default',
        modelName: group.displayName,
        perSection,
        total,
      });

      groupReport.sectionTotals = [...perSection];
      groupReport.grandTotal = total;
    } else {
      // For each catalog model, sum quantities across all sections
      for (const model of group.models) {
        const perSection = session.sections.map((s) => {
          const entries = s.entries[group.type] || [];
          return entries
            .filter((e) => e.modelId === model.id)
            .reduce((sum, e) => sum + (e.quantity || 0), 0);
        });
        const total = perSection.reduce((a, b) => a + b, 0);

        groupReport.models.push({
          modelId: model.id,
          modelName: model.name,
          perSection,
          total,
        });

        perSection.forEach((qty, i) => {
          groupReport.sectionTotals[i] += qty;
        });
        groupReport.grandTotal += total;
      }
    }

    grandTotal += groupReport.grandTotal;
    groupTotals[group.type] = groupReport;
  }

  return { sectionLabels, groupTotals, grandTotal };
}
