'use client';

import { MouseEvent, useRef } from 'react';

interface SpotlightGridProps {
  children: React.ReactNode;
  className?: string;
}

export default function SpotlightGrid({
  children,
  className = '',
}: SpotlightGridProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;
    for (const card of Array.from(containerRef.current.children)) {
      if (!(card instanceof HTMLElement)) continue;
      const rect = card.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      card.style.setProperty('--mouse-x', `${x}px`);
      card.style.setProperty('--mouse-y', `${y}px`);
    }
  };

  return (
    <div ref={containerRef} className={className} onMouseMove={handleMouseMove}>
      {children}
    </div>
  );
}
