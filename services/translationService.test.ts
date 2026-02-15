import { describe, it, expect } from 'vitest';
import { t, getDir } from './translationService';
import type { Language } from '../types';

describe('translationService', () => {
  describe('t', () => {
    it('returns English translation for known key when lang is en', () => {
      expect(t('dashboard', 'en')).toBe('Dashboard');
      expect(t('portfolio', 'en')).toBe('Portfolio');
      expect(t('save', 'en')).toBe('Save');
    });

    it('returns Hebrew translation for known key when lang is he', () => {
      expect(t('dashboard', 'he')).toBe('לוח בקרה');
      expect(t('portfolio', 'he')).toBe('תיק נכסים');
      expect(t('save', 'he')).toBe('שמור');
    });

    it('returns key when key is not in dictionary', () => {
      expect(t('unknown_key', 'en')).toBe('unknown_key');
      expect(t('unknown_key', 'he')).toBe('unknown_key');
    });
  });

  describe('getDir', () => {
    it('returns ltr for English', () => {
      expect(getDir('en')).toBe('ltr');
    });

    it('returns rtl for Hebrew', () => {
      expect(getDir('he')).toBe('rtl');
    });
  });
});
