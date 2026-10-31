import { ExpenseCategory } from '../types';

export interface ParsedExpenseItem {
  category: ExpenseCategory;
  amount: number;
  note: string;
}

// Category keyword mapping for Tamil, Tanglish, and English
const CATEGORY_KEYWORDS: Record<ExpenseCategory, string[]> = {
  dairy: [
    'பால்', 'தயிர்', 'மோர்', 'நெய்', 'வெண்ணெய்', 'milk', 'curd', 'ghee',
    'butter', 'dairy', 'aavin', 'ஆவின்',
  ],
  vegetables: [
    'காய்கறி', 'காய்கறிகள்', 'தக்காளி', 'வெங்காயம்', 'பழம்', 'பழங்கள்', 'கீரை',
    'உழவர் சந்தை', 'vegetable', 'vegetables', 'veggie', 'veggies', 'tomato',
    'onion', 'fruits', 'greens',
  ],
  groceries: [
    'மளிகை', 'அரிசி', 'பருப்பு', 'எண்ணெய்', 'மளிகைக் கடை', 'சூப்பர் மார்க்கெட்',
    'ரசீது', 'grocery', 'groceries', 'rice', 'dal', 'oil', 'provision',
    'provisions', 'supermarket',
  ],
  medical: [
    'மருந்து', 'மாத்திரை', 'மருத்துவமனை', 'டாக்டர்', 'மருந்தகம்', 'medicine',
    'medicines', 'pharmacy', 'doctor', 'hospital', 'tablet', 'tablets',
    'medical', 'apollo',
  ],
  utilities: [
    'மின்சாரம்', 'கரண்ட்', 'கேஸ்', 'சிலிண்டர்', 'தண்ணீர்', 'போன்', 'ரீசார்ஜ்',
    'வைபை', 'eb', 'tneb', 'electricity', 'gas', 'cylinder', 'water',
    'recharge', 'wifi', 'utility', 'utilities',
  ],
  education: [
    'பள்ளி', 'கல்வி', 'புத்தகம்', 'நோட்டு', 'டியூஷன்', 'பீஸ்', 'school',
    'college', 'book', 'books', 'tuition', 'fees', 'notebook', 'education',
  ],
  temple: [
    'கோவில்', 'பூ', 'அர்ச்சனை', 'தர்மம்', 'விளக்கு', 'temple', 'flowers',
    'pooja', 'archanai', 'charity', 'donation',
  ],
  clothing: [
    'துணி', 'ஆடை', 'தையல்', 'சேலை', 'shirt', 'dress', 'clothes',
    'clothing', 'saree', 'tailor',
  ],
  snacks: [
    'தின்பண்டம்', 'ஸ்நாக்ஸ்', 'பிஸ்கட்', 'சாக்லேட்', 'காபி', 'டீ', 'snack',
    'snacks', 'biscuit', 'chocolate', 'coffee', 'tea', 'bakery', 'sweet',
  ],
  transport: [
    'ஆட்டோ', 'பேருந்து', 'பஸ்', 'பெட்ரோல்', 'டீசல்', 'ரயில்', 'auto',
    'bus', 'petrol', 'diesel', 'train', 'cab', 'ola', 'uber', 'transport',
  ],
  other: ['மற்றவை', 'other', 'others'],
};

/**
 * Detect the best category given a text note.
 */
export function detectCategoryFromText(text: string): ExpenseCategory {
  const lower = text.toLowerCase();
  for (const [category, keywords] of Object.entries(CATEGORY_KEYWORDS) as [
    ExpenseCategory,
    string[],
  ][]) {
    for (const kw of keywords) {
      if (lower.includes(kw.toLowerCase())) {
        return category;
      }
    }
  }
  return 'groceries';
}

/**
 * Parse an offline transcript containing one or multiple expenses.
 * Handles:
 * "இன்னைக்கு காய்கறி 250 ரூபாய், ஆட்டோ 80"
 * "Milk 60, vegetables 150, auto 100"
 * "<item> <number>" and "<number> <item>"
 */
export function parseExpensesOffline(transcript: string): ParsedExpenseItem[] {
  if (!transcript || !transcript.trim()) {
    return [];
  }

  // Preserve delimiters (, ; and newlines), strip currency signs and words
  const clean = transcript
    .replace(/[₹]/g, ' ')
    .replace(/ரூபாய்|ரூ|rs\.?|rupees|inr/gi, ' ')
    .replace(/[ \t]+/g, ' ')
    .trim();

  // Split by comma, semicolon, newline, 'மற்றும்', or 'and'
  const segments = clean
    .split(/[,;\n]|\bமற்றும்\b|\band\b/i)
    .map((s) => s.trim())
    .filter(Boolean);

  const results: ParsedExpenseItem[] = [];

  for (const segment of segments) {
    // Check if segment has digits
    const digitMatch = segment.match(/\b(\d+(?:\.\d+)?)\b/);
    if (!digitMatch) continue;

    const amount = parseFloat(digitMatch[1]);
    if (isNaN(amount) || amount <= 0) continue;

    // Extract note by removing the digit and cleaning whitespace
    let note = segment.replace(digitMatch[0], '').trim();
    // Clean leading/trailing common filler words like "இன்னைக்கு", "today", etc. if appropriate,
    // or keep natural note:
    note = note.replace(/\s+/g, ' ');
    if (!note) {
      note = 'செலவு';
    }

    results.push({
      note,
      amount,
      category: detectCategoryFromText(note),
    });
  }

  return results;
}
