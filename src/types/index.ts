export type LanguageCode = 'auto' | 'es' | 'en' | 'fr' | 'de' | 'it' | 'pt' | 'zh' | 'ja' | 'ru';

export interface Language {
  code: LanguageCode;
  name: string;
  nativeName: string;
  flag: string;
}

export type Tone = 'standard' | 'formal' | 'informal' | 'technical' | 'concise';

export interface DictionaryEntry {
  word: string;
  partOfSpeech: string;
  phonetic?: string;
  definition: string;
  examples: string[];
}

export interface ProofreadingCorrection {
  original: string;
  corrected: string;
  reason: string;
}

export interface TranslationResponse {
  translatedText: string;
  detectedLanguage?: string;
  isDictionary?: boolean;
  dictionaryEntry?: DictionaryEntry;
  isProofreading?: boolean;
  proofreadingExplanation?: string;
}

export interface HistoryItem {
  id: string;
  timestamp: number;
  originalText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  detectedLang?: string;
  tone: Tone;
  isFavorite: boolean;
  isDictionary?: boolean;
  dictionaryEntry?: DictionaryEntry;
}

export type AIProvider = 'local' | 'gemini' | 'openai' | 'anthropic';

export interface AppSettings {
  provider: AIProvider;
  geminiApiKey: string;
  geminiModel: string;
  openaiApiKey: string;
  openaiModel: string;
  anthropicApiKey: string;
  defaultTargetLang: LanguageCode;
  isTargetPinned: boolean;
  selectedTone: Tone;
  autoSpeak: boolean;
  sourceVoice?: string;
  targetVoice?: string;
  isWindowPinned?: boolean;
}

export interface VoiceOption {
  name: string;
  lang: string;
  example?: string;
}

declare global {
  interface Window {
    electronAPI?: {
      hideWindow: () => void;
      setWindowPinned: (pinned: boolean) => void;
      autoReplaceText: (text: string) => void;
      getClipboardText: () => Promise<string>;
      copyToClipboard: (text: string) => void;
      triggerScreenOCR: () => Promise<{ success: boolean; text?: string; error?: string }>;
      speakText: (text: string, lang: string, voice?: string) => void;
      stopSpeaking: () => void;
      getVoices: () => Promise<VoiceOption[]>;
      checkAccessibility: () => Promise<boolean>;
      openAccessibilityPreferences: () => void;
      onShowWithText: (callback: (data: { text: string; isDarkMode: boolean }) => void) => () => void;
      onThemeChanged: (callback: (theme: 'dark' | 'light') => void) => () => void;
    };
  }
}
