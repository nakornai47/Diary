export const APP_NAME = 'Diary';

export const PIN_LENGTH = 6;
export const PIN_HASH_SALT = 'diary-app-static-salt-2026';

export const DEFAULT_CATEGORIES = [
  { name: 'ส่วนตัว', color: '#0A84FF', icon: 'account' },
  { name: 'งาน', color: '#FF9500', icon: 'briefcase' },
  { name: 'สุขภาพ', color: '#34C759', icon: 'heart' },
  { name: 'การเงิน', color: '#AF52DE', icon: 'cash' },
  { name: 'การศึกษา', color: '#5856D6', icon: 'school' },
];

export const DEFAULT_PRIORITIES = [
  { name: 'สูง', color: '#FF3B30', level: 3 },
  { name: 'ปานกลาง', color: '#FF9500', level: 2 },
  { name: 'ต่ำ', color: '#34C759', level: 1 },
];

export const CURRENCY_OPTIONS = [
  { label: 'บาท (฿)', value: 'THB', symbol: '฿' },
  { label: 'USD ($)', value: 'USD', symbol: '$' },
  { label: 'EUR (€)', value: 'EUR', symbol: '€' },
  { label: 'JPY (¥)', value: 'JPY', symbol: '¥' },
];
