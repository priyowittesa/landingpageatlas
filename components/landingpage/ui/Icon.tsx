import type { CSSProperties } from "react";
import { ICON_PATHS, type IconName } from "./icons";

type IconProps = {
  name: IconName;
  size?: number;
  className?: string;
  style?: CSSProperties;
};

export function Icon({ name, size = 20, className, style }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.9"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
      className={className}
      style={style}
    >
      {ICON_PATHS[name]}
    </svg>
  );
}
