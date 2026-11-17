import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal, ScrollView } from 'react-native';
import { HistoryItem } from '../types';

interface HistoryModalProps {
  visible: boolean;
  history: HistoryItem[];
  isDark: boolean;
  onClose: () => void;
  onSelectHistoryItem: (item: HistoryItem) => void;
  onToggleFavorite: (id: string) => void;
  onClearHistory: () => void;
}

export const HistoryModal: React.FC<HistoryModalProps> = ({
  visible,
  history,
  isDark,
  onClose,
  onSelectHistoryItem,
  onToggleFavorite,
  onClearHistory,
}) => {
  const [filterFavorites, setFilterFavorites] = useState(false);

  const displayedItems = filterFavorites ? history.filter((i) => i.isFavorite) : history;

  const formatDate = (timestamp: number) => {
    const d = new Date(timestamp);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <TouchableOpacity style={styles.overlay} activeOpacity={1} onPress={onClose}>
        <View
          style={[styles.modalBox, isDark ? styles.modalDark : styles.modalLight]}
          // Prevent click propagation inside box
          onStartShouldSetResponder={() => true}
        >
          {/* Header */}
          <View style={[styles.header, isDark ? styles.borderDark : styles.borderLight]}>
            <View style={styles.titleRow}>
              <Text style={styles.headerIcon}>🕒</Text>
              <Text style={[styles.headerTitle, isDark ? styles.textDark : styles.textLight]}>
                Historial de Traducciones
              </Text>
            </View>

            <View style={styles.tabRow}>
              <TouchableOpacity
                onPress={() => setFilterFavorites(false)}
                style={[
                  styles.tabButton,
                  !filterFavorites && (isDark ? styles.tabActiveDark : styles.tabActiveLight),
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    !filterFavorites ? styles.tabTextActive : isDark ? styles.textMutedDark : styles.textMutedLight,
                  ]}
                >
                  Todos ({history.length})
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setFilterFavorites(true)}
                style={[
                  styles.tabButton,
                  filterFavorites && (isDark ? styles.tabActiveDark : styles.tabActiveLight),
                ]}
              >
                <Text
                  style={[
                    styles.tabText,
                    filterFavorites ? styles.tabTextActive : isDark ? styles.textMutedDark : styles.textMutedLight,
                  ]}
                >
                  Favoritos ({history.filter((i) => i.isFavorite).length})
                </Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* List */}
          <ScrollView style={styles.listContainer}>
            {displayedItems.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyIcon}>{filterFavorites ? '⭐' : '📂'}</Text>
                <Text style={[styles.emptyText, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                  {filterFavorites
                    ? 'No tienes traducciones marcadas como favoritas todavía.'
                    : 'Aún no hay traducciones en el historial.'}
                </Text>
              </View>
            ) : (
              displayedItems.map((item) => (
                <TouchableOpacity
                  key={item.id}
                  activeOpacity={0.7}
                  onPress={() => {
                    onSelectHistoryItem(item);
                    onClose();
                  }}
                  style={[styles.historyRow, isDark ? styles.rowDark : styles.rowLight]}
                >
                  <View style={styles.itemMeta}>
                    <View style={styles.badgeRow}>
                      <Text style={styles.langBadge}>
                        {item.sourceLang.toUpperCase()} → {item.targetLang.toUpperCase()}
                      </Text>
                      {item.isDictionary && <Text style={styles.miniBadge}>DICCIONARIO</Text>}
                    </View>
                    <Text style={[styles.timestamp, isDark ? styles.textMutedDark : styles.textMutedLight]}>
                      {formatDate(item.timestamp)}
                    </Text>
                  </View>

                  <Text style={[styles.originalSnippet, isDark ? styles.textMutedDark : styles.textMutedLight]} numberOfLines={1}>
                    {item.originalText}
                  </Text>
                  <Text style={[styles.translatedSnippet, isDark ? styles.textDark : styles.textLight]} numberOfLines={2}>
                    {item.translatedText}
                  </Text>

                  {/* Favorite star */}
                  <TouchableOpacity
                    onPress={() => onToggleFavorite(item.id)}
                    style={styles.starButton}
                    accessibilityLabel="Favorito"
                  >
                    <Text style={[styles.starIcon, item.isFavorite && styles.starActive]}>
                      {item.isFavorite ? '★' : '☆'}
                    </Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              ))
            )}
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, isDark ? styles.borderDark : styles.borderLight]}>
            {history.length > 0 && !filterFavorites && (
              <TouchableOpacity onPress={onClearHistory} style={styles.clearBtn}>
                <Text style={styles.clearBtnText}>Borrar historial</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
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
    width: 580,
    maxHeight: 400,
    borderRadius: 14,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
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
  tabRow: {
    flexDirection: 'row',
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.08)',
    borderRadius: 8,
    padding: 2,
  },
  tabButton: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  tabActiveDark: {
    backgroundColor: '#1e293b',
  },
  tabActiveLight: {
    backgroundColor: '#ffffff',
  },
  tabText: {
    fontSize: 11,
    fontWeight: '600',
  },
  tabTextActive: {
    color: '#3b82f6',
  },
  listContainer: {
    padding: 12,
    maxHeight: 280,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 8,
  },
  emptyIcon: {
    fontSize: 28,
  },
  emptyText: {
    fontSize: 12,
    textAlign: 'center',
  },
  historyRow: {
    padding: 10,
    borderRadius: 8,
    marginBottom: 8,
    borderWidth: 1,
    position: 'relative',
  },
  rowDark: {
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderColor: 'rgba(255, 255, 255, 0.06)',
  },
  rowLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.02)',
    borderColor: 'rgba(0, 0, 0, 0.05)',
  },
  itemMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
    paddingRight: 24,
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  langBadge: {
    fontSize: 10,
    fontWeight: '700',
    color: '#3b82f6',
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  miniBadge: {
    fontSize: 9,
    fontWeight: '700',
    color: '#10b981',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    paddingHorizontal: 4,
    paddingVertical: 1,
    borderRadius: 4,
  },
  timestamp: {
    fontSize: 10,
  },
  originalSnippet: {
    fontSize: 11,
    fontStyle: 'italic',
    marginBottom: 2,
    paddingRight: 24,
  },
  translatedSnippet: {
    fontSize: 12,
    fontWeight: '500',
    paddingRight: 24,
  },
  starButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    padding: 4,
  },
  starIcon: {
    fontSize: 16,
    color: '#94a3b8',
  },
  starActive: {
    color: '#f59e0b',
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
  clearBtn: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  clearBtnText: {
    fontSize: 12,
    color: '#ef4444',
  },
  closeBtn: {
    backgroundColor: '#3b82f6',
    paddingHorizontal: 14,
    paddingVertical: 6,
    borderRadius: 6,
  },
  closeBtnText: {
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
});
