import React from 'react';
import {
  TouchableOpacity,
  Text,
  StyleSheet,
  ActivityIndicator,
  ViewStyle,
  TextStyle,
} from 'react-native';
import { theme } from '../../theme';

interface ButtonProps {
  title?: string;
  onPress: () => void; // 点击触发事件相关函数
  variant?: 'primary' | 'secondary' | 'outline' | 'text'; // 按钮样式相关
  size?: 'small' | 'medium' | 'large'; //按钮大小相关
  loading?: boolean; // 按钮加载状态相关
  disabled?: boolean; // 按钮禁用状态相关
  style?: ViewStyle; // 按钮样式相关
  textStyle?: TextStyle; // 按钮文本样式相关
  icon?: React.ReactNode; // 按钮图标相关
  children?: React.ReactNode; // 按钮内容相关
}

export default function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'medium',
  loading = false,
  disabled = false,
  style,
  textStyle,
  icon,
  children,
}: ButtonProps) {
  const buttonStyle = [
    styles.base,
    styles[variant],
    styles[`size_${size}`],
    disabled && styles.disabled,
    style,
  ];

  const textStyles = [
    styles.textContent,
    styles[`text_${variant}`],
    styles[`textSize_${size}`],
    textStyle,
  ];

  const renderContent = () => {
    if (loading) {
      return (
        <ActivityIndicator
          color={variant === 'outline' || variant === 'text' ? theme.colors.primary : '#FFFFFF'}
        />
      );
    }

    if (children) {
      return children;
    }

    if (icon && !title) {
      return icon;
    }

    if (icon && title) {
      return (
        <>
          {icon}
          <Text style={[textStyles, { marginLeft: theme.spacing.xs }]}>{title}</Text>
        </>
      );
    }

    return <Text style={textStyles}>{title}</Text>;
  };

  return (
    <TouchableOpacity
      style={buttonStyle}
      onPress={onPress}
      disabled={disabled || loading}
      activeOpacity={0.7}>
      {renderContent()}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  base: {
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: theme.colors.primary,
  },
  secondary: {
    backgroundColor: theme.colors.secondary,
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.primary,
  },
  text: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  size_small: {
    paddingVertical: theme.spacing.xs,
    paddingHorizontal: theme.spacing.md,
  },
  size_medium: {
    paddingVertical: theme.spacing.sm,
    paddingHorizontal: theme.spacing.lg,
  },
  size_large: {
    paddingVertical: theme.spacing.md,
    paddingHorizontal: theme.spacing.xl,
  },
  textContent: {
    fontWeight: '600',
  },
  text_primary: {
    color: '#FFFFFF',
  },
  text_secondary: {
    color: '#FFFFFF',
  },
  text_outline: {
    color: theme.colors.primary,
  },
  text_text: {
    color: theme.colors.text,
  },
  textSize_small: {
    fontSize: theme.fontSize.sm,
  },
  textSize_medium: {
    fontSize: theme.fontSize.md,
  },
  textSize_large: {
    fontSize: theme.fontSize.lg,
  },
});
