
import { Language } from '../types';

type Dictionary = Record<string, Record<Language, string>>;

const dictionary: Dictionary = {
  'dashboard': { en: 'Dashboard', he: 'לוח בקרה' },
  'portfolio': { en: 'Portfolio', he: 'תיק נכסים' },
  'tax_report': { en: 'Tax Report', he: 'דוח מס' },
  'chat': { en: 'AI Analyst', he: 'אנליסט AI' },
  'total_equity': { en: 'Total Equity (My Share)', he: 'שווי הוגן (החלק שלי)' },
  'monthly_cash_flow': { en: 'Monthly Cash Flow', he: 'תזרים מזומנים חודשי' },
  'properties': { en: 'Properties', he: 'נכסים' },
  'financial_overview': { en: 'Financial Overview', he: 'סקירה פיננסית' },
  'recent_activity': { en: 'Recent Activity', he: 'פעילות אחרונה' },
  'view_all': { en: 'View All', he: 'הצג הכל' },
  'lease_alert': { en: 'Lease Ending Soon', he: 'חוזה מסתיים בקרוב' },
  'days': { en: 'days', he: 'ימים' },
  'filter_all': { en: 'All Types', he: 'כל הסוגים' },
  'add_property': { en: 'Add Property', he: 'הוסף נכס' },
  'my_share': { en: 'My Share', he: 'החלק שלי' },
  'total_value': { en: 'Total Value', he: 'שווי כולל' },
  'roi': { en: 'ROI', he: 'תשואה' },
  'overview': { en: 'Overview', he: 'סקירה' },
  'financials': { en: 'Financials', he: 'פיננסים' },
  'partners': { en: 'Partners', he: 'שותפים' },
  'docs': { en: 'Docs', he: 'מסמכים' },
  'transactions': { en: 'History', he: 'היסטוריה' },
  'address': { en: 'Address', he: 'כתובת' },
  'tenant': { en: 'Tenant', he: 'דייר' },
  'lease_expires': { en: 'Lease Expires', he: 'תוקף חוזה' },
  'monthly_rent': { en: 'Monthly Rent', he: 'שכירות חודשית' },
  'mortgage_mix': { en: 'Mortgage Mix', he: 'תמהיל משכנתא' },
  'fixed': { en: 'Fixed', he: 'קבועה' },
  'variable': { en: 'Variable', he: 'משתנה' },
  'prime': { en: 'Prime', he: 'פריים' },
  'export_excel': { en: 'Export to Excel', he: 'ייצוא לאקסל' },
  'tax_liability': { en: 'Global Tax Liability', he: 'חבות מס גלובלית' },
  'estimated': { en: 'Estimated', he: 'משוער' },
  'income_by_country': { en: 'Income by Country', he: 'הכנסה לפי מדינה' },
};

export const t = (key: string, lang: Language): string => {
  if (!dictionary[key]) return key;
  return dictionary[key][lang];
};

export const getDir = (lang: Language): 'ltr' | 'rtl' => {
  return lang === 'he' ? 'rtl' : 'ltr';
};
