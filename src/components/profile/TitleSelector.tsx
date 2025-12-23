import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal } from 'react-native';
import { COLORS, SPACING, RADIUS, SHADOWS } from '../../utils/constants';
import { TITLES } from '../../services/progression';

interface TitleSelectorProps {
  availableTitles: string[];
  selectedTitle?: string;
  onSelectTitle: (titleId: string) => void;
}

export const TitleSelector: React.FC<TitleSelectorProps> = ({
  availableTitles,
  selectedTitle,
  onSelectTitle,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const currentTitle = selectedTitle ? TITLES[selectedTitle.toUpperCase() as keyof typeof TITLES] : TITLES.NEWBIE;

  const handleSelectTitle = (titleId: string) => {
    onSelectTitle(titleId);
    setModalVisible(false);
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity 
        style={styles.currentTitle}
        onPress={() => setModalVisible(true)}
        activeOpacity={0.7}
      >
        <Text style={styles.titleIcon}>{currentTitle.icon}</Text>
        <Text style={styles.titleName}>{currentTitle.name}</Text>
        <Text style={styles.changeText}>Tap to change</Text>
      </TouchableOpacity>

      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Your Title</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Text style={styles.closeButton}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.titlesList}>
              {Object.values(TITLES).map((title) => {
                const isAvailable = availableTitles.includes(title.id);
                const isSelected = selectedTitle === title.id;

                return (
                  <TouchableOpacity
                    key={title.id}
                    style={[
                      styles.titleOption,
                      isSelected && styles.selectedTitleOption,
                      !isAvailable && styles.lockedTitleOption,
                    ]}
                    onPress={() => isAvailable && handleSelectTitle(title.id)}
                    disabled={!isAvailable}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.titleOptionIcon}>{title.icon}</Text>
                    <View style={styles.titleOptionInfo}>
                      <Text style={[
                        styles.titleOptionName,
                        !isAvailable && styles.lockedText
                      ]}>
                        {title.name}
                      </Text>
                      <Text style={styles.titleRequirement}>{title.requirement}</Text>
                    </View>
                    {isSelected && (
                      <Text style={styles.checkmark}>✓</Text>
                    )}
                    {!isAvailable && (
                      <Text style={styles.lockIcon}>🔒</Text>
                    )}
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: SPACING.md,
  },
  currentTitle: {
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.lg,
    alignItems: 'center',
    ...SHADOWS.md,
  },
  titleIcon: {
    fontSize: 48,
    marginBottom: SPACING.sm,
  },
  titleName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  changeText: {
    fontSize: 12,
    color: COLORS.primary,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: '80%',
    ...SHADOWS.lg,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: SPACING.lg,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: COLORS.text,
  },
  closeButton: {
    fontSize: 24,
    color: COLORS.textSecondary,
    padding: SPACING.sm,
  },
  titlesList: {
    padding: SPACING.md,
  },
  titleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.lg,
    padding: SPACING.md,
    marginBottom: SPACING.sm,
    ...SHADOWS.sm,
  },
  selectedTitleOption: {
    borderWidth: 2,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primary + '10',
  },
  lockedTitleOption: {
    opacity: 0.5,
  },
  titleOptionIcon: {
    fontSize: 32,
    marginRight: SPACING.md,
  },
  titleOptionInfo: {
    flex: 1,
  },
  titleOptionName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: COLORS.text,
    marginBottom: SPACING.xs,
  },
  titleRequirement: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  lockedText: {
    color: COLORS.textSecondary,
  },
  checkmark: {
    fontSize: 24,
    color: COLORS.primary,
    marginLeft: SPACING.sm,
  },
  lockIcon: {
    fontSize: 20,
    marginLeft: SPACING.sm,
  },
});
