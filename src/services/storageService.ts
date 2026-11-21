import { AppSettings, HistoryItem } from '../types';

const SETTINGS_KEY = 'astro_translator_settings';
const HISTORY_KEY = 'astro_translator_history';

export const defaultSettings: AppSettings = {
  provider: 'local',
  geminiApiKey: '',
  geminiModel: 'gemini-3.8-flash',
  openaiApiKey: '',
  openaiModel: 'gpt-4o-mini',
  anthropicApiKey: '',
  defaultTargetLang: 'es',
  isTargetPinned: false,
  selectedTone: 'standard',
  autoSpeak: false,
  sourceVoice: 'auto',
  targetVoice: 'auto',
  isWindowPinned: false,
  hasCompletedOnboarding: false,
};

export const storageService = {
  getSettings(): AppSettings {
    try {
      const data = localStorage.getItem(SETTINGS_KEY);
      if (data) {
        return { ...defaultSettings, ...JSON.parse(data) };
      }
    } catch (e) {
      console.error('Error reading settings from localStorage', e);
    }
    return defaultSettings;
  },

  saveSettings(settings: AppSettings): void {
    try {
      localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
    } catch (e) {
      console.error('Error saving settings to localStorage', e);
    }
  },

  getHistory(): HistoryItem[] {
    try {
      const data = localStorage.getItem(HISTORY_KEY);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('Error reading history', e);
    }
    return [];
  },

  addHistory(item: Omit<HistoryItem, 'id' | 'timestamp' | 'isFavorite'>): HistoryItem {
    const history = this.getHistory();
    const newItem: HistoryItem = {
      ...item,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
      timestamp: Date.now(),
      isFavorite: false,
    };

    // Filter duplicates of same originalText within last 10 entries
    const filtered = history.filter((h) => h.originalText !== item.originalText || h.isFavorite);
    const updated = [newItem, ...filtered].slice(0, 50); // Keep max 50 items
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving history', e);
    }
    return newItem;
  },

  toggleFavorite(id: string): HistoryItem[] {
    const history = this.getHistory();
    const updated = history.map((item) => {
      if (item.id === id) {
        return { ...item, isFavorite: !item.isFavorite };
      }
      return item;
    });
    try {
      localStorage.setItem(HISTORY_KEY, JSON.stringify(updated));
    } catch (e) {
      console.error('Error saving favorites', e);
    }
    return updated;
  },

  clearHistory(): void {
    try {
      // Keep only favorites
      const history = this.getHistory().filter((h) => h.isFavorite);
      localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
    } catch (e) {
      console.error('Error clearing history', e);
    }
  },
};
