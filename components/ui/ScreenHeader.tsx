import React from 'react';
import { StyleSheet, Text, View, type ViewStyle, type StyleProp } from 'react-native';
import { colors, elevation, radii, spacing } from '@/theme';
import { CopticCross } from './CopticCross';

interface Props {
  title: string;
  subtitle?: string;
  showCross?: boolean;
  right?: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  /**
   * Branded hero card on the four main tabs (deep red panel + gold cross).
   * Sub-screens with a back/close action default to the compact variant.
   * Auto: hero when no `right` action; compact otherwise.
   */
  variant?: 'hero' | 'compact' | 'auto';
}

export function ScreenHeader({
  title,
  subtitle,
  showCross = true,
  right,
  style,
  variant = 'auto',
}: Props) {
  const resolved: 'hero' | 'compact' =
    variant === 'auto' ? (right ? 'compact' : 'hero') : variant;

  if (resolved === 'hero') {
    return <HeroHeader title={title} subtitle={subtitle} showCross={showCross} style={style} />;
  }
  return (
    <CompactHeader
      title={title}
      subtitle={subtitle}
      showCross={showCross}
      right={right}
      style={style}
    />
  );
}

function HeroHeader({
  title,
  subtitle,
  showCross,
  style,
}: Pick<Props, 'title' | 'subtitle' | 'showCross' | 'style'>) {
  return (
    <View style={[heroStyles.wrap, style]}>
      <View style={heroStyles.card}>
        <View style={heroStyles.row}>
          <View style={heroStyles.titleBlock}>
            <Text style={heroStyles.title} numberOfLines={2}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={heroStyles.subtitle} numberOfLines={1}>
                {subtitle}
              </Text>
            ) : null}
            {/*
              Wrapping the accent in a row container is the bulletproof way
              to anchor it at the layout-direction start: in row layout RN
              reliably treats the first child as "start side" (right in RTL,
              left in LTR). Trying alignSelf: flex-start on the accent in a
              column container has Yoga edge cases on RN 0.81 in RTL where
              the value didn't actually flip, so the stripe ended up on the
              wrong side of the title.
            */}
            <View style={heroStyles.accentRow}>
              <View style={heroStyles.accent} />
            </View>
          </View>
          {showCross ? (
            <View style={heroStyles.crossWrap}>
              <CopticCross size={32} color={colors.gold} strokeWidth={2.6} />
            </View>
          ) : null}
        </View>
      </View>
    </View>
  );
}

function CompactHeader({
  title,
  subtitle,
  showCross,
  right,
  style,
}: Pick<Props, 'title' | 'subtitle' | 'showCross' | 'right' | 'style'>) {
  return (
    <View style={[compactStyles.wrap, style]}>
      {/*
        The `right` prop is the back/close action. We render it FIRST in the
        row so it lands on the start side — visually right in RTL (where
        Arabic users expect "back"), and visually left in LTR (where Western
        users expect it). Title block fills the rest.
      */}
      {right ? <View style={compactStyles.action}>{right}</View> : null}
      <View style={compactStyles.titleBlock}>
        <Text style={compactStyles.title} numberOfLines={1}>
          {title}
        </Text>
        {subtitle ? (
          <Text style={compactStyles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        ) : null}
      </View>
      {showCross ? <CopticCross size={26} color={colors.gold} /> : null}
    </View>
  );
}

const heroStyles = StyleSheet.create({
  wrap: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.xs,
    paddingBottom: spacing.sm,
    backgroundColor: colors.bg,
  },
  card: {
    backgroundColor: colors.primary,
    borderRadius: radii.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.primaryDark,
    ...(elevation.card as object),
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  titleBlock: {
    flex: 1,
    gap: 2,
  },
  title: {
    fontFamily: 'Amiri_700Bold',
    color: colors.white,
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontFamily: 'Cairo_500Medium',
    color: colors.goldLight,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
    marginTop: 2,
  },
  accentRow: {
    flexDirection: 'row',
    marginTop: 6,
    alignSelf: 'stretch',
  },
  accent: {
    height: 2,
    width: 44,
    backgroundColor: colors.gold,
    borderRadius: 1,
    opacity: 0.95,
  },
  crossWrap: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radii.md,
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderWidth: 1,
    borderColor: 'rgba(232, 216, 176, 0.35)',
  },
});

const compactStyles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    backgroundColor: colors.bg,
    gap: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  titleBlock: {
    flex: 1,
  },
  title: {
    fontFamily: 'Amiri_700Bold',
    color: colors.primary,
    fontSize: 22,
    lineHeight: 30,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  subtitle: {
    fontFamily: 'Cairo_400Regular',
    color: colors.textMuted,
    fontSize: 12,
    lineHeight: 16,
    textAlign: 'right',
    writingDirection: 'rtl',
  },
  action: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
