import { useState, useEffect } from "react";
import { Platform, PermissionsAndroid } from "react-native";

type Device = {
  id: string;
  name?: string | null;
  rssi?: number | null;
};

const ENTRY_DEVICE_NAME = "MART_IN";
const EXIT_DEVICE_NAME = "MART_OUT";

export function useBLE() {
  if (Platform.OS === "web") {
    console.warn("⚠️ BLE not supported on web");
    return {
      devices: {},
      isScanning: false,
      startScan: () => {},
      stopScan: () => {},
    };
  }

  const { BleManager } = require("react-native-ble-plx");
  const bleManager = new BleManager();

  const [devices, setDevices] = useState<{
    ENTRY?: Device;
    EXIT?: Device;
  }>({});
  const [isScanning, setIsScanning] = useState(false);

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
  }, []);

  const startScan = () => {
    if (isScanning) return;
    setIsScanning(true);

    console.log("📡 BLE 스캔 시작");

    bleManager.startDeviceScan(null, null, (error: any, device: Device) => {
      if (error) {
        console.error("BLE Scan error:", error);
        setIsScanning(false);
        return;
      }

      if (device?.name) {
        const name = device.name.toUpperCase();

        if (name.includes(ENTRY_DEVICE_NAME)) {
          setDevices((prev) => ({ ...prev, ENTRY: device }));
          console.log("🚪 ENTRY BLE 감지:", name, device.rssi);
        }

        if (name.includes(EXIT_DEVICE_NAME)) {
          setDevices((prev) => ({ ...prev, EXIT: device }));
          console.log("🚪 EXIT BLE 감지:", name, device.rssi);
        }
      }
    });
  };

  const stopScan = () => {
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