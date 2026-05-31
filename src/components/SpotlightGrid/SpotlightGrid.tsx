'use client';

import { MouseEvent } from 'react';

interface SpotlightGridProps {
  children: React.ReactNode;
  className?: string;
}

export default function SpotlightGrid({
  children,
  className = '',
}: SpotlightGridProps) {
  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    for (const card of Array.from(e.currentTarget.children)) {
      if (!(card instanceof HTMLElement)) continue;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    }
  };

  return (
    <div className={className} onMouseMove={handleMouseMove}>
      {children}
    </div>
  );
}
