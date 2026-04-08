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
import { Eye, EyeOff, LogIn } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import BASE_URL, { API_ENDPOINTS } from '../../common/api/config';

export function LoginScreen() {
  const navigation = useNavigation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (!email.trim() || !password.trim()) {
      Alert.alert('알림', '어이디와 비밀번호를 모두 입력해주세요.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      Alert.alert('로그인 실패' ,'회원가입 후 이용 해주세요.');
      return;
    }

    const requestUrl = `${BASE_URL}${API_ENDPOINTS.AUTH.LOGIN}`;
    const payload = {
      email: email.trim(),
      password: password.trim(),
    };

    try {
      setIsSubmitting(true);

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      // 1. 서버 응답 데이터 받기
      const data = await response.json().catch(() => ({}));

      if (response.ok) {
        // 2. 서버가 준 access_token이 있는지 확인하고 저장
        if (data.access_token) {
          // api_client.js에서 정의한 'userToken'이라는 이름으로 저장
          await AsyncStorage.setItem('userToken', data.access_token);
          
          // [추후 마이페이지 업데이트시 사용] 사용자 정보 저장
          if (data.user_info) {
            await AsyncStorage.setItem('userInfo', JSON.stringify(data.user_info));
          }
        }

        Alert.alert('성공', '로그인되었습니다.', [
          { text: '확인', onPress: () => navigation.navigate('Home') }
        ]);
      } else {
        // 서버가 보내준 에러 메시지 출력
        Alert.alert('로그인 실패', data.detail || '아이디 또는 비밀번호를 확인하십시오.');
      }
    } catch (error) {
      console.error('로그인 에러:', error);
      Alert.alert('네트워크 오류', '서버에 연결할 수 없습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const goToSignup = () => navigation.navigate('SignUp');

  return (
    <View style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inner}
      >
        <View style={styles.card}>
          <View style={styles.header}>
            <View style={styles.logoCircle}>
              <LogIn size={32} color="white" />
            </View>
            <Text style={styles.title}>로그인</Text>
            <Text style={styles.subtitle}>다시 만나서 반갑습니다!</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.label}>이메일</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="이메일을 입력하세요"
              placeholderTextColor="#A98BB5"
              autoCapitalize="none"
              keyboardType="email-address"
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
                autoCapitalize="none"
              />
              <TouchableOpacity
                onPress={() => setShowPassword(!showPassword)}
                style={styles.eyeIcon}
              >
                {showPassword
                  ? <EyeOff size={20} color="#B8A3C9" />
                  : <Eye size={20} color="#B8A3C9" />}
              </TouchableOpacity>
            </View>

            <TouchableOpacity style={styles.findButton}>
              <Text style={styles.findText}>아이디 · 비밀번호 찾기</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.loginButton, isSubmitting && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.loginButtonText}>
                {isSubmitting ? '로그인 중...' : '로그인'}
              </Text>
            </TouchableOpacity>
          </View>

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
  disabledButton: {
    backgroundColor: '#D4C4DD',
  },
  loginButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  footer: { flexDirection: 'row', justifyContent: 'center', marginTop: 25 },
  footerText: { color: '#A98BB5' },
  signupText: { color: '#8B6F9C', fontWeight: 'bold', textDecorationLine: 'underline' },
});

export default LoginScreen;