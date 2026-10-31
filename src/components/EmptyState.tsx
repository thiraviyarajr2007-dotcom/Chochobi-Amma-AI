import React, { ReactNode } from 'react';
import { Mascot } from './Mascot';
import { KolamMotif } from './KolamMotif';
import { Button } from './Button';
import { MascotMood } from '../types';

interface EmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  mascotMood?: MascotMood;
  extraContent?: ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  title,
  description,
  actionLabel,
  onAction,
  mascotMood = 'thinking',
  extraContent,
}) => {
  return (
    <div className="relative overflow-hidden rounded-3xl bg-white border border-[#EFEBE9] p-8 text-center flex flex-col items-center justify-center shadow-warm-sm">
      {/* Background Kolam Ornaments */}
      <div className="absolute -top-6 -right-6 pointer-events-none opacity-20">
        <KolamMotif size={100} color="#C2185B" />
      </div>
      <div className="absolute -bottom-6 -left-6 pointer-events-none opacity-20">
        <KolamMotif size={100} color="#FFB300" />
      </div>

      {/* Mascot with mood */}
      <div className="relative mb-4 z-10">
        <Mascot mood={mascotMood} size={110} />
      </div>

      {/* Title & Description */}
      <h3 className="text-xl font-bold text-warmBrown mb-2 z-10 leading-snug">
        {title}
      </h3>
      <p className="text-base text-warmBrown-subtle max-w-xs mb-6 z-10 font-medium">
        {description}
      </p>

      {/* Optional Action Button */}
      {actionLabel && onAction && (
        <div className="w-full max-w-xs z-10">
          <Button variant="primary" onClick={onAction}>
            {actionLabel}
          </Button>
        </div>
      )}

      {extraContent && <div className="mt-4 z-10">{extraContent}</div>}
    </div>
  );
};

