
import { Language } from '../types';

type Dictionary = Record<string, Record<Language, string>>;

const dictionary: Dictionary = {
  // Navigation
  'dashboard': { en: 'Dashboard', he: 'לוח בקרה' },
  'portfolio': { en: 'Portfolio', he: 'תיק נכסים' },
  'tax_report': { en: 'Tax Report', he: 'דוח מס' },
  'chat': { en: 'AI Analyst', he: 'אנליסט AI' },
  'settings': { en: 'Settings', he: 'הגדרות' },

  // Stats
  'total_equity': { en: 'Total Equity (My Share)', he: 'הון עצמי (החלק שלי)' },
  'monthly_cash_flow': { en: 'Monthly Cash Flow', he: 'תזרים מזומנים חודשי' },
  'properties': { en: 'Properties', he: 'נכסים' },
  'financial_overview': { en: 'Financial Overview', he: 'סקירה פיננסית' },
  'recent_activity': { en: 'Recent Activity', he: 'פעילות אחרונה' },
  'performance': { en: 'Performance', he: 'ביצועים' },
  'portfolio_score': { en: 'Portfolio Score', he: 'ציון תיק נכסים' },
  'regions': { en: 'Regions', he: 'אזורים גיאוגרפיים' },

  // AI & Insights
  'ai_analyst': { en: 'AI Analyst', he: 'אנליסט בינה מלאכותית' },
  'analyze_with_ai': { en: 'Analyze Portfolio with AI', he: 'נתח את התיק עם AI' },
  'analyzing': { en: 'Analyzing performance...', he: 'מנתח נתונים...' },
  'ai_warning': { en: 'InvestorPro AI may occasionally provide inaccurate estimates.', he: 'אנליסט ה-AI עשוי לספק הערכות לא מדויקות לעיתים.' },

  // Property Actions
  'view_all': { en: 'View All', he: 'הצג הכל' },
  'add_property': { en: 'Add Property', he: 'הוסף נכס' },
  'edit_property': { en: 'Edit Property', he: 'ערוך נכס' },
  'delete_property': { en: 'Delete Property', he: 'מחק נכס' },
  'filter_all': { en: 'All Types', he: 'כל הסוגים' },
  'active_assets': { en: 'Active Assets', he: 'נכסים פעילים' },

  // Property Fields
  'address': { en: 'Address', he: 'כתובת' },
  'country': { en: 'Country', he: 'מדינה' },
  'type': { en: 'Type', he: 'סוג נכס' },
  'my_share': { en: 'My Share', he: 'החלק שלי' },
  'total_value': { en: 'Total Value', he: 'שווי שוק כולל' },
  'roi': { en: 'ROI', he: 'תשואה' },
  'estimated_cap_rate': { en: 'Estimated ROI (Cap Rate)', he: 'תשואה משוערת (Cap Rate)' },
  'holding_company': { en: 'Holding Company', he: 'חברת אחזקות / חברה בעלים' },
  'ownership_pct': { en: 'Ownership %', he: 'אחוז בעלות' },
  
  // Property Tabs
  'overview': { en: 'Overview', he: 'סקירה' },
  'financials': { en: 'Financials', he: 'פיננסים' },
  'partners': { en: 'Partners', he: 'שותפים' },
  'docs': { en: 'Docs', he: 'מסמכים' },
  'transactions': { en: 'History', he: 'היסטוריה' },

  // Lease & Units
  'lease_info': { en: 'Lease Info', he: 'פרטי חוזה' },
  'units_tenants': { en: 'Sub-Units & Tenants', he: 'יחידות משנה ושוכרים' },
  'tenant': { en: 'Tenant', he: 'שם השוכר' },
  'lease_expires': { en: 'Lease Expires', he: 'סיום חוזה' },
  'monthly_rent': { en: 'Monthly Rent', he: 'דמי שכירות' },
  'total_rent': { en: 'Total Rent', he: 'סה"כ שכירות' },
  'vacant': { en: 'Vacant', he: 'פנוי' },

  // Financial details
  'monthly_mortgage': { en: 'Monthly Mortgage', he: 'משכנתא חודשית' },
  'loan_balance': { en: 'Loan Balance', he: 'יתרת הלוואה' },
  'bank_name': { en: 'Bank Name', he: 'שם הבנק' },
  'mortgage_mix': { en: 'Mortgage Mix', he: 'תמהיל משכנתא' },
  'fixed': { en: 'Fixed', he: 'קבועה' },
  'variable': { en: 'Variable', he: 'משתנה' },
  'prime': { en: 'Prime', he: 'פריים' },

  // Tax Report
  'tax_liability': { en: 'Global Tax Liability', he: 'חבות מס גלובלית' },
  'estimated': { en: 'Estimated', he: 'משוער' },
  'income_by_country': { en: 'Income by Country', he: 'הכנסה לפי מדינה' },
  'export_excel': { en: 'Export to Excel', he: 'ייצוא לאקסל' },

  // Common
  'save': { en: 'Save', he: 'שמור' },
  'cancel': { en: 'Cancel', he: 'ביטול' },
  'upload': { en: 'Upload', he: 'העלאה' },
  'delete': { en: 'Delete', he: 'מחיקה' },
  'loading': { en: 'Loading...', he: 'טוען...' },
  'logout': { en: 'Log Out', he: 'התנתק' },
  'reset_defaults': { en: 'Reset to Defaults', he: 'אפס להגדרות יצרן' },
  'exchange_rates': { en: 'Exchange Rates', he: 'שערי חליפין' },
  'base_nis': { en: 'Base: NIS', he: 'בסיס: שקל' },
};

export const t = (key: string, lang: Language): string => {
  if (!dictionary[key]) return key;
  return dictionary[key][lang];
};

export const getDir = (lang: Language): 'ltr' | 'rtl' => {
  return lang === 'he' ? 'rtl' : 'ltr';
};
