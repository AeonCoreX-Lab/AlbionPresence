import React, { type ReactElement } from 'react';
import Svg, { Circle, Line, Path, Rect } from 'react-native-svg';

export interface IconProps {
  color: string;
  size?: number;
}

function Base({ color, size = 24, children }: IconProps & { children: ReactElement | ReactElement[] }) {
  return (
    <Svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      accessibilityElementsHidden
      importantForAccessibility="no"
    >
      {children}
    </Svg>
  );
}

export function HomeIcon(props: IconProps): ReactElement {
  return (
    <Base {...props}>
      <Path d="M4 11l8-7 8 7" />
      <Path d="M6 10v10h12V10" />
      <Path d="M10 20v-6h4v6" />
    </Base>
  );
}

export function PreviewIcon(props: IconProps): ReactElement {
  return (
    <Base {...props}>
      <Rect x={3} y={4} width={18} height={13} rx={2} />
      <Path d="M12 17v4" />
      <Path d="M8 21h8" />
    </Base>
  );
}

/** Settings icon drawn as sliders. */
export function SlidersIcon(props: IconProps): ReactElement {
  return (
    <Base {...props}>
      <Line x1={4} y1={7} x2={20} y2={7} />
      <Line x1={4} y1={12} x2={20} y2={12} />
      <Line x1={4} y1={17} x2={20} y2={17} />
      <Circle cx={9} cy={7} r={2} fill="#09081D" />
      <Circle cx={15} cy={12} r={2} fill="#09081D" />
      <Circle cx={8} cy={17} r={2} fill="#09081D" />
    </Base>
  );
}

export function InfoIcon(props: IconProps): ReactElement {
  return (
    <Base {...props}>
      <Circle cx={12} cy={12} r={9} />
      <Line x1={12} y1={11} x2={12} y2={16} />
      <Circle cx={12} cy={8} r={0.6} fill={props.color} />
    </Base>
  );
}

export function ClockIcon(props: IconProps): ReactElement {
  return (
    <Base {...props}>
      <Circle cx={12} cy={12} r={9} />
      <Path d="M12 7v5l3 2" />
    </Base>
  );
}

export function CheckIcon(props: IconProps): ReactElement {
  return (
    <Base {...props}>
      <Path d="M5 12.5l4.5 4.5L19 7.5" />
    </Base>
  );
}

export function ShieldCheckIcon(props: IconProps): ReactElement {
  return (
    <Base {...props}>
      <Path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />
      <Path d="M8.5 12l2.5 2.5L16 9.5" />
    </Base>
  );
}

export function LockIcon(props: IconProps): ReactElement {
  return (
    <Base {...props}>
      <Rect x={5} y={11} width={14} height={9} rx={2} />
      <Path d="M8 11V8a4 4 0 018 0v3" />
    </Base>
  );
}
