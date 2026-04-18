import React from 'react';
import { StyleSheet, View, Modal, TouchableOpacity, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { FontAwesome5 } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

type ModalType = 'success' | 'error' | 'warning' | 'info';

interface AppModalProps {
  visible: boolean;
  type?: ModalType;
  title: string;
  message: string;
  onClose: () => void;
  /** Optional confirm action — if provided, "OK" becomes a cancel and this becomes the primary action */
  confirmAction?: {
    label: string;
    onPress: () => void;
    destructive?: boolean;
  };
}

const MODAL_CONFIG: Record<ModalType, { icon: string; color: string; bgColor: string }> = {
  success: { icon: 'check-circle', color: '#10b981', bgColor: '#ecfdf5' },
  error:   { icon: 'times-circle', color: '#ef4444', bgColor: '#fef2f2' },
  warning: { icon: 'exclamation-triangle', color: '#f59e0b', bgColor: '#fffbeb' },
  info:    { icon: 'info-circle', color: '#8b5cf6', bgColor: '#f5f3ff' },
};

export const AppModal: React.FC<AppModalProps> = ({
  visible,
  type = 'info',
  title,
  message,
  onClose,
  confirmAction,
}) => {
  const config = MODAL_CONFIG[type];

  return (
    <Modal transparent visible={visible} animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        {/* Modal Card */}
        <View style={styles.card}>
          {/* Icon Circle */}
          <View style={[styles.iconCircle, { backgroundColor: config.bgColor }]}>  
            <FontAwesome5 name={config.icon} size={32} color={config.color} />
          </View>

          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>

          {/* Buttons */}
          <View style={styles.buttonRow}>
            {confirmAction ? (
              <>
                {/* Cancel button */}
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onClose}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.buttonText, styles.cancelButtonText]}>Cancel</Text>
                </TouchableOpacity>

                {/* Confirm / Destructive button */}
                <TouchableOpacity
                  style={[
                    styles.button,
                    styles.primaryButton,
                    { backgroundColor: confirmAction.destructive ? '#ef4444' : config.color },
                  ]}
                  onPress={confirmAction.onPress}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.buttonText, styles.primaryButtonText]}>
                    {confirmAction.label}
                  </Text>
                </TouchableOpacity>
              </>
            ) : (
              /* Single OK button */
              <TouchableOpacity
                style={[styles.button, styles.primaryButton, { backgroundColor: config.color }]}
                onPress={onClose}
                activeOpacity={0.8}
              >
                <Text style={[styles.buttonText, styles.primaryButtonText]}>OK</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 30,
  },
  card: {
    width: width - 60,
    backgroundColor: '#fff',
    borderRadius: 28,
    paddingTop: 36,
    paddingBottom: 24,
    paddingHorizontal: 24,
    alignItems: 'center',
    elevation: 20,
    shadowColor: '#1e1b4b',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 24,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '900',
    color: '#1e1b4b',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButton: {
    elevation: 4,
    shadowColor: '#8b5cf6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  cancelButton: {
    backgroundColor: '#f1f5f9',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '800',
  },
  primaryButtonText: {
    color: '#fff',
  },
  cancelButtonText: {
    color: '#64748b',
  },
});
