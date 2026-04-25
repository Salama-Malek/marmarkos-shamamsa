export const colors = {
  bg: '#F6F0E4',
  bgDeep: '#EFE6D4',
  surface: '#FFFCF6',

  primary: '#7A1F2C',
  primaryDark: '#5C1721',
  primaryLight: '#9A2D3D',

  gold: '#B8954A',
  goldDeep: '#8C6F35',
  goldLight: '#E8D8B0',

  text: '#2A1E1A',
  textMuted: '#6B5D55',
  textSubtle: '#A89687',

  border: '#E4D6C2',
  borderStrong: '#D2BFA5',

  present: '#5F8A4E',
  presentBg: '#E6EFDD',
  absent: '#A84545',
  absentBg: '#F3DEDE',
  excused: '#B8954A',
  excusedBg: '#F3E8D0',
  cancelled: '#8C7B6E',
  cancelledBg: '#E8E0D5',

  white: '#FFFFFF',
  black: '#000000',
  shadow: '#000000',
} as const;

export type ColorToken = keyof typeof colors;
