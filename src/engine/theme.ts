// Visual system: one palette and type scale for the whole series.
export const C = {
  ink0: '#050817', ink1: '#0A1136', ink2: '#111A4A', panel: '#141F57', line: '#2B3A7A',
  text: '#F3F5FF', text2: '#AEB8E4', text3: '#6F7BB3',
  blue: '#3A63FF', violet: '#7B3BF0', magenta: '#E0287A', red: '#FF3B45', cyan: '#39D5FF',
  cms: '#3F8CFF', xray: '#FF6B3D', nmr: '#2BD17E', purple: '#9B4DFF',
  gold: '#FFC857',
};
export const BRAND = [C.blue, C.violet, C.magenta];
export const DOMAINS = [
  { id: 'cms', color: C.cms, name: ['Chromatography /', 'Mass Spectrometry'], short: 'Chromatography / MS' },
  { id: 'xray', color: C.xray, name: ['X-Ray', 'Spectroscopy / Microscopy'], short: 'X-Ray Spectroscopy / Microscopy' },
  { id: 'nmr', color: C.nmr, name: ['NMR / Physical /', 'Thermal Characterisation'], short: 'NMR / Physical / Thermal' },
] as const;
export const F = { display: 'Display', body: 'Body', mono: 'Mono' } as const;
export type FontKey = keyof typeof F;
