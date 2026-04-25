import React from 'react';
import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '@/theme';

interface Props {
  size?: number;
  color?: string;
  strokeWidth?: number;
}

export function CopticCross({
  size = 28,
  color = colors.gold,
  strokeWidth = 2.4,
}: Props) {
  const common = {
    stroke: color,
    strokeWidth,
    strokeLinecap: 'round' as const,
    fill: 'none',
  };
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Path d="M32 8 V56" {...common} />
      <Path d="M8 32 H56" {...common} />
      <Circle cx={32} cy={32} r={9} {...common} />
      <Path d="M22 8 H42" {...common} />
      <Path d="M22 56 H42" {...common} />
      <Path d="M8 22 V42" {...common} />
      <Path d="M56 22 V42" {...common} />
    </Svg>
  );
}
