import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import { theme } from '../../theme';

interface HeaderProps {
  title: string;
  onLeftPress?: () => void;
  onRightPress?: () => void;
  leftIcon?: string;
  rightIcon?: string;
  rightText?: string;
}

export default function Header({
  title,
  onLeftPress,
  onRightPress,
  leftIcon = 'arrow-back',
  rightIcon,
  rightText,
}: HeaderProps) {
  return (
    <View style={styles.container}>
      {/* 左侧按钮 */}
      <View style={styles.leftContainer}>
        {onLeftPress && (
          <TouchableOpacity onPress={onLeftPress} style={styles.button}>
            <Icon name={leftIcon} size={24} color={theme.colors.text} />
          </TouchableOpacity>
        )}
      </View>

      {/* 标题 */}
      <View style={styles.titleContainer}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
      </View>

      {/* 右侧按钮 */}
      <View style={styles.rightContainer}>
        {onRightPress && (
          <TouchableOpacity onPress={onRightPress} style={styles.button}>
            {rightIcon ? (
              <Icon name={rightIcon} size={24} color={theme.colors.text} />
            ) : (
              <Text style={styles.rightText}>{rightText}</Text>
            )}
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: theme.spacing.sm,
  },
  leftContainer: {
    width: 56,
    alignItems: 'flex-start',
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  rightContainer: {
    width: 56,
    alignItems: 'flex-end',
  },
  button: {
    padding: theme.spacing.sm,
  },
  title: {
    fontSize: theme.fontSize.lg,
    fontWeight: 'bold',
    color: theme.colors.text,
  },
  rightText: {
    fontSize: theme.fontSize.md,
    color: theme.colors.primary,
    fontWeight: '600',
  },
});
