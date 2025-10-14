import React, { createContext, useContext, useState, ReactNode } from "react";

interface StoreContextType {
  storeId: number | null;            // 매장 ID (DB int 컬럼)
  cartNumber: number | null;         // 카트 번호 (DB int 컬럼)
  setStoreId: (id: number | null) => void;
  setCartNumber: (num: number | null) => void;
}

// React Context 생성
const StoreContext = createContext<StoreContextType | undefined>(undefined);

// 전역 상태 제공
export function StoreProvider({ children }: { children: ReactNode }) {
  const [storeId, setStoreId] = useState<number | null>(null);      // INT 매핑
  const [cartNumber, setCartNumber] = useState<number | null>(null); // INT 매핑

  return (
    <StoreContext.Provider value={{ storeId, cartNumber, setStoreId, setCartNumber }}>
      {children}
    </StoreContext.Provider>
  );
}

// 커스텀 훅
export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside StoreProvider");
  return ctx;
}
