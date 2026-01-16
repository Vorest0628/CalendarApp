/**
 * 提醒时间选择器组件
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  FlatList,
  ScrollView,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { REMINDER_PRESETS } from '../../types/event';
import { colors } from '../../theme/colors';

interface ReminderPickerProps {
  selectedMinutes: number[]; // 已选择的提醒时间（分钟数数组）
  onSelect: (minutes: number[]) => void; // 选择回调
}

const ReminderPicker: React.FC<ReminderPickerProps> = ({
  selectedMinutes,
  onSelect,
}) => {
  const [modalVisible, setModalVisible] = useState(false);

  /**
   * 格式化显示文本
   */
  const formatMinutes = (minutes: number): string => {
    const preset = REMINDER_PRESETS.find(p => p.value === minutes);
    return preset ? preset.label : `提前 ${minutes} 分钟`;
  };

  /**
   * 添加提醒
   */
  const handleAdd = (minutes: number) => {
    if (!selectedMinutes.includes(minutes)) {
      const newMinutes = [...selectedMinutes, minutes].sort((a, b) => a - b);
      onSelect(newMinutes);
    }
    setModalVisible(false);
  };

  /**
   * 移除提醒
   */
  const handleRemove = (minutes: number) => {
    const newMinutes = selectedMinutes.filter(m => m !== minutes);
    onSelect(newMinutes);
  };

  /**
   * 渲染预设选项
   */
  const renderPresetItem = ({ item }: { item: typeof REMINDER_PRESETS[0] }) => {
    const isSelected = selectedMinutes.includes(item.value);

    return (
      <TouchableOpacity
        style={[styles.presetItem, isSelected && styles.presetItemSelected]}
        onPress={() => handleAdd(item.value)}
        disabled={isSelected}>
        <Text
          style={[
            styles.presetText,
            isSelected && styles.presetTextSelected,
          ]}>
          {item.label}
        </Text>
        {isSelected && (
          <Icon name="check" size={20} color={colors.primary} />
        )}
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {/* 标题 */}
      <View style={styles.header}>
        <Icon name="notifications" size={20} color={colors.textSecondary} />
        <Text style={styles.label}>提醒</Text>
      </View>

      {/* 已选提醒列表 */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.chipContainer}>
        {selectedMinutes.length === 0 ? (
          <TouchableOpacity
            style={styles.addButton}
            onPress={() => setModalVisible(true)}>
            <Icon name="add" size={20} color={colors.primary} />
            <Text style={styles.addButtonText}>添加提醒</Text>
          </TouchableOpacity>
        ) : (
          <>
            {selectedMinutes.map(minutes => (
              <View key={minutes} style={styles.chip}>
                <Text style={styles.chipText}>{formatMinutes(minutes)}</Text>
                <TouchableOpacity onPress={() => handleRemove(minutes)}>
                  <Icon name="close" size={16} color={colors.text} />
                </TouchableOpacity>
              </View>
            ))}
            <TouchableOpacity
              style={styles.addChipButton}
              onPress={() => setModalVisible(true)}>
              <Icon name="add" size={20} color={colors.primary} />
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* 选择模态框 */}
      <Modal
        visible={modalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setModalVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>选择提醒时间</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}>
                <Icon name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            <FlatList
              data={REMINDER_PRESETS}
              keyExtractor={item => item.value.toString()}
              renderItem={renderPresetItem}
              ItemSeparatorComponent={() => <View style={styles.separator} />}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  label: {
    fontSize: 14,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  chipContainer: {
    flexDirection: 'row',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    marginRight: 8,
  },
  chipText: {
    fontSize: 14,
    color: colors.text,
    marginRight: 8,
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 16,
  },
  addButtonText: {
    fontSize: 14,
    color: colors.primary,
    marginLeft: 4,
  },
  addChipButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.text,
  },
  presetItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  presetItemSelected: {
    backgroundColor: colors.surface,
  },
  presetText: {
    fontSize: 16,
    color: colors.text,
  },
  presetTextSelected: {
    color: colors.primary,
    fontWeight: '500',
  },
  separator: {
    height: 1,
    backgroundColor: colors.border,
    marginHorizontal: 16,
  },
});

export default ReminderPicker;
