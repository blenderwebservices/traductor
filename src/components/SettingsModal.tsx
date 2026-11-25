import React, { useState, useEffect } from 'react';
import { View, Text, TouchableOpacity, Pressable, TextInput, StyleSheet, Modal, ScrollView, ActivityIndicator, Linking } from 'react-native';
import { AIProvider, AppSettings, LanguageCode, VoiceOption } from '../types';
import { LANGUAGES, aiService } from '../services/aiService';

interface SettingsModalProps {
  visible: boolean;
  settings: AppSettings;
  isDark: boolean;
  onClose: () => void;
  onSaveSettings: (settings: AppSettings) => void;
}

const fallbackVoices: VoiceOption[] = [
  { name: 'Paulina', lang: 'es_MX', example: '¡Hola! Me llamo Paulina.' },
  { name: 'Mónica', lang: 'es_ES', example: '¡Hola! Me llamo Mónica.' },
  { name: 'Eddy (Español (México))', lang: 'es_MX', example: '¡Hola! Me llamo Eddy.' },
  { name: 'Samantha', lang: 'en_US', example: 'Hello! My name is Samantha.' },
  { name: 'Daniel', lang: 'en_GB', example: 'Hello! My name is Daniel.' },
  { name: 'Thomas', lang: 'fr_FR', example: 'Bonjour, je m’appelle Thomas.' },
  { name: 'Anna', lang: 'de_DE', example: 'Hallo, ich heiße Anna.' },
  { name: 'Alice', lang: 'it_IT', example: 'Ciao, mi chiamo Alice.' },
  { name: 'Luciana', lang: 'pt_BR', example: 'Olá, meu nome é Luciana.' },
];

export const SettingsModal: React.FC<SettingsModalProps> = ({
  visible,
  settings,
  isDark,
  onClose,
  onSaveSettings,
}) => {
  const [current, setCurrent] = useState<AppSettings>(settings);
  const [hasAccessibility, setHasAccessibility] = useState<boolean>(true);
  const [testStatus, setTestStatus] = useState<{ loading: boolean; success?: boolean; message?: string } | null>(null);
  const [voices, setVoices] = useState<VoiceOption[]>(fallbackVoices);
  const [voicePickerTarget, setVoicePickerTarget] = useState<'source' | 'target' | null>(null);
  const [voiceSearch, setVoiceSearch] = useState('');

  useEffect(() => {
    setCurrent(settings);
    setTestStatus(null);
    // Check macOS accessibility
    if (window.electronAPI) {
      window.electronAPI.checkAccessibility().then((trusted) => {
        setHasAccessibility(trusted);
      });
      window.electronAPI.getVoices().then((sysVoices) => {
        if (sysVoices && sysVoices.length > 0) {
          setVoices(sysVoices);
        }
      }).catch(() => {});
    }
  }, [settings, visible]);

  const handleTestConnection = async () => {
    setTestStatus({ loading: true });
    const result = await aiService.testConnection(current);
    setTestStatus({ loading: false, success: result.success, message: result.message });
  };

  const handleTestVoice = (voiceName?: string, isTarget = false) => {
    const chosen = voiceName && voiceName !== 'auto' ? voiceName : undefined;
    const lang = isTarget ? current.defaultTargetLang : 'es';
    const sample = isTarget ? 'Texto de prueba de traducción en Astro' : 'Texto de prueba de origen en Astro';
    if (window.electronAPI) {
      window.electronAPI.speakText(sample, lang, chosen);
    } else if ('speechSynthesis' in window) {
      const u = new SpeechSynthesisUtterance(sample);
      u.lang = lang;
      window.speechSynthesis.speak(u);
    }
  };

  const handleSave = () => {
    onSaveSettings(current);
    onClose();
  };

  const providers: { id: AIProvider; label: string; desc: string }[] = [
    { id: 'local', label: 'Motor Neuronal Universal', desc: 'Rápido, universal y sin necesidad de API Key' },
    { id: 'gemini', label: 'Google Gemini API', desc: 'Traducción de alta fidelidad con streaming y selección de modelo' },
    { id: 'openai', label: 'OpenAI API', desc: 'Modelos GPT-4o, GPT-4o-mini y compatibles' },
  ];

  const geminiModelPresets = [
    'gemini-3.8-flash',
    'gemini-2.0-flash',
    'gemini-1.5-flash',
    'gemini-1.5-pro',
  ];

  const openaiModelPresets = [
    'gpt-4o-mini',
    'gpt-4o',
    'o3-mini',
  ];

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <View
          style={[styles.modalBox, isDark ? styles.modalDark : styles.modalLight]}
          onStartShouldSetResponder={() => true}
        >
          {/* Header */}
          <View style={[styles.header, isDark ? styles.borderDark : styles.borderLight]}>
            <View style={styles.titleRow}>
              <Text style={styles.headerIcon}>⚙️</Text>
              <Text style={[styles.headerTitle, isDark ? styles.textDark : styles.textLight]}>
                Configuración de Astro
              </Text>
            </View>
            <TouchableOpacity onPress={onClose}>
              <Text style={styles.closeIcon}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content}>
            {/* Accessibility Check Notice */}
            <View style={[styles.section, styles.accessCard]}>
              <View style={styles.accessHeader}>
                <Text style={styles.accessIcon}>{hasAccessibility ? '✅' : '⚠️'}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.accessTitle, isDark ? styles.textDark : styles.textLight]}>
                    Permisos de Accesibilidad macOS
                  </Text>
                  <Text style={[styles.accessDesc, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                    {hasAccessibility
                      ? 'Permisos activos: Cmd+Cmd, lectura de selección y Auto-Replace funcionan al 100%.'
                      : 'Requerido para la doble pulsación rápida Cmd+Cmd y reemplazo en línea.'}
                  </Text>
                </View>
              </View>
              {!hasAccessibility && (
                <TouchableOpacity
                  onPress={() => window.electronAPI?.openAccessibilityPreferences()}
                  style={styles.permissionBtn}
                >
                  <Text style={styles.permissionBtnText}>Habilitar en Ajustes del Sistema</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Provider Section */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                Proveedor de IA
              </Text>
              <View style={styles.providerGrid}>
                {providers.map((p) => {
                  const isSelected = current.provider === p.id;
                  return (
                    <TouchableOpacity
                      key={p.id}
                      activeOpacity={0.7}
                      onPress={() => setCurrent({ ...current, provider: p.id })}
                      style={[
                        styles.providerOption,
                        isSelected
                          ? styles.providerSelected
                          : isDark
                          ? styles.providerDark
                          : styles.providerLight,
                      ]}
                    >
                      <View style={styles.providerHeader}>
                        <Text
                          style={[
                            styles.providerName,
                            isSelected
                              ? styles.providerNameActive
                              : isDark
                              ? styles.textDark
                              : styles.textLight,
                          ]}
                        >
                          {p.label}
                        </Text>
                        {isSelected && <Text style={styles.providerCheck}>✓</Text>}
                      </View>
                      <Text style={[styles.providerDesc, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                        {p.desc}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Gemini Configuration */}
            {current.provider === 'gemini' && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                  Modelo de Gemini
                </Text>
                <View style={styles.modelPillsRow}>
                  {geminiModelPresets.map((m) => {
                    const isSelected = current.geminiModel === m;
                    return (
                      <TouchableOpacity
                        key={m}
                        onPress={() => setCurrent({ ...current, geminiModel: m })}
                        style={[
                          styles.modelPill,
                          isSelected ? styles.modelPillSelected : isDark ? styles.modelPillDark : styles.modelPillLight,
                        ]}
                      >
                        <Text
                          style={[
                            styles.modelPillText,
                            isSelected ? styles.modelPillTextSelected : isDark ? styles.textDark : styles.textLight,
                          ]}
                        >
                          {m}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TextInput
                  value={current.geminiModel || 'gemini-3.8-flash'}
                  onChangeText={(val) => setCurrent({ ...current, geminiModel: val })}
                  placeholder="ej. gemini-3.8-flash, gemini-2.0-flash..."
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  style={[styles.input, { marginBottom: 10 }, isDark ? styles.inputDark : styles.inputLight]}
                />

                <Text style={[styles.sectionLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                  Google Gemini API Key
                </Text>
                <TextInput
                  value={current.geminiApiKey}
                  onChangeText={(val) => setCurrent({ ...current, geminiApiKey: val })}
                  placeholder="AIzaSy..."
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  secureTextEntry
                  style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                  <Text style={{ fontSize: 10, color: isDark ? '#94a3b8' : '#64748b' }}>
                    🔒 Se guarda localmente en tu Mac.
                  </Text>
                  <TouchableOpacity onPress={() => Linking.openURL('https://aistudio.google.com/apikey')}>
                    <Text style={{ fontSize: 11, color: '#3b82f6', fontWeight: '600' }}>
                      Obtener API Key gratis en Google AI Studio ↗
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* OpenAI Configuration */}
            {current.provider === 'openai' && (
              <View style={styles.section}>
                <Text style={[styles.sectionLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                  Modelo de OpenAI
                </Text>
                <View style={styles.modelPillsRow}>
                  {openaiModelPresets.map((m) => {
                    const isSelected = current.openaiModel === m;
                    return (
                      <TouchableOpacity
                        key={m}
                        onPress={() => setCurrent({ ...current, openaiModel: m })}
                        style={[
                          styles.modelPill,
                          isSelected ? styles.modelPillSelected : isDark ? styles.modelPillDark : styles.modelPillLight,
                        ]}
                      >
                        <Text
                          style={[
                            styles.modelPillText,
                            isSelected ? styles.modelPillTextSelected : isDark ? styles.textDark : styles.textLight,
                          ]}
                        >
                          {m}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
                <TextInput
                  value={current.openaiModel || 'gpt-4o-mini'}
                  onChangeText={(val) => setCurrent({ ...current, openaiModel: val })}
                  placeholder="ej. gpt-4o-mini, gpt-4o..."
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  style={[styles.input, { marginBottom: 10 }, isDark ? styles.inputDark : styles.inputLight]}
                />

                <Text style={[styles.sectionLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                  OpenAI API Key
                </Text>
                <TextInput
                  value={current.openaiApiKey}
                  onChangeText={(val) => setCurrent({ ...current, openaiApiKey: val })}
                  placeholder="sk-proj-..."
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  secureTextEntry
                  style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 6 }}>
                  <Text style={{ fontSize: 10, color: isDark ? '#94a3b8' : '#64748b' }}>
                    🔒 Se guarda localmente en tu Mac.
                  </Text>
                  <TouchableOpacity onPress={() => Linking.openURL('https://platform.openai.com/api-keys')}>
                    <Text style={{ fontSize: 11, color: '#3b82f6', fontWeight: '600' }}>
                      Obtener API Key en OpenAI Platform ↗
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}

            {/* Live AI Connection Test */}
            <View style={[styles.section, styles.testCard, isDark ? styles.testCardDark : styles.testCardLight]}>
              <View style={styles.testHeaderRow}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.testTitle, isDark ? styles.textDark : styles.textLight]}>
                    Diagnóstico de IA
                  </Text>
                  <Text style={[styles.testDesc, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                    Verifica si la API Key y el modelo responden en tiempo real.
                  </Text>
                </View>

                <TouchableOpacity
                  onPress={handleTestConnection}
                  disabled={testStatus?.loading}
                  style={[styles.testButton, testStatus?.loading && { opacity: 0.6 }]}
                >
                  {testStatus?.loading ? (
                    <ActivityIndicator size="small" color="#ffffff" />
                  ) : (
                    <Text style={styles.testButtonText}>⚡ Probar Conexión</Text>
                  )}
                </TouchableOpacity>
              </View>

              {testStatus && !testStatus.loading && (
                <View
                  style={[
                    styles.testResultBanner,
                    testStatus.success ? styles.testResultSuccess : styles.testResultError,
                  ]}
                >
                  <Text style={styles.testResultIcon}>{testStatus.success ? '✅' : '❌'}</Text>
                  <Text
                    style={[
                      styles.testResultText,
                      testStatus.success ? styles.testResultTextSuccess : styles.testResultTextError,
                    ]}
                  >
                    {testStatus.message}
                  </Text>
                </View>
              )}
            </View>

            {/* Default Target Language */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                Idioma de Destino Predeterminado
              </Text>
              <View style={styles.langPills}>
                {LANGUAGES.filter((l) => l.code !== 'auto').map((lang) => {
                  const isSelected = current.defaultTargetLang === lang.code;
                  return (
                    <TouchableOpacity
                      key={lang.code}
                      onPress={() => setCurrent({ ...current, defaultTargetLang: lang.code as LanguageCode })}
                      style={[
                        styles.langPill,
                        isSelected
                          ? styles.langPillSelected
                          : isDark
                          ? styles.langPillDark
                          : styles.langPillLight,
                      ]}
                    >
                      <Text style={styles.langPillFlag}>{lang.flag}</Text>
                      <Text
                        style={[
                          styles.langPillText,
                          isSelected ? styles.langPillTextSelected : isDark ? styles.textDark : styles.textLight,
                        ]}
                      >
                        {lang.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            {/* Voices Configuration (Text-to-Speech) */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                Voces del Sistema (Text-to-Speech)
              </Text>
              <Text style={[styles.voiceSubdesc, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                Si no se elige una voz específica, Astro ajustará automáticamente la voz correspondiente al idioma de origen y de destino.
              </Text>

              {/* Source Voice Card */}
              <View style={[styles.voiceCard, isDark ? styles.voiceCardDark : styles.voiceCardLight]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.voiceCardTitle, isDark ? styles.textDark : styles.textLight]}>
                    Voz de Origen (Texto original)
                  </Text>
                  <Text style={[styles.voiceCardValue, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                    {current.sourceVoice && current.sourceVoice !== 'auto'
                      ? `🗣 ${current.sourceVoice}`
                      : '✨ Automática (según idioma detectado)'}
                  </Text>
                </View>
                <View style={styles.voiceActionsRow}>
                  <TouchableOpacity
                    onPress={() => handleTestVoice(current.sourceVoice, false)}
                    style={[styles.voiceTestBtn, isDark ? styles.voiceBtnDark : styles.voiceBtnLight]}
                    accessibilityLabel="Probar voz de origen"
                  >
                    <Text style={[styles.voiceBtnText, isDark ? styles.textDark : styles.textLight]}>🔊 Probar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setVoiceSearch('');
                      setVoicePickerTarget('source');
                    }}
                    style={styles.voiceChangeBtn}
                    accessibilityLabel="Cambiar voz de origen"
                  >
                    <Text style={styles.voiceChangeBtnText}>Cambiar</Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Target Voice Card */}
              <View style={[styles.voiceCard, isDark ? styles.voiceCardDark : styles.voiceCardLight]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.voiceCardTitle, isDark ? styles.textDark : styles.textLight]}>
                    Voz de Destino (Traducción)
                  </Text>
                  <Text style={[styles.voiceCardValue, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                    {current.targetVoice && current.targetVoice !== 'auto'
                      ? `🗣 ${current.targetVoice}`
                      : '✨ Automática (según idioma de destino)'}
                  </Text>
                </View>
                <View style={styles.voiceActionsRow}>
                  <TouchableOpacity
                    onPress={() => handleTestVoice(current.targetVoice, true)}
                    style={[styles.voiceTestBtn, isDark ? styles.voiceBtnDark : styles.voiceBtnLight]}
                    accessibilityLabel="Probar voz de destino"
                  >
                    <Text style={[styles.voiceBtnText, isDark ? styles.textDark : styles.textLight]}>🔊 Probar</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    onPress={() => {
                      setVoiceSearch('');
                      setVoicePickerTarget('target');
                    }}
                    style={styles.voiceChangeBtn}
                    accessibilityLabel="Cambiar voz de destino"
                  >
                    <Text style={styles.voiceChangeBtnText}>Cambiar</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>

            {/* Shortcuts Reference */}
            <View style={styles.section}>
              <Text style={[styles.sectionLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                Atajos de Teclado del Sistema
              </Text>
              <View style={[styles.shortcutsTable, isDark ? styles.shortcutsDark : styles.shortcutsLight]}>
                <View style={styles.shortcutRow}>
                  <Text style={[styles.shortcutAction, isDark ? styles.textDark : styles.textLight]}>
                    Activar / Invocación Global
                  </Text>
                  <Text style={styles.kbd}>Cmd + Alt + D</Text>
                </View>
                <View style={styles.shortcutRow}>
                  <Text style={[styles.shortcutAction, isDark ? styles.textDark : styles.textLight]}>
                    Doble pulsación rápida
                  </Text>
                  <Text style={styles.kbd}>Cmd + Cmd</Text>
                </View>
                <View style={styles.shortcutRow}>
                  <Text style={[styles.shortcutAction, isDark ? styles.textDark : styles.textLight]}>
                    Reemplazo en línea (Auto-Replace)
                  </Text>
                  <Text style={styles.kbd}>Cmd + Enter</Text>
                </View>
                <View style={styles.shortcutRow}>
                  <Text style={[styles.shortcutAction, isDark ? styles.textDark : styles.textLight]}>
                    Captura OCR de pantalla
                  </Text>
                  <Text style={styles.kbd}>Cmd + Alt + O</Text>
                </View>
                <View style={styles.shortcutRow}>
                  <Text style={[styles.shortcutAction, isDark ? styles.textDark : styles.textLight]}>
                    Ocultar ventana efímera
                  </Text>
                  <Text style={styles.kbd}>Esc</Text>
                </View>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, isDark ? styles.borderDark : styles.borderLight]}>
            <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
              <Text style={[styles.cancelBtnText, isDark ? styles.textDark : styles.textLight]}>
                Cancelar
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={handleSave} style={styles.saveBtn}>
              <Text style={styles.saveBtnText}>Guardar Ajustes</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Voice Selection Modal */}
      {voicePickerTarget && (
        <Modal
          transparent
          animationType="fade"
          visible={true}
          onRequestClose={() => setVoicePickerTarget(null)}
        >
          <View style={styles.voicePickerOverlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setVoicePickerTarget(null)}
            />
            <View
              style={[
                styles.voicePickerBox,
                isDark ? styles.voicePickerBoxDark : styles.voicePickerBoxLight,
              ]}
              onStartShouldSetResponder={() => true}
            >
              <View style={[styles.voicePickerHeader, isDark ? styles.borderDark : styles.borderLight]}>
                <View>
                  <Text style={[styles.voicePickerTitle, isDark ? styles.textDark : styles.textLight]}>
                    {voicePickerTarget === 'source' ? 'Voz para Texto de Origen' : 'Voz para Texto de Destino'}
                  </Text>
                  <Text style={[styles.voicePickerSubtitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                    Selecciona una voz instalada o déjala en Automática
                  </Text>
                </View>
                <TouchableOpacity onPress={() => setVoicePickerTarget(null)}>
                  <Text style={styles.closeIcon}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Search Bar */}
              <View style={styles.voiceSearchContainer}>
                <TextInput
                  value={voiceSearch}
                  onChangeText={setVoiceSearch}
                  autoFocus={true}
                  placeholder="Buscar voz o idioma (ej. es, Paulina, en, Samantha)..."
                  placeholderTextColor={isDark ? '#64748b' : '#94a3b8'}
                  style={[styles.input, isDark ? styles.inputDark : styles.inputLight]}
                />
              </View>

              <ScrollView style={styles.voiceList}>
                {/* Auto Option */}
                <TouchableOpacity
                  style={[
                    styles.voiceItem,
                    (voicePickerTarget === 'source' ? current.sourceVoice === 'auto' || !current.sourceVoice : current.targetVoice === 'auto' || !current.targetVoice) &&
                      (isDark ? styles.voiceItemSelectedDark : styles.voiceItemSelectedLight),
                  ]}
                  onPress={() => {
                    if (voicePickerTarget === 'source') {
                      setCurrent({ ...current, sourceVoice: 'auto' });
                    } else {
                      setCurrent({ ...current, targetVoice: 'auto' });
                    }
                    setVoicePickerTarget(null);
                  }}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.voiceItemName, isDark ? styles.textDark : styles.textLight]}>
                      ✨ Automática (Predeterminada)
                    </Text>
                    <Text style={[styles.voiceItemDesc, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                      Ajusta la voz inteligentemente según el idioma en tiempo real
                    </Text>
                  </View>
                  {(voicePickerTarget === 'source'
                    ? current.sourceVoice === 'auto' || !current.sourceVoice
                    : current.targetVoice === 'auto' || !current.targetVoice) && (
                    <Text style={styles.voiceItemCheck}>✓</Text>
                  )}
                </TouchableOpacity>

                {/* Voice Items */}
                {voices
                  .filter((v) => {
                    if (!voiceSearch.trim()) return true;
                    const q = voiceSearch.toLowerCase();
                    return (
                      v.name.toLowerCase().includes(q) ||
                      v.lang.toLowerCase().includes(q) ||
                      (v.example && v.example.toLowerCase().includes(q))
                    );
                  })
                  .map((v) => {
                    const isSelected =
                      voicePickerTarget === 'source'
                        ? current.sourceVoice === v.name
                        : current.targetVoice === v.name;
                    return (
                      <TouchableOpacity
                        key={v.name}
                        style={[
                          styles.voiceItem,
                          isSelected && (isDark ? styles.voiceItemSelectedDark : styles.voiceItemSelectedLight),
                        ]}
                        onPress={() => {
                          if (voicePickerTarget === 'source') {
                            setCurrent({ ...current, sourceVoice: v.name });
                          } else {
                            setCurrent({ ...current, targetVoice: v.name });
                          }
                          setVoicePickerTarget(null);
                        }}
                      >
                        <View style={{ flex: 1 }}>
                          <View style={styles.voiceNameRow}>
                            <Text style={[styles.voiceItemName, isDark ? styles.textDark : styles.textLight]}>
                              {v.name}
                            </Text>
                            <Text style={styles.voiceLangBadge}>{v.lang}</Text>
                          </View>
                          {v.example && (
                            <Text
                              style={[styles.voiceItemExample, isDark ? styles.textMutedDark : styles.textMutedLight]}
                              numberOfLines={1}
                            >
                              "{v.example}"
                            </Text>
                          )}
                        </View>

                        <TouchableOpacity
                          onPress={(e) => {
                            e.stopPropagation();
                            handleTestVoice(v.name, voicePickerTarget === 'target');
                          }}
                          style={[styles.voicePreviewBtn, isDark ? styles.voiceBtnDark : styles.voiceBtnLight]}
                          accessibilityLabel="Escuchar muestra"
                        >
                          <Text style={styles.voicePreviewIcon}>🔊</Text>
                        </TouchableOpacity>

                        {isSelected && <Text style={styles.voiceItemCheck}>✓</Text>}
                      </TouchableOpacity>
                    );
                  })}
              </ScrollView>
            </View>
          </View>
        </Modal>
      )}
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBox: {
    width: 600,
    maxHeight: 450,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
    zIndex: 10,
    overflow: 'hidden',
  },
  modalDark: {
    backgroundColor: '#0f172a',
    borderColor: 'rgba(255, 255, 255, 0.12)',
  },
  modalLight: {
    backgroundColor: '#ffffff',
    borderColor: 'rgba(0, 0, 0, 0.1)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 14,
    fontWeight: '700',
  },
  closeIcon: {
    fontSize: 14,
    color: '#94a3b8',
    padding: 4,
  },
  content: {
    padding: 16,
    maxHeight: 320,
  },
  section: {
    marginBottom: 16,
  },
  sectionLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  accessCard: {
    padding: 12,
    borderRadius: 10,
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  accessHeader: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  accessIcon: {
    fontSize: 20,
  },
  accessTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  accessDesc: {
    fontSize: 11,
    marginTop: 2,
    lineHeight: 15,
  },
  permissionBtn: {
    marginTop: 8,
    backgroundColor: '#3b82f6',
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    alignSelf: 'flex-start',
  },
  permissionBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '600',
  },
  providerGrid: {
    gap: 8,
  },
  providerOption: {
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  providerDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  providerLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  providerSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: '#3b82f6',
  },
  providerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  providerName: {
    fontSize: 12,
    fontWeight: '600',
  },
  providerNameActive: {
    color: '#3b82f6',
  },
  providerCheck: {
    fontSize: 12,
    color: '#3b82f6',
    fontWeight: 'bold',
  },
  providerDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  modelPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 8,
  },
  modelPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  modelPillDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  modelPillLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  modelPillSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.18)',
    borderColor: '#3b82f6',
  },
  modelPillText: {
    fontSize: 10,
    fontFamily: 'monospace',
  },
  modelPillTextSelected: {
    color: '#3b82f6',
    fontWeight: '700',
  },
  testCard: {
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  testCardDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  testCardLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  testHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 12,
  },
  testTitle: {
    fontSize: 12,
    fontWeight: '700',
  },
  testDesc: {
    fontSize: 11,
    marginTop: 2,
  },
  testButton: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    minWidth: 110,
    alignItems: 'center',
    justifyContent: 'center',
  },
  testButtonText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
  testResultBanner: {
    marginTop: 10,
    padding: 8,
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
  },
  testResultSuccess: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  testResultError: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  testResultIcon: {
    fontSize: 14,
  },
  testResultText: {
    fontSize: 11,
    flex: 1,
    lineHeight: 15,
  },
  testResultTextSuccess: {
    color: '#10b981',
    fontWeight: '600',
  },
  testResultTextError: {
    color: '#ef4444',
    fontWeight: '600',
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    borderWidth: 1,
  },
  inputDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    color: '#f8fafc',
  },
  inputLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderColor: 'rgba(0, 0, 0, 0.1)',
    color: '#0f172a',
  },
  langPills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  langPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  langPillDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  langPillLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  langPillSelected: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    borderColor: '#3b82f6',
  },
  langPillFlag: {
    fontSize: 12,
  },
  langPillText: {
    fontSize: 11,
  },
  langPillTextSelected: {
    fontWeight: '700',
    color: '#3b82f6',
  },
  shortcutsTable: {
    borderRadius: 8,
    padding: 10,
    borderWidth: 1,
    gap: 6,
  },
  shortcutsDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  shortcutsLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderColor: 'rgba(0, 0, 0, 0.06)',
  },
  shortcutRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  shortcutAction: {
    fontSize: 11,
  },
  kbd: {
    fontSize: 10,
    fontFamily: 'monospace',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    color: '#3b82f6',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderTopWidth: 1,
    gap: 8,
  },
  cancelBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  cancelBtnText: {
    fontSize: 12,
  },
  saveBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  saveBtnText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  borderDark: {
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
    borderTopColor: 'rgba(255, 255, 255, 0.08)',
  },
  borderLight: {
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
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
  voiceSubdesc: {
    fontSize: 11,
    lineHeight: 15,
    marginBottom: 8,
  },
  voiceCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    gap: 8,
  },
  voiceCardDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  voiceCardLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  voiceCardTitle: {
    fontSize: 12,
    fontWeight: '600',
  },
  voiceCardValue: {
    fontSize: 11,
    marginTop: 2,
  },
  voiceActionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  voiceTestBtn: {
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 6,
    borderWidth: 1,
  },
  voiceBtnDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  voiceBtnLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
    borderColor: 'rgba(0, 0, 0, 0.08)',
  },
  voiceBtnText: {
    fontSize: 11,
    fontWeight: '600',
  },
  voiceChangeBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
  },
  voiceChangeBtnText: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: '700',
  },
  voicePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  voicePickerBox: {
    width: 480,
    maxHeight: 400,
    borderRadius: 14,
    borderWidth: 1,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.45,
    shadowRadius: 24,
    elevation: 12,
    zIndex: 10,
  },
  voicePickerBoxDark: {
    backgroundColor: '#0f172a',
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  voicePickerBoxLight: {
    backgroundColor: '#ffffff',
    borderColor: 'rgba(0, 0, 0, 0.12)',
  },
  voicePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  voicePickerTitle: {
    fontSize: 13,
    fontWeight: '700',
  },
  voicePickerSubtitle: {
    fontSize: 11,
    marginTop: 2,
  },
  voiceSearchContainer: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  voiceList: {
    paddingHorizontal: 12,
    paddingBottom: 12,
    maxHeight: 280,
  },
  voiceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderRadius: 8,
    marginBottom: 4,
    gap: 8,
  },
  voiceItemSelectedDark: {
    backgroundColor: 'rgba(59, 130, 246, 0.22)',
  },
  voiceItemSelectedLight: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  voiceNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  voiceItemName: {
    fontSize: 12,
    fontWeight: '600',
  },
  voiceLangBadge: {
    fontSize: 9,
    fontFamily: 'monospace',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    color: '#3b82f6',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 3,
    fontWeight: 'bold',
  },
  voiceItemDesc: {
    fontSize: 10,
    marginTop: 2,
  },
  voiceItemExample: {
    fontSize: 10,
    marginTop: 2,
    fontStyle: 'italic',
  },
  voicePreviewBtn: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    borderWidth: 1,
  },
  voicePreviewIcon: {
    fontSize: 12,
  },
  voiceItemCheck: {
    fontSize: 14,
    color: '#3b82f6',
    fontWeight: 'bold',
  },
});
