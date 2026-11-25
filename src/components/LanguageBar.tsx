import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Pressable, StyleSheet, Modal } from 'react-native';
import { LanguageCode } from '../types';
import { LANGUAGES } from '../services/aiService';

interface LanguageBarProps {
  sourceLang: LanguageCode;
  targetLang: LanguageCode;
  detectedLang?: LanguageCode;
  isTargetPinned: boolean;
  isWindowPinned: boolean;
  isDark: boolean;
  isTranslating?: boolean;
  providerLabel?: string;
  onSelectSource: (lang: LanguageCode) => void;
  onSelectTarget: (lang: LanguageCode) => void;
  onSwapLanguages: () => void;
  onToggleTargetPin: () => void;
  onToggleWindowPin: () => void;
  onOpenSettings: () => void;
  onOpenHistory: () => void;
}

export const LanguageBar: React.FC<LanguageBarProps> = ({
  sourceLang,
  targetLang,
  detectedLang,
  isTargetPinned,
  isWindowPinned,
  isDark,
  isTranslating = false,
  providerLabel,
  onSelectSource,
  onSelectTarget,
  onSwapLanguages,
  onToggleTargetPin,
  onToggleWindowPin,
  onOpenSettings,
  onOpenHistory,
}) => {
  const [pickerMode, setPickerMode] = useState<'source' | 'target' | null>(null);

  const getSourceDisplay = () => {
    if (sourceLang === 'auto') {
      if (detectedLang) {
        const found = LANGUAGES.find((l) => l.code === detectedLang);
        return `✨ Auto (${found ? found.name : detectedLang.toUpperCase()})`;
      }
      return '✨ Detectar idioma';
    }
    const found = LANGUAGES.find((l) => l.code === sourceLang);
    return `${found?.flag || ''} ${found?.name || sourceLang.toUpperCase()}`;
  };

  const getTargetDisplay = () => {
    const found = LANGUAGES.find((l) => l.code === targetLang);
    return `${found?.flag || ''} ${found?.name || targetLang.toUpperCase()}`;
  };

  return (
    <View style={[styles.container, isDark ? styles.borderDark : styles.borderLight, styles.dragHandle]}>
      {/* Drag grip indicator */}
      <View style={styles.dragGrip} accessibilityLabel="Mover ventana">
        <Text style={[styles.dragGripIcon, isDark ? styles.textMutedDark : styles.textMutedLight]}>⋮⋮</Text>
      </View>

      <View style={styles.langSelectorRow}>
        {/* Source Language Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setPickerMode('source')}
          style={[styles.langButton, styles.noDrag, isDark ? styles.langButtonDark : styles.langButtonLight]}
        >
          <Text style={[styles.langButtonText, isDark ? styles.textDark : styles.textLight]} numberOfLines={1}>
            {getSourceDisplay()}
          </Text>
          <Text style={styles.chevron}>▾</Text>
        </TouchableOpacity>

        {/* Swap Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onSwapLanguages}
          style={[styles.swapButton, styles.noDrag, isDark ? styles.swapButtonDark : styles.swapButtonLight]}
          accessibilityLabel="Invertir idiomas"
        >
          <Text style={[styles.swapIcon, isDark ? styles.textDark : styles.textLight]}>⇄</Text>
        </TouchableOpacity>

        {/* Target Language Button */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={() => setPickerMode('target')}
          style={[styles.langButton, styles.noDrag, isDark ? styles.langButtonDark : styles.langButtonLight]}
        >
          <Text style={[styles.langButtonText, isDark ? styles.textDark : styles.textLight]} numberOfLines={1}>
            {getTargetDisplay()}
          </Text>
          <Text style={styles.chevron}>▾</Text>
        </TouchableOpacity>

        {/* Target Language Pin Button (Fijar idioma destino) */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onToggleTargetPin}
          style={[
            styles.iconButton,
            styles.noDrag,
            isTargetPinned && styles.pinActive,
            isDark ? styles.iconButtonDark : styles.iconButtonLight,
          ]}
          accessibilityLabel={
            isTargetPinned
              ? 'Idioma de destino fijado: no cambia automáticamente'
              : 'Fijar idioma de destino (evitar cambio automático es ↔ en)'
          }
        >
          <Text style={[styles.pinIcon, isTargetPinned && styles.pinIconActive]}>
            {isTargetPinned ? '🔒' : '🔓'}
          </Text>
        </TouchableOpacity>

        {/* Pin Window Button (Chincheta: mantener ventana visible) */}
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onToggleWindowPin}
          style={[
            styles.iconButton,
            styles.noDrag,
            isWindowPinned && styles.pinActive,
            isDark ? styles.iconButtonDark : styles.iconButtonLight,
          ]}
          accessibilityLabel={
            isWindowPinned
              ? 'Ventana fijada: no se oculta al hacer clic fuera'
              : 'Fijar ventana (impedir que desaparezca al hacer clic fuera)'
          }
        >
          <Text style={[styles.pinIcon, isWindowPinned && styles.pinIconActive]}>
            {isWindowPinned ? '📌' : '📍'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Action Buttons: Live AI Status Indicator, History and Settings */}
      <View style={styles.actionButtons}>
        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onOpenSettings}
          style={[styles.aiStatusPill, styles.noDrag, isDark ? styles.aiStatusPillDark : styles.aiStatusPillLight]}
          accessibilityLabel="Estado de la IA"
        >
          <View style={[styles.aiDot, isTranslating ? styles.aiDotBusy : styles.aiDotReady]} />
          <Text style={[styles.aiStatusLabel, isDark ? styles.textDark : styles.textLight]}>
            {isTranslating ? 'Traduciendo...' : 'IA Activa'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onOpenHistory}
          style={[styles.iconButton, styles.noDrag, isDark ? styles.iconButtonDark : styles.iconButtonLight]}
          accessibilityLabel="Historial"
        >
          <Text style={styles.actionIcon}>🕒</Text>
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onOpenSettings}
          style={[styles.iconButton, styles.noDrag, isDark ? styles.iconButtonDark : styles.iconButtonLight]}
          accessibilityLabel="Ajustes"
        >
          <Text style={styles.actionIcon}>⚙️</Text>
        </TouchableOpacity>
      </View>

      {/* Language Picker Dropdown Modal */}
      {pickerMode && (
        <Modal
          transparent
          animationType="fade"
          visible={true}
          onRequestClose={() => setPickerMode(null)}
        >
          <View style={styles.modalOverlay}>
            <Pressable
              style={StyleSheet.absoluteFill}
              onPress={() => setPickerMode(null)}
            />
            <View
              style={[
                styles.dropdownContainer,
                isDark ? styles.dropdownDark : styles.dropdownLight,
              ]}
            >
              <Text style={[styles.dropdownTitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                {pickerMode === 'source' ? 'Seleccionar idioma de origen' : 'Seleccionar idioma de destino'}
              </Text>
              <View style={styles.optionsList}>
                {LANGUAGES.filter((l) => (pickerMode === 'target' ? l.code !== 'auto' : true)).map(
                  (lang) => {
                    const isSelected =
                      pickerMode === 'source'
                        ? sourceLang === lang.code
                        : targetLang === lang.code;
                    return (
                      <TouchableOpacity
                        key={lang.code}
                        style={[
                          styles.optionItem,
                          isSelected && (isDark ? styles.optionSelectedDark : styles.optionSelectedLight),
                        ]}
                        onPress={() => {
                          if (pickerMode === 'source') {
                            onSelectSource(lang.code);
                          } else {
                            onSelectTarget(lang.code);
                          }
                          setPickerMode(null);
                        }}
                      >
                        <Text style={styles.optionFlag}>{lang.flag}</Text>
                        <Text
                          style={[
                            styles.optionName,
                            isDark ? styles.textDark : styles.textLight,
                            isSelected && styles.optionNameSelected,
                          ]}
                        >
                          {lang.name}
                        </Text>
                        {isSelected && <Text style={styles.checkIcon}>✓</Text>}
                      </TouchableOpacity>
                    );
                  }
                )}
              </View>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
  },
  dragHandle: {
    WebkitAppRegion: 'drag',
    cursor: 'grab',
  } as any,
  noDrag: {
    WebkitAppRegion: 'no-drag',
    cursor: 'pointer',
  } as any,
  dragGrip: {
    paddingRight: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  dragGripIcon: {
    fontSize: 13,
    letterSpacing: -2,
    opacity: 0.5,
  },
  borderDark: {
    borderBottomColor: 'rgba(255, 255, 255, 0.08)',
  },
  borderLight: {
    borderBottomColor: 'rgba(0, 0, 0, 0.08)',
  },
  langSelectorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  langButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 6,
    maxWidth: 160,
  },
  langButtonDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
  },
  langButtonLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  langButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  chevron: {
    fontSize: 10,
    color: '#94a3b8',
  },
  swapButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swapButtonDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  swapButtonLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.06)',
  },
  swapIcon: {
    fontSize: 14,
    fontWeight: 'bold',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  aiStatusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: 14,
    marginRight: 4,
  },
  aiStatusPillDark: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  aiStatusPillLight: {
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  aiDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  aiDotReady: {
    backgroundColor: '#10b981',
  },
  aiDotBusy: {
    backgroundColor: '#f59e0b',
  },
  aiStatusLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#10b981',
  },
  iconButton: {
    width: 30,
    height: 30,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconButtonDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  iconButtonLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.04)',
  },
  actionIcon: {
    fontSize: 14,
  },
  pinIcon: {
    fontSize: 13,
    opacity: 0.7,
  },
  pinActive: {
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
  },
  pinIconActive: {
    opacity: 1,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdownContainer: {
    width: 280,
    borderRadius: 12,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
    zIndex: 10,
  },
  dropdownDark: {
    backgroundColor: '#1e293b',
    borderColor: 'rgba(255, 255, 255, 0.1)',
    borderWidth: 1,
  },
  dropdownLight: {
    backgroundColor: '#ffffff',
    borderColor: 'rgba(0, 0, 0, 0.1)',
    borderWidth: 1,
  },
  dropdownTitle: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  optionsList: {
    gap: 4,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 10,
    borderRadius: 6,
    gap: 10,
  },
  optionSelectedDark: {
    backgroundColor: 'rgba(59, 130, 246, 0.25)',
  },
  optionSelectedLight: {
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
  },
  optionFlag: {
    fontSize: 14,
  },
  optionName: {
    fontSize: 13,
    flex: 1,
  },
  optionNameSelected: {
    fontWeight: '700',
    color: '#3b82f6',
  },
  checkIcon: {
    fontSize: 13,
    color: '#3b82f6',
    fontWeight: 'bold',
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
