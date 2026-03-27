import React, { useState } from 'react';
import { 
  View, 
  Text, 
  TextInput, 
  TouchableOpacity, 
  StyleSheet, 
  KeyboardAvoidingView, 
  Platform,
  Alert 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Eye, EyeOff, LogIn } from 'lucide-react-native'; // Native용 아이콘 사용

export function LoginScreen() {
  const navigation = useNavigation();
  
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = () => {
    if (!userId || !password) {
      Alert.alert('알림', '아이디와 비밀번호를 입력해주세요.');
      return;
    }
    console.log('로그인 시도:', { userId, password });
    goToHome();
  };

  const handleKakaoLogin = () => console.log('카카오 로그인');
  const handleNaverLogin = () => console.log('네이버 로그인');
  const goToSignup = () => navigation.navigate('SignUp');
  const goToHome = () => navigation.navigate('Home'); // Stack Navigator의 name과 일치해야 함

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <View style={styles.card}>
          {/* 로고 영역 */}
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <LogIn size={32} color="white" />
            </View>
            <Text style={styles.title}>로그인</Text>
            <Text style={styles.subtitle}>다시 만나서 반갑습니다!</Text>
          </View>

          {/* 입력 폼 */}
          <View style={styles.form}>
            <Text style={styles.label}>아이디</Text>
            <TextInput
              style={styles.input}
              value={userId}
              onChangeText={setUserId}
              placeholder="아이디를 입력하세요"
              placeholderTextColor="#A98BB5"
              autoCapitalize="none"
            />

            <Text style={[styles.label, { marginTop: 15 }]}>비밀번호</Text>
            <View style={styles.passwordContainer}>
              <TextInput
                style={[styles.input, { flex: 1, marginBottom: 0 }]}
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
                placeholder="비밀번호를 입력하세요"
                placeholderTextColor="#A98BB5"
              />
              <TouchableOpacity 
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                {showPassword ? <EyeOff size={20} color="#B8A3C9" /> : <Eye size={20} color="#B8A3C9" />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.findButton}>
              <Text style={styles.findText}>아이디 · 비밀번호 찾기</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.loginButton} onPress={handleSubmit}>
              <Text style={styles.loginButtonText}>로그인</Text>
            </TouchableOpacity>
          </View>

          {/* <View style={styles.dividerContainer}>
            <View style={styles.line} />
            <Text style={styles.dividerText}>또는</Text>
            <View style={styles.line} />
          </View>

          <View style={styles.socialButtons}>
            <TouchableOpacity 
              style={[styles.socialButton, { backgroundColor: '#FEE500' }]} 
              onPress={handleKakaoLogin}
            >
              <Text style={[styles.socialText, { color: '#3C1E1E' }]}>카카오로 로그인</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.socialButton, { backgroundColor: '#03C75A' }]} 
              onPress={handleNaverLogin}
            >
              <Text style={[styles.socialText, { color: 'white' }]}>네이버로 로그인</Text>
            </TouchableOpacity>
          </View> */}

          <View style={styles.footer}>
            <Text style={styles.footerText}>아직 회원이 아니신가요? </Text>
            <TouchableOpacity onPress={goToSignup}>
              <Text style={styles.signupText}>회원가입</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  inner: { flex: 1, justifyContent: 'center', padding: 20 },
  card: {
    backgroundColor: '#FFF5F7',
    borderRadius: 30,
    padding: 25,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  header: { alignItems: 'center', marginBottom: 30 },
  logoCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#B8A3C9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: { fontSize: 28, fontWeight: 'bold', color: '#8B6F9C' },
  subtitle: { fontSize: 14, color: '#A98BB5', marginTop: 5 },
  form: { width: '100%' },
  label: { fontSize: 14, color: '#8B6F9C', marginBottom: 8, fontWeight: '600' },
  input: {
    backgroundColor: 'white',
    height: 50,
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E5D4ED',
    fontSize: 14,
    color: '#333',
  },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', position: 'relative' },
  eyeIcon: { position: 'absolute', right: 15 },
  findButton: { alignSelf: 'flex-end', marginTop: 10, marginBottom: 20 },
  findText: { fontSize: 12, color: '#A98BB5' },
  loginButton: {
    backgroundColor: '#B8A3C9',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loginButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  dividerContainer: { flexDirection: 'row', alignItems: 'center', marginVertical: 25 },
  line: { flex: 1, height: 1, backgroundColor: '#E5D4ED' },
  dividerText: { marginHorizontal: 10, color: '#A98BB5', fontSize: 13 },
  socialButtons: { gap: 12 },
  socialButton: {
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  socialText: { fontSize: 15, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
  footerText: { color: '#A98BB5' },
  signupText: { color: '#8B6F9C', fontWeight: 'bold', textDecorationLine: 'underline' },
});

export default LoginScreen;