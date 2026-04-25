import { Platform, TextStyle } from 'react-native';

export const fonts = {
  displayRegular: 'Amiri_400Regular',
  displayBold: 'Amiri_700Bold',
  body: 'Cairo_400Regular',
  bodyLight: 'Cairo_300Light',
  bodyMedium: 'Cairo_500Medium',
  bodySemiBold: 'Cairo_600SemiBold',
  bodyBold: 'Cairo_700Bold',
} as const;

export const fontSizes = {
  xs: 11,
  sm: 13,
  md: 15,
  lg: 17,
  xl: 20,
  xxl: 24,
  display: 30,
  hero: 38,
} as const;

const baseRTL: TextStyle = {
  writingDirection: 'rtl',
  textAlign: 'right',
};

export const text = {
  hero: {
    fontFamily: fonts.displayBold,
    fontSize: fontSizes.hero,
    lineHeight: fontSizes.hero * 1.25,
    ...baseRTL,
  },
  display: {
    fontFamily: fonts.displayBold,
    fontSize: fontSizes.display,
    lineHeight: fontSizes.display * 1.25,
    ...baseRTL,
  },
  title: {
    fontFamily: fonts.displayBold,
    fontSize: fontSizes.xxl,
    lineHeight: fontSizes.xxl * 1.3,
    ...baseRTL,
  },
  heading: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.xl,
    lineHeight: fontSizes.xl * 1.35,
    ...baseRTL,
  },
  subheading: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.lg,
    lineHeight: fontSizes.lg * 1.4,
    ...baseRTL,
  },
  body: {
    fontFamily: fonts.body,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.55,
    ...baseRTL,
  },
  bodyMedium: {
    fontFamily: fonts.bodyMedium,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.55,
    ...baseRTL,
  },
  bodyBold: {
    fontFamily: fonts.bodyBold,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.55,
    ...baseRTL,
  },
  small: {
    fontFamily: fonts.body,
    fontSize: fontSizes.sm,
    lineHeight: fontSizes.sm * 1.55,
    ...baseRTL,
  },
  caption: {
    fontFamily: fonts.body,
    fontSize: fontSizes.xs,
    lineHeight: fontSizes.xs * 1.5,
    ...baseRTL,
  },
  button: {
    fontFamily: fonts.bodySemiBold,
    fontSize: fontSizes.md,
    lineHeight: fontSizes.md * 1.2,
    ...baseRTL,
  },
} as const satisfies Record<string, TextStyle>;

export const elevation = {
  card: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 1 },
      shadowOpacity: 0.06,
      shadowRadius: 6,
    },
    android: {
      elevation: 2,
    },
    default: {},
  }),
  fab: Platform.select({
    ios: {
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.18,
      shadowRadius: 10,
    },
    android: {
      elevation: 6,
    },
    default: {},
  }),
} as const;
