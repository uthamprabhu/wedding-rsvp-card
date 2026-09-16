'use client';

import { PaperTexture } from '@paper-design/shaders-react';

interface PaperBackgroundProps {
  className?: string;
  zIndex?: number;
}

export default function PaperBackground({ className = '', zIndex = -1 }: PaperBackgroundProps) {
  return (
    <div 
      className={`fixed inset-0 pointer-events-none w-full h-full ${className}`} 
      style={{ 
        zIndex,
        backgroundColor: '#EBE1D6', // Fallback color while shader loads
      }}
    >
      <PaperTexture
        colorBack="#EBE1D6"
        colorFront="#D4C4B0"
        contrast={0.25}
        roughness={0.5}
        fiber={0.4}
        fiberSize={0.15}
        crumples={0.3}
        crumpleSize={0.4}
        folds={0.5}
        foldCount={3}
        drops={0.15}
        fade={0.2}
        seed={42}
        scale={0.8}
        width="100%"
        height="100%"
        fit="cover"
      />
    </div>
  );
}
