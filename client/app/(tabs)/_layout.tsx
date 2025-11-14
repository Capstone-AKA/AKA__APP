import { Tabs } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { Alert } from "react-native";
import { useStore } from "../../contexts/useStore"; // ✅ 전역 상태 (cartNumber) 가져오기

export default function TabLayout() {
  // ✅ 현재 전역 상태에서 cartNumber 가져오기
  const { cartNumber } = useStore();

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: "#22C55E",
        tabBarInactiveTintColor: "#111827",
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopLeftRadius: 16,
          borderTopRightRadius: 16,
          height: 64,
          paddingBottom: 8,
          paddingTop: 4,
          position: "absolute",
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "500",
        },
        // ✅ 아이콘 설정 + 흐림 효과
        tabBarIcon: ({ color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = "home-outline";

          if (route.name === "home") iconName = "home-outline";
          else if (route.name === "map") iconName = "storefront-outline";
          else if (route.name === "cart") iconName = "cart-outline";

          // ✅ cart 탭일 때 카트번호 없으면 아이콘 흐리게 처리
          const disabled = route.name === "cart" && !cartNumber;
          const tint = disabled ? "#9CA3AF" : color;

          return <Ionicons name={iconName} size={size ?? 24} color={tint} />;
        },
      })}
    >
      <Tabs.Screen name="home" options={{ title: "Home" }} />
      <Tabs.Screen name="map" options={{ title: "Map" }} />

      {/* ✅ Cart 탭 접근 제한 (카트번호 없을 때 막기) */}
      <Tabs.Screen
        name="cart"
        options={{ title: "Cart" }}
        listeners={{
          tabPress: (e) => {
            if (!cartNumber) {
              e.preventDefault(); // 🚫 탭 이동 막기
              Alert.alert("알림", "먼저 카트 번호를 등록해주세요!");
            }
          },
        }}
      />
    </Tabs>
  );
}
