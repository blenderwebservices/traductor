import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { DictionaryEntry } from '../types';

interface DictionaryCardProps {
  entry: DictionaryEntry;
  isDark: boolean;
}

export const DictionaryCard: React.FC<DictionaryCardProps> = ({ entry, isDark }) => {
  return (
    <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
      <View style={styles.header}>
        <Text style={styles.badge}>📖 Modo Diccionario Extendido</Text>
        {entry.partOfSpeech ? (
          <Text style={[styles.partOfSpeech, isDark ? styles.textMutedDark : styles.textMutedLight]}>
            ({entry.partOfSpeech})
          </Text>
        ) : null}
        {entry.phonetic ? (
          <Text style={[styles.phonetic, isDark ? styles.phoneticDark : styles.phoneticLight]}>
            {entry.phonetic}
          </Text>
        ) : null}
      </View>

      {entry.definition ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
            Definición:
          </Text>
          <Text style={[styles.definition, isDark ? styles.textDark : styles.textLight]}>
            {entry.definition}
          </Text>
        </View>
      ) : null}

      {entry.examples && entry.examples.length > 0 ? (
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, isDark ? styles.textMutedDark : styles.textMutedLight]}>
            Ejemplo de uso:
          </Text>
          {entry.examples.map((ex, idx) => (
            <Text
              key={idx}
              style={[styles.example, isDark ? styles.exampleDark : styles.exampleLight]}
            >
              • "{ex}"
            </Text>
          ))}
        </View>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  cardDark: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    borderColor: 'rgba(59, 130, 246, 0.25)',
  },
  cardLight: {
    backgroundColor: 'rgba(241, 245, 249, 0.9)',
    borderColor: 'rgba(59, 130, 246, 0.2)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  badge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3b82f6',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  partOfSpeech: {
    fontSize: 11,
    fontStyle: 'italic',
  },
  phonetic: {
    fontSize: 11,
    fontFamily: 'monospace',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  phoneticDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    color: '#93c5fd',
  },
  phoneticLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
    color: '#1d4ed8',
  },
  section: {
    marginTop: 4,
  },
  sectionTitle: {
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginBottom: 2,
  },
  definition: {
    fontSize: 12,
    lineHeight: 17,
  },
  example: {
    fontSize: 11,
    lineHeight: 16,
    fontStyle: 'italic',
    marginTop: 2,
  },
  exampleDark: {
    color: '#94a3b8',
  },
  exampleLight: {
    color: '#475569',
  },
  textDark: {
    color: '#e2e8f0',
  },
  textLight: {
    color: '#1e293b',
  },
  textMutedDark: {
    color: '#64748b',
  },
  textMutedLight: {
    color: '#94a3b8',
  },
});
