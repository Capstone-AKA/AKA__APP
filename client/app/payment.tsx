import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TextInput,
  SafeAreaView,
  Alert,
} from "react-native";
import { useAuth } from "../contexts/useAuth";
import BackButton from "../components/BackButton";
import api from "../api/api"; 

type Card = {
  id: number;
  cardNumber: string;
  cardName: string;
  cardType: string;
  expiry: string;
};

export default function PaymentMethodsScreen() {
  const { user } = useAuth();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(true);

  // 모달 관련 state
  const [modalVisible, setModalVisible] = useState(false);
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");

  // 카드 목록 불러오기
  const fetchCards = async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/cards");
      setCards(res.data);
    } catch (err) {
      console.error("카드 불러오기 실패:", err);
    } finally {
      setLoading(false);
    }
  };

  // 카드 삭제
  const handleDelete = async (cardId: number) => {
    try {
      await api.delete(`/api/cards/${cardId}`);
      setCards((prev) => prev.filter((c) => c.id !== cardId));
    } catch (err) {
      console.error("카드 삭제 실패:", err);
      Alert.alert("오류", "카드 삭제 중 문제가 발생했습니다.");
    }
  };

  // 새 카드 등록
  const handleConfirmAdd = async () => {
    // 입력값 제한
    if (cardNumber.length !== 16) {
      Alert.alert("오류", "카드 번호는 16자리여야 합니다.");
      return;
    }

    if (expiry.length !== 4) {
      Alert.alert("오류", "만료일은 4자리(MMYY)여야 합니다.");
      return;
    }

    if (!cardName) {
      Alert.alert("오류", "카드 이름을 입력하세요.");
      return;
    }

    try {
      const res = await api.post("/api/cards", {
        cardNumber,
        cardName,
        cardType: "CHECK",
        expiry,
      });

      setCards((prev) => [...prev, res.data]);
      setModalVisible(false);
      setCardName("");
      setCardNumber("");
      setExpiry("");

    } catch (err: any) {
      console.error("카드 추가 실패:", err.response?.data || err.message);
      Alert.alert("오류", err.response?.data?.message || "서버와 통신 중 문제가 발생했습니다.");
    }
  };

  useEffect(() => {
    fetchCards();
  }, []);

  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" color="#2ecc71" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.headerContainer}>
        <BackButton targetPath="/home" />
        <Text style={styles.headerTitle}>결제수단 관리</Text>
        <View style={styles.divider} />
      </SafeAreaView>

      <FlatList
        data={cards}
        keyExtractor={(item) => String(item.id)}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <View>
              <Text style={styles.cardType}>{item.cardName}</Text>
              <Text style={styles.cardNumber}>{item.cardNumber}</Text>
              <Text style={styles.cardExpiry}>만료일: {item.expiry}</Text>
            </View>
            <TouchableOpacity onPress={() => handleDelete(item.id)}>
              <Text style={styles.deleteText}>삭제</Text>
            </TouchableOpacity>
          </View>
        )}
        contentContainerStyle={styles.list}
        ListEmptyComponent={<Text>등록된 카드가 없습니다.</Text>}
      />

      {/* 새 카드 추가 버튼 */}
      <TouchableOpacity
        style={styles.addButton}
        onPress={() => setModalVisible(true)}
      >
        <Text style={styles.addButtonText}>+ 새 카드 추가하기</Text>
      </TouchableOpacity>

      {/* 모달 */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>새 카드 등록</Text>

            <TextInput
              style={styles.input}
              placeholder="카드 이름 (예: 삼성카드)"
              value={cardName}
              onChangeText={setCardName}
            />

            <TextInput
              style={styles.input}
              placeholder="카드 번호 (16자리)"
              value={cardNumber}
              onChangeText={(text) => {
                // 숫자만 허용 + 16자리 제한
                const onlyNumbers = text.replace(/[^0-9]/g, "");
                if (onlyNumbers.length <= 16) setCardNumber(onlyNumbers);
              }}
              keyboardType="numeric"
            />

            <TextInput
              style={styles.input}
              placeholder="만료일 (MM/YY)"
              value={expiry}
              onChangeText={(text) => {
                // 숫자만 허용 + 4자리 제한
                const onlyNumbers = text.replace(/[^0-9]/g, "");
                if (onlyNumbers.length <= 4) setExpiry(onlyNumbers);
              }}
              keyboardType="numeric"
            />

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={handleConfirmAdd}
            >
              <Text style={styles.confirmButtonText}>등록하기</Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>취소</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingTop: 0, backgroundColor: "#fff", padding: 20 },
  headerContainer: {
    backgroundColor: "#fff",
  },
  headerTitle: {
    fontSize: 25,
    fontWeight: "bold",
    marginLeft: 20,
    marginBottom: 15,
  },
  divider: {
    height: 1,
    backgroundColor: "#ddd",
    marginHorizontal: 20,
    marginBottom: 20,
  },
  list: { flexGrow: 1 },
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#ebf3ff",
    padding: 20,
    borderRadius: 12,
    marginBottom: 12,
    marginHorizontal: 20,
  },
  cardType: { fontSize: 16, fontWeight: "bold" },
  cardNumber: { fontSize: 14, color: "#555", marginTop: 4 },
  cardExpiry: { fontSize: 13, color: "#777", marginTop: 2 },
  deleteText: { color: "red", fontSize: 14 },
  addButton: {
    borderColor: "#2ecc71",
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 15,
    alignItems: "center",
    marginTop: 10,
  },
  addButtonText: {
    color: "#2ecc71ff",
    fontSize: 16,
    fontWeight: "bold",
  },
  modalOverlay: {
    marginTop: -50,
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "85%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 20,
    alignItems: "center",
  },
  modalTitle: { fontSize: 18, fontWeight: "bold", marginBottom: 15 },
  input: {
    width: "100%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 10,
  },
  confirmButton: {
    backgroundColor: "#DEE6F1",
    borderRadius: 8,
    padding: 12,
    marginTop: 10,
    width: "100%",
    alignItems: "center",
  },
  confirmButtonText: { color: "#373737ff", fontWeight: "bold" },
  cancelText: { color: "gray", marginTop: 10 },
});