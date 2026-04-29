/**
 * 错误提示弹窗组件
 * 用于显示错误信息和操作按钮
 */
import React from 'react';
import { View, Text, TouchableOpacity, Modal, StyleSheet } from 'react-native';

/**
 * 错误弹窗属性接口
 */
interface ErrorModalProps {
  /** 是否显示弹窗 */
  visible: boolean;
  /** 标题 */
  title: string;
  /** 提示消息 */
  message: string;
  /** 主操作按钮 */
  primaryAction?: { label: string; onPress: () => void };
  /** 次要操作按钮 */
  secondaryAction?: { label: string; onPress: () => void };
  /** 是否可点击背景关闭 */
  dismissable?: boolean;
  /** 关闭回调 */
  onDismiss?: () => void;
}

/**
 * 错误提示弹窗组件
 */
export default function ErrorModal({
  visible,
  title,
  message,
  primaryAction,
  secondaryAction,
  dismissable = true,
  onDismiss,
}: ErrorModalProps) {
  /**
   * 处理背景点击
   */
  const handleBackdropPress = () => {
    if (dismissable && onDismiss) {
      onDismiss();
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleBackdropPress}
    >
      <TouchableOpacity
        style={styles.backdrop}
        activeOpacity={1}
        onPress={handleBackdropPress}
      >
        <View style={styles.container} onStartShouldSetResponder={() => true}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          <View style={styles.actions}>
            {/* 次要按钮 */}
            {secondaryAction && (
              <TouchableOpacity
                style={[styles.button, styles.secondaryButton]}
                onPress={secondaryAction.onPress}
              >
                <Text style={styles.secondaryButtonText}>
                  {secondaryAction.label}
                </Text>
              </TouchableOpacity>
            )}

            {/* 主按钮 */}
            {primaryAction && (
              <TouchableOpacity
                style={[styles.button, styles.primaryButton]}
                onPress={primaryAction.onPress}
              >
                <Text style={styles.primaryButtonText}>
                  {primaryAction.label}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </TouchableOpacity>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  container: {
    backgroundColor: '#1e1e1e',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 320,
  },
  title: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    color: '#aaa',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    marginBottom: 24,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  primaryButton: {
    backgroundColor: '#2563eb',
  },
  primaryButtonText: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '500',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#444',
  },
  secondaryButtonText: {
    color: '#aaa',
    fontSize: 15,
    fontWeight: '500',
  },
});
