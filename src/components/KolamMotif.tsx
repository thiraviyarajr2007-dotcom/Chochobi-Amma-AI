import React from 'react';

interface KolamMotifProps {
  size?: number;
  className?: string;
  opacity?: number;
  color?: string;
}

export const KolamMotif: React.FC<KolamMotifProps> = ({
  size = 120,
  className = '',
  opacity = 0.25,
  color = '#C2185B',
}) => {
  return (
    <svg
      viewBox="0 0 100 100"
      width={size}
      height={size}
      className={`select-none pointer-events-none ${className}`}
      style={{ opacity }}
      aria-hidden="true"
    >
      {/* Traditional 5x5 Sikku / Pulli Kolam Loop Motifs */}
      {/* Central dot */}
      <circle cx="50" cy="50" r="2.5" fill={color} />
      {/* Surrounding dots */}
      <circle cx="30" cy="50" r="2" fill={color} />
      <circle cx="70" cy="50" r="2" fill={color} />
      <circle cx="50" cy="30" r="2" fill={color} />
      <circle cx="50" cy="70" r="2" fill={color} />
      
      <circle cx="36" cy="36" r="2" fill={color} />
      <circle cx="64" cy="36" r="2" fill={color} />
      <circle cx="36" cy="64" r="2" fill={color} />
      <circle cx="64" cy="64" r="2" fill={color} />

      {/* Symmetric Kolam Curving Petals / Loops */}
      <path
        d="M50 15 C65 25, 65 40, 50 50 C35 40, 35 25, 50 15 Z"
        stroke={color}
        strokeWidth="1.8"
        fill="none"
      />
      <path
        d="M50 85 C65 75, 65 60, 50 50 C35 60, 35 75, 50 85 Z"
        stroke={color}
        strokeWidth="1.8"
        fill="none"
      />
      <path
        d="M15 50 C25 65, 40 65, 50 50 C40 35, 25 35, 15 50 Z"
        stroke={color}
        strokeWidth="1.8"
        fill="none"
      />
      <path
        d="M85 50 C75 65, 60 65, 50 50 C60 35, 75 35, 85 50 Z"
        stroke={color}
        strokeWidth="1.8"
        fill="none"
      />

      {/* Outer Lotus Petal Arc Accents */}
      <circle cx="50" cy="50" r="38" stroke={color} strokeWidth="1" strokeDasharray="3,4" fill="none" />
      <circle cx="50" cy="50" r="46" stroke="#FFB300" strokeWidth="0.8" strokeDasharray="2,3" fill="none" />
    </svg>
  );
};

