import React from 'react';
import { MascotMood } from '../types';

interface MascotProps {
  mood?: MascotMood;
  size?: number;
  className?: string;
  animate?: boolean;
}

export const Mascot: React.FC<MascotProps> = ({
  mood = 'happy',
  size = 120,
  className = '',
  animate = true,
}) => {
  return (
    <div
      className={`inline-flex items-center justify-center relative select-none ${className}`}
      style={{ width: size, height: size }}
      role="img"
      aria-label={`Chocobi Amma Mascot (${mood})`}
    >
      <svg
        viewBox="0 0 200 200"
        width={size}
        height={size}
        className={animate ? 'transition-transform duration-300' : ''}
      >
        <defs>
          <filter id="softGlow" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="#C2185B" floodOpacity="0.15" />
          </filter>
          <linearGradient id="sareeGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stop-color="#C2185B" />
            <stop offset="100%" stop-color="#880E4F" />
          </linearGradient>
          <linearGradient id="biscuitGrad" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" stop-color="#A1887F" />
            <stop offset="100%" stop-color="#6D4C41" />
          </linearGradient>
        </defs>

        {/* Halo / Warm Background Aura */}
        <circle
          cx="100"
          cy="100"
          r="86"
          fill={mood === 'alert' ? '#FFEBEE' : mood === 'celebrate' ? '#FFF9C4' : '#FFF3E0'}
          opacity="0.8"
        />

        {/* Celebrate Sparkles / Confetti Dots */}
        {mood === 'celebrate' && (
          <g>
            <circle cx="35" cy="45" r="4" fill="#FFB300" />
            <circle cx="165" cy="40" r="5" fill="#E91E63" />
            <circle cx="25" cy="95" r="3" fill="#2E7D32" />
            <circle cx="175" cy="100" r="4" fill="#FFB300" />
            {/* Little stars */}
            <path d="M40 30 L43 36 L49 37 L44 41 L46 47 L40 43 L34 47 L36 41 L31 37 L37 36 Z" fill="#FFB300" />
            <path d="M160 25 L162 29 L167 30 L163 33 L164 38 L160 35 L156 38 L157 33 L153 30 L158 29 Z" fill="#C2185B" />
          </g>
        )}

        {/* Alert Warning Sign Badge */}
        {mood === 'alert' && (
          <g transform="translate(145, 20)">
            <circle cx="16" cy="16" r="16" fill="#D32F2F" />
            <text x="16" y="22" fill="#FFFFFF" fontSize="16" fontWeight="bold" textAnchor="middle">!</text>
          </g>
        )}

        {/* Thinking Bubbles */}
        {mood === 'thinking' && (
          <g opacity="0.8">
            <circle cx="145" cy="50" r="5" fill="#C2185B" />
            <circle cx="158" cy="40" r="8" fill="#C2185B" />
            <circle cx="170" cy="25" r="12" fill="#C2185B" />
            <text x="170" y="30" fill="#FFFFFF" fontSize="13" fontWeight="bold" textAnchor="middle">?</text>
          </g>
        )}

        {/* Hair Bun (Kondai) */}
        <ellipse cx="100" cy="70" rx="46" ry="42" fill="#2E1C14" />
        <circle cx="138" cy="74" r="16" fill="#2E1C14" />
        
        {/* Mallipoo (Jasmine Garland on Bun) */}
        <g fill="#FFFFFF" stroke="#FFF9C4" strokeWidth="0.5">
          <circle cx="132" cy="62" r="4.5" />
          <circle cx="140" cy="65" r="4" />
          <circle cx="146" cy="72" r="4.5" />
          <circle cx="144" cy="80" r="4" />
          <circle cx="137" cy="86" r="4.5" />
        </g>

        {/* Amma Face */}
        <circle cx="100" cy="98" r="37" fill="#F7CA9C" />

        {/* Traditional Kumkum Pottu (Bindi) */}
        <circle cx="100" cy="82" r="4" fill="#C2185B" />

        {/* Eyes according to Mood */}
        {mood === 'happy' && (
          <g>
            {/* Happy curved eyes */}
            <path d="M86 94 Q93 88 100 94" stroke="#2E1C14" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            <path d="M107 94 Q114 88 121 94" stroke="#2E1C14" strokeWidth="2.5" strokeLinecap="round" fill="none" />
            {/* Eyebrows */}
            <path d="M85 86 Q92 82 99 86" stroke="#2E1C14" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M108 86 Q115 82 122 86" stroke="#2E1C14" strokeWidth="2" strokeLinecap="round" fill="none" />
          </g>
        )}

        {mood === 'thinking' && (
          <g>
            {/* Thoughtful eyes looking up-right */}
            <ellipse cx="91" cy="94" rx="4.5" ry="6" fill="#2E1C14" />
            <circle cx="93" cy="92" r="2" fill="#FFFFFF" />
            <ellipse cx="113" cy="94" rx="4.5" ry="6" fill="#2E1C14" />
            <circle cx="115" cy="92" r="2" fill="#FFFFFF" />
            {/* One raised eyebrow */}
            <path d="M85 87 Q92 85 99 87" stroke="#2E1C14" strokeWidth="2" strokeLinecap="round" fill="none" />
            <path d="M108 84 Q115 78 123 83" stroke="#2E1C14" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          </g>
        )}

        {mood === 'alert' && (
          <g>
            {/* Wide alert eyes */}
            <ellipse cx="90" cy="94" rx="6" ry="7" fill="#FFFFFF" stroke="#2E1C14" strokeWidth="2" />
            <circle cx="90" cy="94" r="3.5" fill="#2E1C14" />
            <ellipse cx="114" cy="94" rx="6" ry="7" fill="#FFFFFF" stroke="#2E1C14" strokeWidth="2" />
            <circle cx="114" cy="94" r="3.5" fill="#2E1C14" />
            {/* Concerned / protective eyebrows */}
            <path d="M84 84 Q92 88 98 85" stroke="#2E1C14" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M109 85 Q115 88 123 84" stroke="#2E1C14" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          </g>
        )}

        {mood === 'celebrate' && (
          <g>
            {/* Joyful dancing curved eyes */}
            <path d="M85 95 Q92 88 99 95" stroke="#2E1C14" strokeWidth="3" strokeLinecap="round" fill="none" />
            <path d="M108 95 Q115 88 122 95" stroke="#2E1C14" strokeWidth="3" strokeLinecap="round" fill="none" />
            {/* Joyful arched brows */}
            <path d="M84 85 Q92 80 100 85" stroke="#2E1C14" strokeWidth="2.2" strokeLinecap="round" fill="none" />
            <path d="M107 85 Q115 80 123 85" stroke="#2E1C14" strokeWidth="2.2" strokeLinecap="round" fill="none" />
          </g>
        )}

        {/* Gold Nose Pin (Mookuthi) */}
        <circle cx="106" cy="102" r="1.8" fill="#FFB300" />

        {/* Rosy Cheeks */}
        <circle cx="83" cy="103" r="5" fill="#FF8A80" opacity="0.4" />
        <circle cx="120" cy="103" r="5" fill="#FF8A80" opacity="0.4" />

        {/* Mouth according to Mood */}
        {mood === 'happy' && (
          <path d="M93 108 Q103 118 113 108" stroke="#C2185B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        )}

        {mood === 'thinking' && (
          <path d="M96 111 Q103 109 110 111" stroke="#C2185B" strokeWidth="2.5" strokeLinecap="round" fill="none" />
        )}

        {mood === 'alert' && (
          <ellipse cx="103" cy="111" rx="4" ry="4.5" fill="#C2185B" />
        )}

        {mood === 'celebrate' && (
          <path d="M92 107 Q103 124 114 107 Z" fill="#C2185B" stroke="#880E4F" strokeWidth="1.5" />
        )}

        {/* Saree & Blouse */}
        <path
          d="M58 148 C68 132, 132 132, 142 148 C152 165, 160 195, 160 200 L40 200 C40 195, 48 165, 58 148 Z"
          fill="url(#sareeGrad)"
        />

        {/* Gold Zari Border on Saree */}
        <path d="M72 140 Q100 160 128 140" stroke="#FFB300" strokeWidth="5" fill="none" strokeLinecap="round" />
        {/* Mangalsutra / Gold Chain */}
        <path d="M85 140 Q100 162 115 140" stroke="#FFB300" strokeWidth="2" fill="none" />
        <circle cx="100" cy="160" r="4.5" fill="#FFB300" />

        {/* Hand gesture for thinking / celebrate */}
        {mood === 'thinking' && (
          <g transform="translate(108, 108)">
            <ellipse cx="6" cy="6" rx="5" ry="4" fill="#F7CA9C" />
          </g>
        )}

        {mood === 'celebrate' && (
          <g>
            {/* Victory hands */}
            <path d="M52 155 Q42 135 38 120" stroke="#F7CA9C" strokeWidth="7" strokeLinecap="round" fill="none" />
            <circle cx="38" cy="118" r="5" fill="#F7CA9C" />
            <path d="M148 155 Q158 135 162 120" stroke="#F7CA9C" strokeWidth="7" strokeLinecap="round" fill="none" />
            <circle cx="162" cy="118" r="5" fill="#F7CA9C" />
          </g>
        )}

        {/* Chocobi Mascot Biscuit Badge Pin on Saree Pallu */}
        <g transform="translate(126, 142)" filter="url(#softGlow)">
          <circle cx="16" cy="16" r="18" fill="#FFFFFF" />
          <circle cx="16" cy="16" r="15" fill="url(#biscuitGrad)" />
          {/* Biscuit scallops / notches */}
          <circle cx="16" cy="16" r="12" fill="#8D6E63" stroke="#5D4037" strokeWidth="1" strokeDasharray="3,2" />
          {/* Chocolate chips */}
          <circle cx="12" cy="12" r="1.8" fill="#3E2723" />
          <circle cx="20" cy="12" r="1.8" fill="#3E2723" />
          <circle cx="16" cy="20" r="1.8" fill="#3E2723" />
          <circle cx="11" cy="19" r="1.4" fill="#3E2723" />
          <circle cx="21" cy="19" r="1.4" fill="#3E2723" />
        </g>
      </svg>
    </div>
  );
};

