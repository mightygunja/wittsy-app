import React from 'react';
import Svg, { Path, Circle, Line } from 'react-native-svg';

/**
 * Show/hide password eye icon for Input's rightElement slot.
 * `hidden` = the password is currently masked (renders the slash).
 */
export const EyeIcon: React.FC<{ color: string; hidden: boolean }> = ({ color, hidden }) => (
  <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
    <Path
      d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7-10-7-10-7z"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Circle cx={12} cy={12} r={3} stroke={color} strokeWidth={1.8} />
    {hidden && <Line x1={4} y1={20} x2={20} y2={4} stroke={color} strokeWidth={1.8} strokeLinecap="round" />}
  </Svg>
);
