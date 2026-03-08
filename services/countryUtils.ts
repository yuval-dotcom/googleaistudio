const COUNTRY_ALIASES: Record<string, string> = {
  israel: 'Israel',
  ישראל: 'Israel',
  usa: 'USA',
  'u.s.a': 'USA',
  'u.s.a.': 'USA',
  us: 'USA',
  'u.s': 'USA',
  'u.s.': 'USA',
  'united states': 'USA',
  'united states of america': 'USA',
  'ארצות הברית': 'USA',
  ארהב: 'USA',
  germany: 'Germany',
  deutschland: 'Germany',
  גרמניה: 'Germany',
  uk: 'UK',
  'u.k': 'UK',
  'u.k.': 'UK',
  britain: 'UK',
  'great britain': 'UK',
  'united kingdom': 'UK',
  בריטניה: 'UK',
};

export function normalizeCountry(country: string): string {
  const raw = String(country || '').trim();
  if (!raw) return '';
  const lookup = COUNTRY_ALIASES[raw.toLowerCase()];
  return lookup || raw;
}
