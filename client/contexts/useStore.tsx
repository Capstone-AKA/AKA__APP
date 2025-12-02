import React, { createContext, useContext, useState, ReactNode, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface StoreContextType {
  storeId: number | null;
  cartNumber: number | null;
  setStoreId: (id: number | null) => Promise<void>;
  setCartNumber: (num: number | null) => Promise<void>;
}

const StoreContext = createContext<StoreContextType | undefined>(undefined);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [storeId, setStoreIdState] = useState<number | null>(null);
  const [cartNumber, setCartNumberState] = useState<number | null>(null);

  // 🔥 앱 시작할 때 저장된 값 불러오기
  useEffect(() => {
    (async () => {
      const storedCart = await AsyncStorage.getItem("cartNumber");
      const storedStore = await AsyncStorage.getItem("storeId");

      if (storedCart) setCartNumberState(Number(storedCart));
      if (storedStore) setStoreIdState(Number(storedStore));
    })();
  }, []);

  // 🔥 setter + AsyncStorage 저장
  const setStoreId = async (id: number | null) => {
    setStoreIdState(id);
    if (id === null) await AsyncStorage.removeItem("storeId");
    else await AsyncStorage.setItem("storeId", String(id));
  };

  const setCartNumber = async (num: number | null) => {
    setCartNumberState(num);
    if (num === null) await AsyncStorage.removeItem("cartNumber");
    else await AsyncStorage.setItem("cartNumber", String(num));
  };

  return (
    <StoreContext.Provider value={{ storeId, cartNumber, setStoreId, setCartNumber }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
