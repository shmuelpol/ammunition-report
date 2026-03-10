import type { AmmoGroupDef } from './types';

/**
 * Default embedded ammunition catalog.
 * Can be overridden by ammunition-types.xlsx in the Drive root folder.
 */
export const DEFAULT_CATALOG: AmmoGroupDef[] = [
  {
    type: 'shell',
    displayName: 'פגזים',
    quantityOnly: false,
    hasLots: false,
    models: [
      { id: 'M107', name: 'נפיץ M107' },
      { id: 'M107A3', name: 'נפיץ M107A3 / סרבי' },
      { id: 'M795', name: 'נפיץ M795' },
      { id: 'M485', name: 'תאורה M485' },
      { id: 'M825', name: 'עשן M825' },
      { id: 'DUMMY', name: 'דמוי' },
      { id: 'M150', name: 'M150 דומם' },
      { id: 'M401', name: 'M401' },
      { id: 'M999', name: 'M999' },
    ],
  },
  {
    type: 'fuse',
    displayName: 'מרעומים',
    quantityOnly: false,
    hasLots: false,
    models: [
      { id: '582', name: '582' },
      { id: '739', name: '739' },
      { id: '137', name: '137' },
      { id: '762', name: '762' },
      { id: '147', name: '147' },
      { id: 'RTZ148', name: 'RTZ148' },
      { id: 'SERB', name: 'סרבי' },
      { id: '984', name: '984' },
      { id: '557', name: '557' },
    ],
  },
  {
    type: 'charge',
    displayName: 'חנ"ה',
    quantityOnly: false,
    hasLots: true,
    models: [
      { id: 'M7U', name: 'M7 אחוד' },
      { id: 'M7S', name: 'M7 פרוד' },
      { id: 'M9', name: 'M9' },
      { id: 'M10', name: 'M10' },
      { id: 'M231', name: 'M231' },
    ],
  },
  {
    type: 'primer',
    displayName: 'תחלים',
    quantityOnly: true,
    hasLots: false,
    models: [{ id: 'PRIMER', name: 'תחלים' }],
  },
];
