import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Eye, EyeOff } from 'lucide-react-native';
import BASE_URL, { API_ENDPOINTS } from '../../common/api/config.js';

export function SignUpScreen() {
  const navigation = useNavigation();

  const [nickName, setNickName] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');

  const [nickNameError, setNickNameError] = useState('');
  const [emailError, setEmailError] = useState('');
  const [passwordError, setPasswordError] = useState('');
  const [confirmPasswordError, setConfirmPasswordError] = useState('');
  const [generalError, setGeneralError] = useState('');

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    let isValid = true;

    setNickNameError('');
    setEmailError('');
    setPasswordError('');
    setConfirmPasswordError('');
    setGeneralError('');

    const trimmedNickName = nickName.trim();
    const trimmedEmail = email.trim();
    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (!trimmedNickName) {
      setNickNameError('닉네임을 입력해주세요.');
      isValid = false;
    }

    if (!trimmedEmail) {
      setEmailError('이메일을 입력해주세요.');
      isValid = false;
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(trimmedEmail)) {
        setEmailError('올바른 이메일 형식을 입력해주세요.');
        isValid = false;
      }
    }

    if (!trimmedPassword) {
      setPasswordError('비밀번호를 입력해주세요.');
      isValid = false;
    } else if (trimmedPassword.length < 8) {
      setPasswordError('비밀번호는 8자 이상이어야 합니다.');
      isValid = false;
    }

    if (!trimmedConfirmPassword) {
      setConfirmPasswordError('비밀번호 확인을 입력해주세요.');
      isValid = false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError('비밀번호가 일치하지 않습니다.');
      isValid = false;
    }

    return isValid;
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    const isValid = validateForm();
    if (!isValid) return;

    const payload = {
      email: email.trim(),
      password: password.trim(),
      nick_name: nickName.trim(),
      provider: 'local',
    };

    const requestUrl = `${BASE_URL}${API_ENDPOINTS.AUTH.SIGNUP}`;

    console.log('회원가입 요청 URL:', requestUrl);
    console.log('회원가입 요청:', payload);

    try {
      setIsSubmitting(true);
      setGeneralError('');
      setNickNameError('');
      setEmailError('');

      const response = await fetch(requestUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json().catch(() => ({}));

      console.log('회원가입 응답 status:', response.status);
      console.log('회원가입 응답 body:', data);

      if (response.ok) {
        setNickName('');
        setPassword('');
        setConfirmPassword('');
        setEmail('');

        setNickNameError('');
        setEmailError('');
        setPasswordError('');
        setConfirmPasswordError('');
        setGeneralError('');

        navigation.navigate('Login');
        return;
      }

      if (response.status === 400 && data?.detail === '이미 사용 중인 이메일입니다.') {
        setEmailError('이미 사용 중인 이메일입니다.');
        return;
      }

      if (response.status === 400 && data?.detail === '이미 사용 중인 닉네임입니다.') {
        setNickNameError('이미 사용 중인 닉네임입니다.');
        return;
      }

      setGeneralError(data?.detail || '회원가입 중 오류가 발생했습니다.');
    } catch (error) {
      console.error('회원가입 에러:', error);
      setGeneralError('서버에 연결할 수 없습니다.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={styles.scrollInner}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.card}>
            <Text style={styles.title}>회원가입</Text>
            <Text style={styles.subtitle}>환영합니다! 회원 정보를 입력해주세요</Text>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>닉네임</Text>
              <TextInput
                style={[styles.input, nickNameError ? styles.inputError : null]}
                value={nickName}
                onChangeText={(text) => {
                  setNickName(text);
                  if (nickNameError) setNickNameError('');
                }}
                placeholder="닉네임을 입력하세요 (중복 불가)"
                placeholderTextColor="#A98BB5"
                autoCapitalize="none"
              />
              {nickNameError ? <Text style={styles.errorText}>{nickNameError}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>비밀번호</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[styles.passwordInput, passwordError ? styles.inputError : null]}
                  value={password}
                  onChangeText={(text) => {
                    setPassword(text);
                    if (passwordError) setPasswordError('');
                    if (confirmPasswordError && confirmPassword === text) {
                      setConfirmPasswordError('');
                    }
                  }}
                  secureTextEntry={!showPassword}
                  placeholder="비밀번호를 입력하세요"
                  placeholderTextColor="#A98BB5"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowPassword((prev) => !prev)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {showPassword ? (
                    <EyeOff size={20} color="#B8A3C9" />
                  ) : (
                    <Eye size={20} color="#B8A3C9" />
                  )}
                </TouchableOpacity>
              </View>
              {passwordError ? <Text style={styles.errorText}>{passwordError}</Text> : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>비밀번호 확인</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[styles.passwordInput, confirmPasswordError ? styles.inputError : null]}
                  value={confirmPassword}
                  onChangeText={(text) => {
                    setConfirmPassword(text);
                    if (confirmPasswordError) setConfirmPasswordError('');
                  }}
                  secureTextEntry={!showConfirmPassword}
                  placeholder="비밀번호를 다시 입력하세요"
                  placeholderTextColor="#A98BB5"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword((prev) => !prev)}
                  activeOpacity={0.7}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color="#B8A3C9" />
                  ) : (
                    <Eye size={20} color="#B8A3C9" />
                  )}
                </TouchableOpacity>
              </View>
              {confirmPasswordError ? (
                <Text style={styles.errorText}>{confirmPasswordError}</Text>
              ) : null}
            </View>

            <View style={styles.inputGroup}>
              <Text style={styles.label}>이메일</Text>
              <TextInput
                style={[styles.input, emailError ? styles.inputError : null]}
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (emailError) setEmailError('');
                }}
                placeholder="이메일을 입력하세요 (중복 불가)"
                placeholderTextColor="#A98BB5"
                keyboardType="email-address"
                autoCapitalize="none"
              />
              {emailError ? <Text style={styles.errorText}>{emailError}</Text> : null}
            </View>

            {generalError ? (
              <Text style={styles.generalErrorText}>{generalError}</Text>
            ) : null}

            <TouchableOpacity
              style={[styles.submitButton, isSubmitting && styles.disabledButton]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              <Text style={styles.submitButtonText}>
                {isSubmitting ? '가입 중...' : '회원가입'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={() => navigation.navigate('Login')}
              style={styles.footer}
            >
              <Text style={styles.footerText}>
                이미 계정이 있으신가요? <Text style={styles.loginLink}>로그인</Text>
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  scrollInner: { padding: 20, justifyContent: 'center' },
  card: {
    backgroundColor: '#FFF5F7',
    borderRadius: 30,
    padding: 25,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  title: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#8B6F9C',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 13,
    color: '#A98BB5',
    textAlign: 'center',
    marginBottom: 25,
    marginTop: 5,
  },
  inputGroup: { marginBottom: 15 },
  label: {
    fontSize: 14,
    color: '#8B6F9C',
    marginBottom: 6,
    fontWeight: '600',
  },
  input: {
    backgroundColor: 'white',
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 15,
    borderWidth: 1,
    borderColor: '#E5D4ED',
    color: '#333',
  },
  passwordWrapper: {
    position: 'relative',
    justifyContent: 'center',
  },
  passwordInput: {
    backgroundColor: 'white',
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingRight: 52,
    borderWidth: 1,
    borderColor: '#E5D4ED',
    color: '#333',
  },
  eyeButton: {
    position: 'absolute',
    right: 14,
    height: 48,
    width: 36,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  inputError: {
    borderColor: '#F5A3A3',
  },
  errorText: {
    fontSize: 12,
    color: '#F5A3A3',
    marginTop: 4,
    marginLeft: 2,
  },
  generalErrorText: {
    fontSize: 12,
    color: '#F5A3A3',
    marginTop: 4,
    marginBottom: 6,
    marginLeft: 2,
  },
  submitButton: {
    backgroundColor: '#B8A3C9',
    height: 52,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  disabledButton: {
    backgroundColor: '#D4C4DD',
  },
  submitButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  footer: {
    marginTop: 25,
    alignItems: 'center',
  },
  footerText: {
    color: '#A98BB5',
    fontSize: 14,
  },
  loginLink: {
    color: '#8B6F9C',
    fontWeight: 'bold',
    textDecorationLine: 'underline',
  },
});

export default SignUpScreen;