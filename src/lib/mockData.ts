import { ExpenseItem, SavingGoal, ScamResult } from '../types';

export const INITIAL_EXPENSES: ExpenseItem[] = [
  {
    id: 'exp-1',
    amount: 320,
    category: 'vegetables',
    note: 'உழவர் சந்தை தக்காளி & வெங்காயம் (Uzhavar Santhai Veggies)',
    date: '2026-10-31',
    time: '08:30 AM',
    isVoice: true,
  },
  {
    id: 'exp-2',
    amount: 68,
    category: 'dairy',
    note: 'ஆவின் பசும்பால் 1 லிட்டர் (Aavin Milk)',
    date: '2026-10-31',
    time: '06:15 AM',
  },
  {
    id: 'exp-3',
    amount: 1450,
    category: 'groceries',
    note: 'சரவணா ஸ்டோர்ஸ் அரிசி & பருப்பு (Saravana Stores Groceries)',
    date: '2026-10-30',
    time: '05:45 PM',
    receiptImg: 'mock-bill.jpg',
  },
  {
    id: 'exp-4',
    amount: 420,
    category: 'medical',
    note: 'அப்பாவின் ரத்த அழுத்த மாத்திரைகள் (Apollo Pharmacy)',
    date: '2026-10-29',
    time: '11:20 AM',
    isVoice: true,
  },
  {
    id: 'exp-5',
    amount: 1250,
    category: 'utilities',
    note: 'TNEB வீட்டு மின்சாரக் கட்டணம் (TNEB EB Bill)',
    date: '2026-10-28',
    time: '02:00 PM',
  },
  {
    id: 'exp-6',
    amount: 150,
    category: 'temple',
    note: 'வெள்ளிக்கிழமை கோவில் அர்ச்சனை & பூ (Temple Flowers)',
    date: '2026-10-27',
    time: '09:00 AM',
  },
  {
    id: 'exp-7',
    amount: 650,
    category: 'education',
    note: 'ஆகாஷ் பள்ளி நோட்டுப் புத்தகங்கள் (School Notebooks)',
    date: '2026-10-25',
    time: '04:10 PM',
  },
];

export const INITIAL_SAVING_GOALS: SavingGoal[] = [
  {
    id: 'goal-1',
    titleKey: 'quest.goal1Title',
    descKey: 'quest.goal1Desc',
    targetAmount: 800,
    savedAmount: 620,
    rewardKey: 'quest.reward1',
    kidName: 'Akash (வயது 9)',
    emoji: '🎒',
  },
  {
    id: 'goal-2',
    titleKey: 'quest.goal2Title',
    descKey: 'quest.goal2Desc',
    targetAmount: 3500,
    savedAmount: 2400,
    rewardKey: 'quest.reward2',
    kidName: 'Anushka (வயது 12)',
    emoji: '🚲',
  },
  {
    id: 'goal-3',
    titleKey: 'quest.goal3Title',
    descKey: 'quest.goal3Desc',
    targetAmount: 2000,
    savedAmount: 1850,
    rewardKey: 'quest.reward3',
    kidName: 'குடும்ப கூட்டுச் சேமிப்பு',
    emoji: '✨',
  },
];

export const BUDGET_SUMMARY = {
  totalBudget: 35000,
  spent: 21450,
  remaining: 13550,
  percentage: 61,
};

export const MOCK_SCAM_DATABASE: Record<string, ScamResult> = {
  eb_bill: {
    status: 'scam',
    score: 98,
    titleKey: 'scamShield.resultScam',
    explanationKey: 'scamShield.scamExplanation',
    warningPoints: [
      'TNEB ஒருபோதும் வாட்ஸ்அப் அல்லது SMS மூலம் இணைப்பு துண்டிக்கப்படும் என்று மிரட்டாது.',
      'அதிகாரப்பூர்வ TNEB வலைத்தளம் (tnebltd.gov.in) மட்டுமே பயன்படுத்தவும்.',
      'வழங்கப்பட்ட லிங்கில் APK அல்லது வங்கி தகவல்களைப் பகிர வேண்டாம்.',
    ],
  },
  google_pay: {
    status: 'scam',
    score: 95,
    titleKey: 'scamShield.resultScam',
    explanationKey: 'scamShield.scamExplanation',
    warningPoints: [
      'பணம் பெற UPI PIN போடவோ QR கோடு ஸ்கேன் செய்யவோ தேவையில்லை.',
      'அறிமுகமில்லாத நபரிடமிருந்து வரும் பரிசு/லாட்டரி லிங்குகளைத் திறக்காதீர்கள்.',
    ],
  },
  gas_subsidy: {
    status: 'suspicious',
    score: 75,
    titleKey: 'scamShield.resultSuspicious',
    explanationKey: 'scamShield.suspiciousExplanation',
    warningPoints: [
      'கேஸ் சிலிண்டர் மானியம் நேரடியாக உங்கள் வங்கிக் கணக்கிற்கு தானாக வரும்.',
      'மானியம் பெற OTP யாரிடமும் கூறக் கூடாது.',
    ],
  },
  safe_message: {
    status: 'safe',
    score: 10,
    titleKey: 'scamShield.resultSafe',
    explanationKey: 'scamShield.safeExplanation',
    warningPoints: [
      'இது பொதுவான பரிவர்த்தனை ரசீது அல்லது வாழ்த்துச் செய்தி போல் தெரிகிறது.',
      'எப்போதும் எச்சரிக்கையுடன் இருங்கள், ரகசிய PIN எண்ணை யாருக்கும் கூறாதீர்கள்.',
    ],
  },
};

