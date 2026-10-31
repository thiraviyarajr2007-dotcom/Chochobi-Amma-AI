/**
 * Pongal Warmth Theme Tokens & Design Constants
 * Designed specifically for Tamil Mothers (warm, respectful, high contrast, readable)
 */

export const THEME_COLORS = {
  cream: '#FFF8EC',          // Background warm cream
  creamLight: '#FFFDF9',     // Extra soft cream
  surface: '#FFFFFF',        // Pure white card surface
  kumkum: '#C2185B',         // Primary kumkum rose (vibrant, auspicious)
  kumkumDark: '#880E4F',     // Deep kumkum for high contrast text / hover
  kumkumLight: '#FCE4EC',    // Kumkum tint for pills and chip backgrounds
  turmeric: '#FFB300',       // Secondary turmeric gold (joyful, festive)
  turmericDark: '#FF8F00',   // Warm amber deep
  turmericLight: '#FFF8E1',  // Turmeric light tint
  leafGreen: '#2E7D32',      // Leaf green (auspicious success, budget safe)
  leafGreenLight: '#E8F5E9', // Light green tint
  danger: '#D32F2F',         // Alert red (scam warning, error)
  dangerLight: '#FFEBEE',    // Danger tint
  warmBrown: '#3E2723',      // Text color (deep warm brown, WCAG AA compliant on cream)
  warmBrownMuted: '#5D4037', // Secondary text (still high contrast, > 4.5:1 on cream)
  warmBrownSubtle: '#8D6E63',// Tertiary labels
  borderWarm: '#EFEBE9',     // Warm card divider
  borderActive: '#D7CCC8',   // Active border
};

export const CATEGORY_META = {
  groceries: { emoji: '🌾', color: '#FFF3E0', border: '#FFE0B2', labelKey: 'categories.groceries' },
  dairy: { emoji: '🥛', color: '#E1F5FE', border: '#B3E5FC', labelKey: 'categories.dairy' },
  vegetables: { emoji: '🥕', color: '#E8F5E9', border: '#C8E6C9', labelKey: 'categories.vegetables' },
  education: { emoji: '📚', color: '#F3E5F5', border: '#E1BEE7', labelKey: 'categories.education' },
  medical: { emoji: '💊', color: '#FFEBEE', border: '#FFCDD2', labelKey: 'categories.medical' },
  utilities: { emoji: '💡', color: '#FFFDE7', border: '#FFF9C4', labelKey: 'categories.utilities' },
  temple: { emoji: '🪔', color: '#FFF8E1', border: '#FFECB3', labelKey: 'categories.temple' },
  clothing: { emoji: '🥻', color: '#FCE4EC', border: '#F8BBD0', labelKey: 'categories.clothing' },
  snacks: { emoji: '🍪', color: '#EFEBE9', border: '#D7CCC8', labelKey: 'categories.snacks' },
  transport: { emoji: '🚌', color: '#E0F2F1', border: '#B2DFDB', labelKey: 'categories.transport' },
  other: { emoji: '📦', color: '#F5F5F5', border: '#E0E0E0', labelKey: 'categories.other' },
} as const;

