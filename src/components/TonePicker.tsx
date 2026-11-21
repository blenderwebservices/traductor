import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Tone } from '../types';

interface TonePickerProps {
  selectedTone: Tone;
  onSelectTone: (tone: Tone) => void;
  isDark: boolean;
  isUniversalEngine?: boolean;
  onOpenSettings?: () => void;
}

const TONES: { id: Tone; label: string; icon: string; requiresLLM?: boolean }[] = [
  { id: 'standard', label: 'Estándar', icon: '⚡' },
  { id: 'formal', label: 'Formal', icon: '👔' },
  { id: 'informal', label: 'Informal', icon: '💬', requiresLLM: true },
  { id: 'technical', label: 'Técnico', icon: '⚙️', requiresLLM: true },
  { id: 'concise', label: 'Resumido', icon: '✂️' },
];

export const TonePicker: React.FC<TonePickerProps> = ({
  selectedTone,
  onSelectTone,
  isDark,
  isUniversalEngine = false,
  onOpenSettings,
}) => {
  const activeToneMeta = TONES.find((t) => t.id === selectedTone);
  const showLLMNudge = isUniversalEngine && !!activeToneMeta?.requiresLLM;

  return (
    <View style={styles.wrapper}>
      <View style={styles.container}>
        <Text style={[styles.headerLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>
          Tono:
        </Text>
        <View style={styles.toneList}>
          {TONES.map((tone) => {
            const isSelected = selectedTone === tone.id;
            const showBadge = isUniversalEngine && tone.requiresLLM;
            return (
              <TouchableOpacity
                key={tone.id}
                activeOpacity={0.7}
                onPress={() => onSelectTone(tone.id)}
                style={[
                  styles.tonePill,
                  isSelected
                    ? styles.tonePillActive
                    : isDark
                    ? styles.tonePillInactiveDark
                    : styles.tonePillInactiveLight,
                ]}
              >
                <Text style={styles.toneIcon}>{tone.icon}</Text>
                <Text
                  style={[
                    styles.toneText,
                    isSelected
                      ? styles.toneTextActive
                      : isDark
                      ? styles.toneTextDark
                      : styles.toneTextLight,
                  ]}
                >
                  {tone.label}
                </Text>
                {showBadge && (
                  <Text style={[styles.llmBadge, isSelected && styles.llmBadgeActive]}>IA</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {showLLMNudge && (
        <View style={[styles.nudgeBar, isDark ? styles.nudgeBarDark : styles.nudgeBarLight]}>
          <Text style={[styles.nudgeText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
            El tono "{activeToneMeta?.label}" requiere Gemini u OpenAI para reescribir el registro.
          </Text>
          {onOpenSettings && (
            <TouchableOpacity onPress={onOpenSettings}>
              <Text style={styles.nudgeLink}>Configurar API Key →</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerLabel: {
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  toneList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tonePill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 9,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  tonePillActive: {
    backgroundColor: '#3b82f6',
  },
  tonePillInactiveDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  tonePillInactiveLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  toneIcon: {
    fontSize: 11,
  },
  toneText: {
    fontSize: 11,
    fontWeight: '500',
  },
  toneTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  toneTextDark: {
    color: '#cbd5e1',
  },
  toneTextLight: {
    color: '#475569',
  },
  textMutedDark: {
    color: '#64748b',
  },
  textMutedLight: {
    color: '#94a3b8',
  },
  llmBadge: {
    fontSize: 8,
    fontWeight: '700',
    color: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.15)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  llmBadgeActive: {
    color: '#ffffff',
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
  },
  nudgeBar: {
    marginTop: 6,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
  },
  nudgeBarDark: {
    backgroundColor: 'rgba(59, 130, 246, 0.12)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  nudgeBarLight: {
    backgroundColor: 'rgba(59, 130, 246, 0.08)',
    borderWidth: 1,
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  nudgeText: {
    fontSize: 10,
    flex: 1,
  },
  nudgeLink: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3b82f6',
  },
});
