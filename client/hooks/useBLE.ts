import { useState, useEffect } from "react";
import { BleManager, Device } from "react-native-ble-plx";
import { PermissionsAndroid, Platform } from "react-native";

const bleManager = new BleManager();

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

export function useBLE() {
  const [devices, setDevices] = useState<Device[]>([]);
  const [connectedDevice, setConnectedDevice] = useState<Device | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [bleConnected, setBleConnected] = useState(false);

  useEffect(() => {
    requestPermissions();
    return () => {
      bleManager.destroy();
    };
  }, []);

  // RSSI 임계값 (너무 약한 신호 제외)
  const RSSI_THRESHOLD = -70;

  // 스캔 시작
  const startScan = () => {
    if (isScanning) return;
    setDevices([]);
    setIsScanning(true);

    console.log("BLE 스캔 시작");

    bleManager.startDeviceScan(null, null, (error, device) => {
      if (error) {
        console.error("BLE Scan error:", error);
        setIsScanning(false);
        return;
      }

      // RSSI 필터링 + 실시간 갱신
      if (device && device.name && device.rssi !== null && device.rssi > RSSI_THRESHOLD) {
        setDevices((prev) => {
          const exists = prev.find((d) => d.id === device.id);
          if (exists) {
            return prev.map((d) => (d.id === device.id ? device : d));
          }
          return [...prev, device];
        });
      }
    });
  };

  // 스캔 중지
  const stopScan = () => {
    if (isScanning) {
      bleManager.stopDeviceScan();
      setIsScanning(false);
      console.log("BLE 스캔 중지");
    }
  };

  // 기기 연결
  const connectToDevice = async (deviceId: string) => {
    try {
      const device = await bleManager.connectToDevice(deviceId);
      await device.discoverAllServicesAndCharacteristics();
      setConnectedDevice(device);
      setBleConnected(true);
      console.log("BLE 연결 성공:", device.name);
      return device;
    } catch (e) {
      console.error("BLE Connection error:", e);
    }
  };

  // 연결 해제
  const disconnectFromDevice = async () => {
    try {
      if (connectedDevice) {
        await bleManager.cancelDeviceConnection(connectedDevice.id);
        setConnectedDevice(null);
        setBleConnected(false);
        console.log("BLE 연결 해제");
      }
    } catch (e) {
      console.error("BLE disconnect error:", e);
    }
  };

  // 알림 구독
  const subscribeToCharacteristic = async (
    serviceUUID: string,
    characteristicUUID: string,
    onUpdate: (value: string | null) => void
  ) => {
    if (!connectedDevice) return;

    connectedDevice.monitorCharacteristicForService(
      serviceUUID,
      characteristicUUID,
      (error, characteristic) => {
        if (error) {
          console.error("Notification error:", error);
          return;
        }
        const value = characteristic?.value
          ? Buffer.from(characteristic.value, "base64").toString("utf-8")
          : null;
        onUpdate(value);
      }
    );
  };

  // 데이터 쓰기
  const writeToCharacteristic = async (
    serviceUUID: string,
    characteristicUUID: string,
    data: string
  ) => {
    if (!connectedDevice) return;

    const base64Data = Buffer.from(data, "utf-8").toString("base64");
    await connectedDevice.writeCharacteristicWithResponseForService(
      serviceUUID,
      characteristicUUID,
      base64Data
    );
  };

  return {
    devices,
    isScanning,
    connectedDevice,
    bleConnected,
    startScan,
    stopScan,
    connectToDevice,
    disconnectFromDevice,
    subscribeToCharacteristic,
    writeToCharacteristic,
  };
}
