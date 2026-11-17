import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

interface ProofreadingCardProps {
  explanation?: string;
  isDark: boolean;
}

export const ProofreadingCard: React.FC<ProofreadingCardProps> = ({ explanation, isDark }) => {
  return (
    <View style={[styles.card, isDark ? styles.cardDark : styles.cardLight]}>
      <View style={styles.header}>
        <Text style={styles.badge}>✍️ Modo Mejora de Redacción & Estilo</Text>
      </View>
      <Text style={[styles.infoText, isDark ? styles.textDark : styles.textLight]}>
        {explanation || 'Texto analizado y corregido para máxima claridad, corrección gramatical y ortográfica.'}
      </Text>
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
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    borderColor: 'rgba(16, 185, 129, 0.3)',
  },
  cardLight: {
    backgroundColor: 'rgba(236, 253, 245, 0.9)',
    borderColor: 'rgba(16, 185, 129, 0.25)',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  badge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#10b981',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  infoText: {
    fontSize: 12,
    lineHeight: 17,
  },
  textDark: {
    color: '#d1fae5',
  },
  textLight: {
    color: '#065f46',
  },
});
