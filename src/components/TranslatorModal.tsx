import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
  Animated,
} from 'react-native';
import { AppSettings, DictionaryEntry, HistoryItem, LanguageCode, Tone } from '../types';
import { aiService } from '../services/aiService';
import { storageService } from '../services/storageService';
import { LanguageBar } from './LanguageBar';
import { TonePicker } from './TonePicker';
import { DictionaryCard } from './DictionaryCard';
import { ProofreadingCard } from './ProofreadingCard';
import { HistoryModal } from './HistoryModal';
import { SettingsModal } from './SettingsModal';

interface TranslatorModalProps {
  isDark: boolean;
  initialText?: string;
}

export const TranslatorModal: React.FC<TranslatorModalProps> = ({ isDark, initialText = '' }) => {
  const [sourceText, setSourceText] = useState(initialText);
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState<LanguageCode>('auto');
  const [targetLang, setTargetLang] = useState<LanguageCode>('es');
  const [detectedLang, setDetectedLang] = useState<LanguageCode | undefined>(undefined);
  const [tone, setTone] = useState<Tone>('standard');
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);

  // Special modes
  const [dictionaryEntry, setDictionaryEntry] = useState<DictionaryEntry | null>(null);
  const [isProofreading, setIsProofreading] = useState(false);
  const [proofreadingExplanation, setProofreadingExplanation] = useState<string | undefined>(undefined);

  // Settings & History state
  const [settings, setSettings] = useState<AppSettings>(storageService.getSettings());
  const [history, setHistory] = useState<HistoryItem[]>(storageService.getHistory());
  const [showSettings, setShowSettings] = useState(false);
  const [showHistory, setShowHistory] = useState(false);

  const textInputRef = useRef<any>(null);
  const debounceTimerRef = useRef<any>(null);
  const fadeAnim = useRef(new Animated.Value(1)).current;

  // Initialize target language from settings
  useEffect(() => {
    setTargetLang(settings.defaultTargetLang);
    setTone(settings.selectedTone);
  }, []);

  // Main translation function
  const executeTranslation = useCallback(
    async (textToTranslate: string, sLang = sourceLang, tLang = targetLang, selectedTone = tone) => {
      const clean = textToTranslate.trim();
      if (!clean) {
        setTranslatedText('');
        setDictionaryEntry(null);
        setIsProofreading(false);
        setIsTranslating(false);
        return;
      }

      setIsTranslating(true);
      setTranslatedText('');
      setDictionaryEntry(null);
      setIsProofreading(false);

      try {
        const result = await aiService.translateStream({
          text: clean,
          sourceLang: sLang,
          targetLang: tLang,
          tone: selectedTone,
          settings,
          onChunk: (chunk) => {
            setTranslatedText(chunk);
          },
          onDetectedLanguage: (detected) => {
            setDetectedLang(detected);
            // Business Rule (1.3): If detected is 'es', auto switch target to 'en'
            if (!settings.isTargetPinned && sLang === 'auto') {
              if (detected === 'es' && tLang !== 'en') {
                setTargetLang('en');
              } else if (detected !== 'es' && tLang !== 'es') {
                setTargetLang('es');
              }
            }
          },
        });

        setTranslatedText(result.translatedText);
        if (result.isDictionary && result.dictionaryEntry) {
          setDictionaryEntry(result.dictionaryEntry);
        }
        if (result.isProofreading) {
          setIsProofreading(true);
          setProofreadingExplanation(result.proofreadingExplanation);
        }

        // Save into history
        const saved = storageService.addHistory({
          originalText: clean,
          translatedText: result.translatedText,
          sourceLang: sLang,
          targetLang: tLang,
          detectedLang,
          tone: selectedTone,
          isDictionary: result.isDictionary,
          dictionaryEntry: result.dictionaryEntry,
        });
        setHistory(storageService.getHistory());
      } catch (err: any) {
        console.error('Translation error:', err);
        setTranslatedText(err?.message || 'Error al procesar la traducción. Verifica tu conexión o ajustes de API.');
      } finally {
        setIsTranslating(false);
      }
    },
    [sourceLang, targetLang, tone, settings, detectedLang]
  );

  // Handle source text change with debouncing for fast typing
  const handleTextChange = (text: string) => {
    setSourceText(text);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);

    debounceTimerRef.current = setTimeout(() => {
      executeTranslation(text);
    }, 250);
  };

  // Listen to Electron events (such as invocation with clipboard/selected text)
  useEffect(() => {
    if (window.electronAPI) {
      const unsubscribe = window.electronAPI.onShowWithText((data) => {
        if (data.text) {
          setSourceText(data.text);
          executeTranslation(data.text);
        }
        setTimeout(() => {
          textInputRef.current?.focus();
        }, 50);
      });
      return unsubscribe;
    }
  }, [executeTranslation]);

  // Global keydown handler for Esc, Cmd+Enter, Cmd+Alt+O inside the window
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showSettings) setShowSettings(false);
        else if (showHistory) setShowHistory(false);
        else window.electronAPI?.hideWindow();
      } else if (e.metaKey && e.key === 'Enter') {
        // Auto-replace shortcut Cmd+Enter
        handleAutoReplace();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [translatedText, showSettings, showHistory]);

  // Auto replace in background app
  const handleAutoReplace = () => {
    if (!translatedText) return;
    if (window.electronAPI) {
      window.electronAPI.autoReplaceText(translatedText);
    } else {
      navigator.clipboard?.writeText(translatedText);
    }
  };

  // Copy to clipboard
  const handleCopy = () => {
    if (!translatedText) return;
    if (window.electronAPI) {
      window.electronAPI.copyToClipboard(translatedText);
    } else {
      navigator.clipboard?.writeText(translatedText);
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
  };

  // OCR screen capture trigger
  const handleOCR = async () => {
    if (window.electronAPI) {
      const res = await window.electronAPI.triggerScreenOCR();
      if (res.success && res.text) {
        setSourceText(res.text);
        executeTranslation(res.text);
      }
    }
  };

  // Text-to-Speech
  const handleSpeak = (text: string, lang: string) => {
    if (!text) return;
    if (window.electronAPI) {
      window.electronAPI.speakText(text, lang);
    } else if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = lang;
      window.speechSynthesis.speak(utterance);
    }
  };

  // Language bar actions
  const handleSwapLanguages = () => {
    const newSource = targetLang;
    const newTarget = sourceLang === 'auto' ? (detectedLang || 'en') : sourceLang;
    setSourceLang(newSource);
    setTargetLang(newTarget);
    if (translatedText) {
      setSourceText(translatedText);
      executeTranslation(translatedText, newSource, newTarget, tone);
    }
  };

  const handleTogglePin = () => {
    const nextPinned = !settings.isTargetPinned;
    const updated = { ...settings, isTargetPinned: nextPinned };
    setSettings(updated);
    storageService.saveSettings(updated);
  };

  const handleSelectTone = (newTone: Tone) => {
    setTone(newTone);
    if (sourceText.trim()) {
      executeTranslation(sourceText, sourceLang, targetLang, newTone);
    }
  };

  return (
    <View style={[styles.windowContainer, isDark ? styles.windowDark : styles.windowLight]}>
      {/* Top Language Bar */}
      <LanguageBar
        sourceLang={sourceLang}
        targetLang={targetLang}
        detectedLang={detectedLang}
        isPinned={settings.isTargetPinned}
        isDark={isDark}
        isTranslating={isTranslating}
        providerLabel={settings.provider === 'gemini' ? (settings.geminiModel || 'gemini-3.8-flash') : settings.provider.toUpperCase()}
        onSelectSource={(lang) => {
          setSourceLang(lang);
          if (sourceText) executeTranslation(sourceText, lang, targetLang, tone);
        }}
        onSelectTarget={(lang) => {
          setTargetLang(lang);
          if (sourceText) executeTranslation(sourceText, sourceLang, lang, tone);
        }}
        onSwapLanguages={handleSwapLanguages}
        onTogglePin={handleTogglePin}
        onOpenSettings={() => setShowSettings(true)}
        onOpenHistory={() => setShowHistory(true)}
      />

      {/* Tone Picker Bar */}
      <TonePicker selectedTone={tone} onSelectTone={handleSelectTone} isDark={isDark} />

      {/* Content Area */}
      <ScrollView style={styles.scrollArea} keyboardShouldPersistTaps="handled">
        {/* Source Text Input Box */}
        <View style={[styles.inputBox, isDark ? styles.boxDark : styles.boxLight]}>
          <TextInput
            ref={textInputRef}
            style={[styles.textInput, isDark ? styles.textDark : styles.textLight]}
            value={sourceText}
            onChangeText={handleTextChange}
            placeholder="Escribe o pega texto para traducir (o captura con OCR)..."
            placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
            multiline
            autoFocus
          />

          {/* Action Row for Source Box */}
          <View style={styles.boxActionRow}>
            <View style={styles.leftActions}>
              <TouchableOpacity
                onPress={handleOCR}
                style={[styles.miniButton, isDark ? styles.miniButtonDark : styles.miniButtonLight]}
                accessibilityLabel="Captura OCR de pantalla"
              >
                <Text style={styles.miniButtonIcon}>📷 OCR</Text>
              </TouchableOpacity>

              {sourceText.trim().length > 0 && (
                <TouchableOpacity
                  onPress={() => handleSpeak(sourceText, detectedLang || sourceLang)}
                  style={[styles.miniButton, isDark ? styles.miniButtonDark : styles.miniButtonLight]}
                  accessibilityLabel="Pronunciar texto original"
                >
                  <Text style={styles.miniButtonIcon}>🔊</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.rightActions}>
              {sourceText.length > 0 && (
                <TouchableOpacity
                  onPress={() => {
                    setSourceText('');
                    setTranslatedText('');
                    setDictionaryEntry(null);
                    setIsProofreading(false);
                  }}
                  style={styles.clearIcon}
                >
                  <Text style={[styles.clearText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                    ✕ Borrar
                  </Text>
                </TouchableOpacity>
              )}
              <Text style={[styles.charCount, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                {sourceText.length} car.
              </Text>
            </View>
          </View>
        </View>

        {/* Translation Output Box */}
        <View style={[styles.outputBox, isDark ? styles.boxDark : styles.boxLight]}>
          <View style={styles.outputHeader}>
            <Text style={[styles.outputLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>
              Traducción {targetLang.toUpperCase()}
            </Text>
            {isTranslating && (
              <View style={styles.streamingIndicator}>
                <ActivityIndicator size="small" color="#3b82f6" />
                <Text style={styles.streamingText}>Streaming IA...</Text>
              </View>
            )}
          </View>

          <Text
            style={[
              styles.outputContent,
              isDark ? styles.textDark : styles.textLight,
              !translatedText && styles.outputPlaceholder,
            ]}
            selectable
          >
            {translatedText || (isTranslating ? 'Traduciendo...' : 'La traducción aparecerá aquí')}
          </Text>

          {/* Extended Dictionary Mode Card */}
          {dictionaryEntry && <DictionaryCard entry={dictionaryEntry} isDark={isDark} />}

          {/* Proofreading Mode Card */}
          {isProofreading && (
            <ProofreadingCard explanation={proofreadingExplanation} isDark={isDark} />
          )}

          {/* Action Row for Output Box */}
          {translatedText.trim().length > 0 && (
            <View style={styles.outputActionRow}>
              <View style={styles.leftActions}>
                <TouchableOpacity
                  onPress={() => handleSpeak(translatedText, targetLang)}
                  style={[styles.miniButton, isDark ? styles.miniButtonDark : styles.miniButtonLight]}
                  accessibilityLabel="Pronunciar traducción"
                >
                  <Text style={styles.miniButtonIcon}>🔊 Escuchar</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleCopy}
                  style={[
                    styles.miniButton,
                    copied && styles.copiedButton,
                    isDark ? styles.miniButtonDark : styles.miniButtonLight,
                  ]}
                  accessibilityLabel="Copiar traducción"
                >
                  <Text style={[styles.miniButtonIcon, copied && styles.copiedText]}>
                    {copied ? '✓ Copiado' : '📋 Copiar'}
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Auto-replace Button (Cmd + Enter) */}
              <TouchableOpacity
                onPress={handleAutoReplace}
                style={styles.replaceButton}
                activeOpacity={0.8}
                accessibilityLabel="Reemplazar texto en la app de fondo"
              >
                <Text style={styles.replaceButtonIcon}>↵</Text>
                <Text style={styles.replaceButtonText}>Reemplazar (Cmd+Enter)</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Footer with keyboard shortcuts hints */}
      <View style={[styles.footer, isDark ? styles.borderDark : styles.borderLight]}>
        <View style={styles.shortcutHints}>
          <Text style={[styles.hintItem, isDark ? styles.textMutedDark : styles.textMutedLight]}>
            <Text style={styles.kbd}>Esc</Text> Ocultar
          </Text>
          <Text style={[styles.hintItem, isDark ? styles.textMutedDark : styles.textMutedLight]}>
            <Text style={styles.kbd}>Cmd+Enter</Text> Reemplazar
          </Text>
          <Text style={[styles.hintItem, isDark ? styles.textMutedDark : styles.textMutedLight]}>
            <Text style={styles.kbd}>Cmd+Cmd</Text> Invocar
          </Text>
          <Text style={[styles.hintItem, isDark ? styles.textMutedDark : styles.textMutedLight]}>
            <Text style={styles.kbd}>Cmd+Alt+O</Text> OCR
          </Text>
        </View>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setShowSettings(true)}
          style={styles.engineBadgeContainer}
          accessibilityLabel="Ajustes de IA"
        >
          <View style={[styles.engineDot, isTranslating ? styles.engineDotBusy : styles.engineDotReady]} />
          <Text style={[styles.engineBadge, isDark ? styles.textMutedDark : styles.textMutedLight]}>
            {isTranslating
              ? '⚡ IA Procesando...'
              : `🟢 IA Activa • ${settings.provider === 'gemini' ? (settings.geminiModel || 'gemini-3.8-flash') : settings.provider === 'openai' ? (settings.openaiModel || 'gpt-4o-mini') : 'Universal'}`}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Settings Modal */}
      <SettingsModal
        visible={showSettings}
        settings={settings}
        isDark={isDark}
        onClose={() => setShowSettings(false)}
        onSaveSettings={(newSettings) => {
          setSettings(newSettings);
          storageService.saveSettings(newSettings);
          setTargetLang(newSettings.defaultTargetLang);
        }}
      />

      {/* History Modal */}
      <HistoryModal
        visible={showHistory}
        history={history}
        isDark={isDark}
        onClose={() => setShowHistory(false)}
        onSelectHistoryItem={(item) => {
          setSourceText(item.originalText);
          setTranslatedText(item.translatedText);
          setSourceLang(item.sourceLang as LanguageCode);
          setTargetLang(item.targetLang as LanguageCode);
          setTone(item.tone);
          if (item.dictionaryEntry) setDictionaryEntry(item.dictionaryEntry);
        }}
        onToggleFavorite={(id) => {
          const updated = storageService.toggleFavorite(id);
          setHistory(updated);
        }}
        onClearHistory={() => {
          storageService.clearHistory();
          setHistory(storageService.getHistory());
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  windowContainer: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 16 },
    shadowOpacity: 0.45,
    shadowRadius: 30,
    elevation: 20,
  },
  windowDark: {
    backgroundColor: 'rgba(15, 23, 42, 0.94)',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  windowLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.94)',
    borderColor: 'rgba(0, 0, 0, 0.12)',
  },
  scrollArea: {
    flex: 1,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  inputBox: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
  },
  outputBox: {
    borderRadius: 10,
    padding: 10,
    marginBottom: 8,
    borderWidth: 1,
  },
  boxDark: {
    backgroundColor: 'rgba(30, 41, 59, 0.5)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  boxLight: {
    backgroundColor: 'rgba(248, 250, 252, 0.8)',
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  textInput: {
    minHeight: 56,
    maxHeight: 120,
    fontSize: 14,
    lineHeight: 20,
    padding: 0,
    textAlignVertical: 'top',
    outlineStyle: 'none' as any,
  },
  boxActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
    paddingTop: 6,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.1)',
  },
  leftActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  miniButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  miniButtonDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  miniButtonLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  miniButtonIcon: {
    fontSize: 11,
    fontWeight: '500',
  },
  copiedButton: {
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
  },
  copiedText: {
    color: '#10b981',
    fontWeight: '700',
  },
  clearIcon: {
    padding: 2,
  },
  clearText: {
    fontSize: 11,
  },
  charCount: {
    fontSize: 10,
  },
  outputHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  outputLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  streamingIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  streamingText: {
    fontSize: 11,
    color: '#3b82f6',
    fontWeight: '500',
  },
  outputContent: {
    fontSize: 14,
    lineHeight: 20,
    minHeight: 48,
  },
  outputPlaceholder: {
    opacity: 0.4,
    fontStyle: 'italic',
  },
  outputActionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150, 150, 150, 0.1)',
  },
  replaceButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 6,
    gap: 4,
  },
  replaceButtonIcon: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  replaceButtonText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderTopWidth: 1,
  },
  shortcutHints: {
    flexDirection: 'row',
    gap: 12,
  },
  hintItem: {
    fontSize: 10,
  },
  kbd: {
    fontSize: 9,
    fontFamily: 'monospace',
    backgroundColor: 'rgba(150, 150, 150, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
  },
  engineBadgeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  engineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  engineDotReady: {
    backgroundColor: '#10b981',
  },
  engineDotBusy: {
    backgroundColor: '#f59e0b',
  },
  engineBadge: {
    fontSize: 10,
    fontWeight: '600',
  },
  borderDark: {
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  borderLight: {
    borderTopColor: 'rgba(0, 0, 0, 0.08)',
  },
  textDark: {
    color: '#f8fafc',
  },
  textLight: {
    color: '#0f172a',
  },
  textMutedDark: {
    color: '#94a3b8',
  },
  textMutedLight: {
    color: '#64748b',
  },
});
