/**
 * 通知权限请求组件
 */
import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Linking,
  Platform,
  Modal,
  Pressable,
} from 'react-native';
import Icon from 'react-native-vector-icons/MaterialIcons';
import NotificationService from '../../services/NotificationService';
import { colors } from '../../theme/colors';

interface NotificationPermissionProps {
  onPermissionGranted?: () => void;
  onPermissionDenied?: () => void;
}

const NotificationPermission: React.FC<NotificationPermissionProps> = ({
  onPermissionGranted,
  onPermissionDenied,
}) => {
  const [hasPermission, setHasPermission] = useState<boolean>(false);
  const [showPrompt, setShowPrompt] = useState<boolean>(false);

  useEffect(() => {
    checkPermission();
  }, []);

  /**
   * 检查通知权限状态
   */
  const checkPermission = async (): Promise<void> => {
    try {
      const granted = await NotificationService.checkPermission();
      setHasPermission(granted);
      setShowPrompt(!granted);

      if (granted && onPermissionGranted) {
        onPermissionGranted();
      } else if (!granted && onPermissionDenied) {
        onPermissionDenied();
      }
    } catch (error) {
      console.error('Failed to check permission:', error);
    }
  };

  /**
   * 请求通知权限
   */
  const requestPermission = async (): Promise<void> => {
    try {
      const granted = await NotificationService.requestPermission();
      setHasPermission(granted);
      setShowPrompt(!granted);

      if (granted && onPermissionGranted) {
        onPermissionGranted();
      } else if (!granted && onPermissionDenied) {
        onPermissionDenied();
      }
    } catch (error) {
      console.error('Failed to request permission:', error);
    }
  };

  /**
   * 打开系统设置页面
   */
  const openSettings = (): void => {
    if (Platform.OS === 'ios') {
      Linking.openURL('app-settings:');
    } else {
      Linking.openSettings();
    }
  };

  // 已授权，不显示提示
  if (hasPermission) {
    return null;
  }

  // 未授权，显示提示
  if (!showPrompt) {
    return null;
  }

  return (
    <Modal
      visible={showPrompt}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={() => setShowPrompt(false)}>
      <Pressable 
        style={[styles.backdrop, styles.androidBackdrop]}
        onPress={() => setShowPrompt(false)}
      />
      
      <View style={styles.centeredView}>
        <View style={styles.container}>
          <View style={styles.iconContainer}>
            <Icon name="notifications-off" size={48} color={colors.warning} />
          </View>

          <Text style={styles.title}>开启通知权限</Text>
          <Text style={styles.message}>
            为了及时提醒您的日程安排，请允许应用发送通知
          </Text>

          <TouchableOpacity style={styles.primaryButton} onPress={requestPermission}>
            <Text style={styles.primaryButtonText}>允许通知</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={openSettings}>
            <Text style={styles.secondaryButtonText}>前往设置</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.dismissButton}
            onPress={() => setShowPrompt(false)}>
            <Text style={styles.dismissButtonText}>稍后再说</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  androidBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  container: {
    backgroundColor: colors.background,
    padding: 32,
    borderRadius: 20,
    alignItems: 'center',
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: colors.text,
    marginBottom: 8,
  },
  message: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  secondaryButton: {
    backgroundColor: colors.surface,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 8,
    width: '100%',
    alignItems: 'center',
    marginBottom: 12,
  },
  secondaryButtonText: {
    color: colors.primary,
    fontSize: 16,
    fontWeight: '500',
  },
  dismissButton: {
    paddingVertical: 8,
  },
  dismissButtonText: {
    color: colors.textSecondary,
    fontSize: 14,
  },
});

export default NotificationPermission;
