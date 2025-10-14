import { Slot } from 'expo-router';
import { AuthProvider } from '../contexts/useAuth';
import { StoreProvider } from '../contexts/useStore';

export default function Layout() {
  console.log('Root Layout 적용됨');
  return (
    <AuthProvider>
      <StoreProvider>
        <Slot />  
      </StoreProvider>
    </AuthProvider>
  );
}
