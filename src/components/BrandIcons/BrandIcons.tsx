import type { ReactNode } from 'react';

interface BrandIconProps {
  size?: number;
  className?: string;
}

// lucide-react dropped its brand icons in 1.0. These are the outline glyphs
// it shipped until then, kept so they still match the stroke style of the
// lucide icons rendered next to them.
// Glyphs: copyright (c) Cole Bemis (Feather, MIT) and Lucide Contributors (ISC).
function BrandIcon({
  size = 24,
  className,
  children,
}: BrandIconProps & { children: ReactNode }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  );
}

export function FacebookIcon(props: BrandIconProps) {
  return (
    <BrandIcon {...props}>
      <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z" />
    </BrandIcon>
  );
}

export function InstagramIcon(props: BrandIconProps) {
  return (
    <BrandIcon {...props}>
      <rect width="20" height="20" x="2" y="2" rx="5" ry="5" />
      <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
      <line x1="17.5" x2="17.51" y1="6.5" y2="6.5" />
    </BrandIcon>
  );
}
