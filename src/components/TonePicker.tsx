import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Tone } from '../types';

interface TonePickerProps {
  selectedTone: Tone;
  onSelectTone: (tone: Tone) => void;
  isDark: boolean;
}

const TONES: { id: Tone; label: string; icon: string }[] = [
  { id: 'standard', label: 'Estándar', icon: '⚡' },
  { id: 'formal', label: 'Formal', icon: '👔' },
  { id: 'informal', label: 'Informal', icon: '💬' },
  { id: 'technical', label: 'Técnico', icon: '⚙️' },
  { id: 'concise', label: 'Resumido', icon: '✂️' },
];

export const TonePicker: React.FC<TonePickerProps> = ({ selectedTone, onSelectTone, isDark }) => {
  return (
    <View style={styles.container}>
      <Text style={[styles.headerLabel, isDark ? styles.textMutedDark : styles.textMutedLight]}>
        Tono:
      </Text>
      <View style={styles.toneList}>
        {TONES.map((tone) => {
          const isSelected = selectedTone === tone.id;
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
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 6,
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
});
