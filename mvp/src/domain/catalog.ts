import { AmmoGroupDef, AmmoGroupType } from './types';

/**
 * Full ammunition catalog.
 * The UI and reports are driven from this catalog —
 * any model not entered by the user will appear as 0 in reports.
 */
export const ammoCatalog: AmmoGroupDef[] = [
  {
    type: 'shell',
    displayName: 'פגז',
    requiresSerial: false,
    quantityOnly: false,
    models: [
      { id: 'shell-m107', name: 'נפיץ M107' },
      { id: 'shell-m107a3', name: 'נפיץ M107A3 / סרבי' },
      { id: 'shell-m795', name: 'נפיץ M795' },
      { id: 'shell-m485', name: 'תאורה M485' },
      { id: 'shell-m825', name: 'עשן M825' },
      { id: 'shell-dummy', name: 'דמוי נפיץ' },
      { id: 'shell-m150', name: 'עשן הפלטה M150' },
      { id: 'shell-m401', name: 'נפיץ ארוך טווח M401' },
      { id: 'shell-m999', name: 'M999' },
    ],
  },
  {
    type: 'charge',
    displayName: 'חנ"ה',
    requiresSerial: true,
    quantityOnly: false,
    models: [
      { id: 'charge-m7', name: 'M7' },
      { id: 'charge-m85', name: 'M8.5' },
      { id: 'charge-m9', name: 'M9' },
      { id: 'charge-m10', name: 'M10' },
      { id: 'charge-modular', name: 'מודולארי' },
    ],
  },
  {
    type: 'fuse',
    displayName: 'מרעום',
    requiresSerial: false,
    quantityOnly: false,
    models: [
      { id: 'fuse-m999', name: 'M999' },
      { id: 'fuse-582', name: '582' },
      { id: 'fuse-739', name: '739' },
      { id: 'fuse-137', name: '137' },
      { id: 'fuse-762', name: '762' },
      { id: 'fuse-147', name: '147' },
      { id: 'fuse-rtz984', name: 'RTZ984' },
      { id: 'fuse-serbian', name: 'סרבי M02P1' },
    ],
  },
  {
    type: 'primer',
    displayName: 'תחלים',
    requiresSerial: false,
    quantityOnly: true,
    models: [],
  },
  {
    type: 'bullet',
    displayName: 'קליעית',
    requiresSerial: false,
    quantityOnly: false,
    models: [
      { id: 'bullet-556', name: '5.56' },
      { id: 'bullet-556-tracer', name: '5.56 נותב' },
      { id: 'bullet-556-bullet', name: '5.56 קלע' },
      { id: 'bullet-762', name: '7.62' },
    ],
  },
];

export function getCatalogGroup(type: AmmoGroupType): AmmoGroupDef | undefined {
  return ammoCatalog.find((g) => g.type === type);
}
