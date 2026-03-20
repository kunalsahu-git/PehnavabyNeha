export type ProductColor = {
  name: string;
  /** CSS hex value like '#C0392B', or the special string 'multi' */
  hex: string;
};

/** Curated fashion-forward color palette */
export const FASHION_COLORS: ProductColor[] = [
  // Neutrals & Metallics
  { name: 'Black',       hex: '#1C1C1C' },
  { name: 'Charcoal',    hex: '#36454F' },
  { name: 'Grey',        hex: '#9E9E9E' },
  { name: 'White',       hex: '#FFFFFF' },
  { name: 'Ivory',       hex: '#FFFFF0' },
  { name: 'Cream',       hex: '#FFF8DC' },
  { name: 'Beige',       hex: '#F5F0E8' },
  { name: 'Champagne',   hex: '#F7E7CE' },
  { name: 'Gold',        hex: '#D4AF37' },
  { name: 'Silver',      hex: '#C0C0C0' },
  { name: 'Rose Gold',   hex: '#B76E79' },
  // Reds & Pinks
  { name: 'Red',         hex: '#C0392B' },
  { name: 'Maroon',      hex: '#800000' },
  { name: 'Blush',       hex: '#FFB6C1' },
  { name: 'Pink',        hex: '#F48FB1' },
  { name: 'Hot Pink',    hex: '#E91E8C' },
  { name: 'Magenta',     hex: '#C2185B' },
  // Oranges & Yellows
  { name: 'Peach',       hex: '#FFCBA4' },
  { name: 'Coral',       hex: '#FF6B6B' },
  { name: 'Terracotta',  hex: '#E2725B' },
  { name: 'Rust',        hex: '#B7410E' },
  { name: 'Orange',      hex: '#E67E22' },
  { name: 'Mustard',     hex: '#E3A020' },
  { name: 'Yellow',      hex: '#F1C40F' },
  // Greens
  { name: 'Mint',        hex: '#A8E6CF' },
  { name: 'Sage',        hex: '#87AE73' },
  { name: 'Green',       hex: '#27AE60' },
  { name: 'Olive',       hex: '#808000' },
  { name: 'Bottle Green',hex: '#006A4E' },
  // Blues & Teals
  { name: 'Turquoise',   hex: '#40E0D0' },
  { name: 'Teal',        hex: '#008080' },
  { name: 'Sky Blue',    hex: '#87CEEB' },
  { name: 'Blue',        hex: '#3498DB' },
  { name: 'Royal Blue',  hex: '#4169E1' },
  { name: 'Navy',        hex: '#001F5B' },
  // Purples
  { name: 'Lavender',    hex: '#E6E6FA' },
  { name: 'Lilac',       hex: '#C8A2C8' },
  { name: 'Purple',      hex: '#9B59B6' },
  { name: 'Plum',        hex: '#5D0060' },
  // Special
  { name: 'Multi',       hex: 'multi'   },
];

/** Map from lowercase name → ProductColor for fast lookups */
const COLOR_MAP = new Map(FASHION_COLORS.map(c => [c.name.toLowerCase(), c]));

/**
 * Accept either a legacy string ("Red") or a ProductColor object.
 * Falls back to a neutral grey with the original string as the name.
 */
export function normalizeColor(raw: unknown): ProductColor {
  if (raw && typeof raw === 'object' && 'name' in raw && 'hex' in raw) {
    return raw as ProductColor;
  }
  if (typeof raw === 'string') {
    return COLOR_MAP.get(raw.toLowerCase()) ?? { name: raw, hex: '#888888' };
  }
  return { name: 'Unknown', hex: '#888888' };
}

/**
 * Returns a CSS background value for a hex string.
 * Handles the special 'multi' value with a gradient.
 */
export function colorToCSS(hex: string): string {
  if (hex === 'multi') {
    return 'linear-gradient(135deg, #E2725B 0%, #F1C40F 20%, #27AE60 40%, #3498DB 60%, #9B59B6 80%, #E91E8C 100%)';
  }
  return hex;
}

/**
 * Returns true if the color is visually very light and needs a border to be visible
 * on a white background.
 */
export function isLightColor(hex: string): boolean {
  if (hex === 'multi') return false;
  const h = hex.replace('#', '');
  if (h.length < 6) return false;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  // Perceived luminance
  return (r * 299 + g * 587 + b * 114) / 1000 > 220;
}
