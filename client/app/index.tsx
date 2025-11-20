// 초기 코드 
// import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
// import { useAuth } from '../contexts/useAuth';
// import { useRouter } from 'expo-router';

// export default function Index() {
//   console.log('index.tsx 렌더링됨');

//   const { user } = useAuth();
//   // const auth = useAuth(); // 전체 context 객체로 받아옴
//   const router = useRouter();

//   return (
//     <View style={styles.container}>
//       <View style={[styles.circle, styles.circle1]} />
//       <View style={[styles.circle, styles.circle2]} />
//       <View style={[styles.filledCircle, styles.filled1]} />
//       <View style={[styles.filledCircle, styles.filled2]} />

//       <Text style={styles.title}>
//         ACA에 방문해주셔서{'\n'}감사합니다!
//       </Text>

//       <TouchableOpacity
//         style={styles.loginButton}
//         onPress={() => router.push('/login')}
//       >
//         <Text style={styles.loginButtonText}>ACA로 입장하기</Text>
//         <Text style={styles.loginSubText}>로그인/회원가입</Text>
//       </TouchableOpacity>
//     </View>
//   );
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     backgroundColor: '#fff',
//     position: 'relative',
//     justifyContent: 'center',
//     alignItems: 'center',
//     paddingHorizontal: 24,
//   },
//   title: {
//     fontSize: 20,
//     fontWeight: 'bold',
//     textAlign: 'left',
//     alignSelf: 'flex-start',
//     marginBottom: 100,
//   },
//   loginButton: {
//     backgroundColor: '#fff',
//     borderRadius: 16,
//     borderWidth: 1,
//     borderColor: '#ddd',
//     paddingVertical: 16,
//     paddingHorizontal: 32,
//     alignItems: 'center',
//     position: 'absolute',
//     bottom: 100,
//   },
//   loginButtonText: {
//     fontSize: 16,
//     fontWeight: 'bold',
//     color: '#000',
//   },
//   loginSubText: {
//     fontSize: 10,
//     color: '#555',
//     marginTop: 4,
//   },
//   circle: {
//     position: 'absolute',
//     borderRadius: 999,
//     borderWidth: 1,
//     borderColor: '#ccc',
//   },
//   circle1: {
//     width: 300,
//     height: 300,
//     top: -60,
//     left: -100,
//   },
//   circle2: {
//     width: 250,
//     height: 250,
//     bottom: 20,
//     right: -80,
//   },
//   filledCircle: {
//     position: 'absolute',
//     backgroundColor: '#DEE6F1',
//     borderRadius: 999,
//   },
//   filled1: {
//     width: 40,
//     height: 40,
//     top: 80,
//     right: 40,
//   },
//   filled2: {
//     width: 25,
//     height: 25,
//     bottom: 90,
//     left: 60,
//   },
// });

import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useAuth } from '../contexts/useAuth';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';

export default function Index() {
  console.log('index.tsx 렌더링됨');
  
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  // 자동로그인 체크 중인지 표시
  const [checkingAuth, setCheckingAuth] = useState(true);

  // AuthProvider에서 토큰 로딩이 끝날 때까지 대기
  useEffect(() => {
    const timer = setTimeout(() => {
      setCheckingAuth(false);
    }, 300);

    return () => clearTimeout(timer);
  }, []);

  // checkingAuth 끝난 후에만 redirect 결정
  useEffect(() => {
    if (!checkingAuth && isAuthenticated) {
      router.replace("/(tabs)/home");
    }
  }, [checkingAuth, isAuthenticated]);

  // 로딩 중이면 UI 비표시
  if (checkingAuth) {
    return <View style={{ flex: 1, backgroundColor: '#fff' }} />;
  }

  return (
    <View style={styles.container}>
      <View style={[styles.circle, styles.circle1]} />
      <View style={[styles.circle, styles.circle2]} />
      <View style={[styles.filledCircle, styles.filled1]} />
      <View style={[styles.filledCircle, styles.filled2]} />

      <Text style={styles.title}>
        ACA에 방문해주셔서{'\n'}감사합니다!
      </Text>

      <TouchableOpacity
        style={styles.loginButton}
        onPress={() => router.push('/login')}
      >
        <Text style={styles.loginButtonText}>ACA로 입장하기</Text>
        <Text style={styles.loginSubText}>로그인/회원가입</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'left',
    alignSelf: 'flex-start',
    marginBottom: 100,
  },
  loginButton: {
    backgroundColor: '#fff',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    position: 'absolute',
    bottom: 100,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#000',
  },
  loginSubText: {
    fontSize: 10,
    color: '#555',
    marginTop: 4,
  },
  circle: {
    position: 'absolute',
    borderRadius: 999,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  circle1: {
    width: 300,
    height: 300,
    top: -60,
    left: -100,
  },
  circle2: {
    width: 250,
    height: 250,
    bottom: 20,
    right: -80,
  },
  filledCircle: {
    position: 'absolute',
    backgroundColor: '#DEE6F1',
    borderRadius: 999,
  },
  filled1: {
    width: 40,
    height: 40,
    top: 80,
    right: 40,
  },
  filled2: {
    width: 25,
    height: 25,
    bottom: 90,
    left: 60,
  },
});
