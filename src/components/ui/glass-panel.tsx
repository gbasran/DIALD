'use client';

import LiquidGlass from 'liquid-glass-react';
import { cn } from '@/lib/utils';

interface GlassPanelProps {
  children: React.ReactNode;
  className?: string;
  /** Higher = more refraction distortion */
  intensity?: 'subtle' | 'standard' | 'strong';
}

const presets = {
  subtle: {
    displacementScale: 30,
    blurAmount: 0.05,
    saturation: 130,
    aberrationIntensity: 1,
    elasticity: 0.12,
  },
  standard: {
    displacementScale: 50,
    blurAmount: 0.0625,
    saturation: 140,
    aberrationIntensity: 1.5,
    elasticity: 0.15,
  },
  strong: {
    displacementScale: 70,
    blurAmount: 0.08,
    saturation: 150,
    aberrationIntensity: 2,
    elasticity: 0.2,
  },
};

export function GlassPanel({ children, className, intensity = 'subtle' }: GlassPanelProps) {
  const preset = presets[intensity];

  return (
    <LiquidGlass
      {...preset}
      cornerRadius={12}
      className={cn('glass-panel', className)}
    >
      {children}
    </LiquidGlass>
  );
}
