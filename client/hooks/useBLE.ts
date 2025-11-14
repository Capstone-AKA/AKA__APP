import { useState, useEffect, useRef } from "react";
import { Platform, PermissionsAndroid } from "react-native";

// ✅ BLE 관련 타입을 위한 선언 (웹 환경에서도 오류 방지)
type Device = {
  id: string;
  name?: string | null;
  rssi?: number | null;
};

// ✅ 상수 정의 (입장/퇴장 비콘 이름)
const ENTRY_DEVICE_NAME = "MART_IN";
const EXIT_DEVICE_NAME = "MART_OUT";

// ✅ 메인 훅
export function useBLE() {
  // ✅ 웹에서는 BLE 비활성화
  if (Platform.OS === "web") {
    console.warn("⚠️ BLE is not supported on web. Returning dummy hooks.");
    return {
      devices: {} as { [key: string]: Device },
      isScanning: false,
      startScan: () => console.log("BLE not available on web."),
      stopScan: () => console.log("BLE not available on web."),
    };
  }

  // ✅ 모바일 환경만 BLE 모듈 import
  const { BleManager } = require("react-native-ble-plx");
  const bleManager = new BleManager();

  // ✅ 여러 BLE 기기를 이름 기준으로 관리
  const [devices, setDevices] = useState<{ [key: string]: Device }>({});
  const [isScanning, setIsScanning] = useState(false);
  const scanRef = useRef<NodeJS.Timeout | null>(null);

  // ✅ 안드로이드 권한 요청
  async function requestPermissions() {
    if (Platform.OS === "android") {
      await PermissionsAndroid.requestMultiple([
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_SCAN,
        PermissionsAndroid.PERMISSIONS.BLUETOOTH_CONNECT,
        PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
        PermissionsAndroid.PERMISSIONS.ACCESS_COARSE_LOCATION,
      ]);
    }
  }

  useEffect(() => {
    requestPermissions();

    return () => {
      stopScan();
      bleManager.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ 스캔 시작 (입장/퇴장 비콘 모두 탐색)
  const startScan = () => {
    if (isScanning) return;
    console.log("📡 BLE 스캔 시작");
    setIsScanning(true);

    bleManager.startDeviceScan(null, null, (error: any, device: Device) => {
      if (error) {
        console.error("BLE Scan error:", error);
        setIsScanning(false);
        return;
      }

      if (device && device.name) {
        const name = device.name.toUpperCase();
        if (name.includes(ENTRY_DEVICE_NAME) || name.includes(EXIT_DEVICE_NAME)) {
          setDevices((prev) => ({
            ...prev,
            [name]: device,
          }));
          console.log(`📍 감지됨: ${name} (RSSI: ${device.rssi})`);
        }
      }
    });

    // ✅ 스캔 주기적으로 재시작 (신호 갱신 유지)
    scanRef.current = setInterval(() => {
      bleManager.stopDeviceScan();
      bleManager.startDeviceScan(null, null, (error: any, device: Device) => {
        if (error) return;
        if (device?.name) {
          const name = device.name.toUpperCase();
          if (name.includes(ENTRY_DEVICE_NAME) || name.includes(EXIT_DEVICE_NAME)) {
            setDevices((prev) => ({
              ...prev,
              [name]: device,
            }));
          }
        }
      });
    }, 5000); // 5초마다 재시작
  };

  // ✅ 스캔 중지
  const stopScan = () => {
    if (scanRef.current) clearInterval(scanRef.current);
    bleManager.stopDeviceScan();
    setIsScanning(false);
    console.log("🛑 BLE 스캔 중지");
  };

  return {
    devices,
    isScanning,
    startScan,
    stopScan,
  };
}

export default useBLE;
