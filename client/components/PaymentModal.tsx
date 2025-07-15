import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import Icon from 'react-native-vector-icons/Feather'; // 체크 아이콘
import AntIcon from 'react-native-vector-icons/AntDesign'; // X 아이콘

type PaymentModalProps = {
  visible: boolean;
  mode: 'confirm' | 'complete';
  onClose: () => void;
  onConfirm?: () => void;
  onViewReceipt?: () => void;
  onPaymentComplete?: () => void;
};

export default function PaymentModal({
  visible,
  mode,
  onClose,
  onConfirm,
  onViewReceipt,
}: PaymentModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {mode === 'confirm' ? (
            <>
              {/* ✅ 두 줄 제목 */}
              <Text style={styles.title}>{'결제를\n하시겠습니까?'}</Text>

              {/* ✅ 구분선 */}
              <View style={styles.separator} />

              {/* ✅ 버튼 */}
              <View style={styles.iconRow}>
                <TouchableOpacity onPress={onConfirm} style={styles.iconButton}>
                  <Icon name="check" size={24} color="green" />
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose} style={styles.iconButton}>
                  <AntIcon name="close" size={24} color="black" />
                </TouchableOpacity>
              </View>
            </>
          ) : (
            <>
              <Text style={styles.title}>결제가 완료되었습니다.</Text>
              <Text style={styles.subtitle}>영수증을 확인하시겠습니까?</Text>
              <View style={styles.separator} />
              <View style={styles.iconRow}>
                <TouchableOpacity onPress={onViewReceipt} style={styles.iconButton}>
                  <Icon name="check" size={24} color="green" />
                </TouchableOpacity>
                <TouchableOpacity onPress={onClose} style={styles.iconButton}>
                  <AntIcon name="close" size={24} color="black" />
                </TouchableOpacity>
              </View>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: '#00000099',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modal: {
    width: 300,
    height: 500,
    backgroundColor: '#fff',
    borderRadius: 16,
    paddingVertical: 32,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    fontSize: 30,
    fontWeight: 'bold',
    margin: 10,
    textAlign: 'left',
    alignSelf: 'flex-start',
    marginLeft: 16,     
    lineHeight: 40,
    marginBottom: 24,
  },
  subtitle: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  separator: {
    width: '90%',
    height: 1,
    // marginTop: 50,
    backgroundColor: '#E0E0E0',
    marginVertical: 24,
  },
  iconRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 200,
    width: '120%',
    paddingHorizontal: 16,
  },
  iconButton: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: '#BDBDBD',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
