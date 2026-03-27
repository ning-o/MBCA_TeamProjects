
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
  Alert 
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Eye, EyeOff, CheckCircle2, XCircle } from 'lucide-react-native';

export function SignUpScreen() {
  const navigation = useNavigation();
  
  const [userId, setUserId] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [email, setEmail] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isCheckingId, setIsCheckingId] = useState(false);
  const [idCheckResult, setIdCheckResult] = useState(null);

  // 아이디 중복 확인 시뮬레이션
  const handleCheckId = async () => {
    if (!userId) {
      Alert.alert('알림', '아이디를 입력해주세요.');
      return;
    }
    setIsCheckingId(true);
    // 실제 서버 API 호출 영역
    await new Promise(resolve => setTimeout(resolve, 600));
    setIdCheckResult(Math.random() > 0.5 ? 'available' : 'taken');
    setIsCheckingId(false);
  };

  const handleSubmit = () => {
    if (!userId || !password || !email) {
      Alert.alert('알림', '모든 정보를 입력해주세요.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
      return;
    }
    if (idCheckResult !== 'available') {
      Alert.alert('알림', '아이디 중복 확인을 해주세요.');
      return;
    }
    
    console.log('회원가입 요청:', { userId, password, email });
    Alert.alert('성공', '회원가입이 완료되었습니다!', [
      { text: '확인', onPress: () => navigation.navigate('Login') }
    ]);
  };

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollInner} showsVerticalScrollIndicator={false}>
          <View style={styles.card}>
            <Text style={styles.title}>회원가입</Text>
            <Text style={styles.subtitle}>환영합니다! 회원 정보를 입력해주세요</Text>

            {/* 아이디 입력 영역 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>아이디</Text>
              <View style={styles.row}>
                <View style={styles.flexInputWrapper}>
                  <TextInput
                    style={styles.input}
                    value={userId}
                    onChangeText={(text) => {
                      setUserId(text);
                      setIdCheckResult(null);
                    }}
                    placeholder="아이디를 입력하세요"
                    placeholderTextColor="#A98BB5"
                    autoCapitalize="none"
                  />
                  {idCheckResult && (
                    <View style={styles.statusIcon}>
                      {idCheckResult === 'available' ? 
                        <CheckCircle2 size={18} color="#7BC4A4" /> : 
                        <XCircle size={18} color="#F5A3A3" />
                      }
                    </View>
                  )}
                </View>
                <TouchableOpacity 
                  style={[styles.checkButton, (!userId || isCheckingId) && styles.disabledButton]} 
                  onPress={handleCheckId}
                  disabled={isCheckingId || !userId}
                >
                  <Text style={styles.checkButtonText}>{isCheckingId ? '확인중' : '중복 확인'}</Text>
                </TouchableOpacity>
              </View>
              {idCheckResult && (
                <Text style={[styles.helperText, { color: idCheckResult === 'available' ? '#7BC4A4' : '#F5A3A3' }]}>
                  {idCheckResult === 'available' ? '사용 가능한 아이디입니다.' : '이미 사용중인 아이디입니다.'}
                </Text>
              )}
            </View>

            {/* 비밀번호 입력 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>비밀번호</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={password}
                  onChangeText={setPassword}
                  secureTextEntry={!showPassword}
                  placeholder="비밀번호를 입력하세요"
                  placeholderTextColor="#A98BB5"
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)} style={styles.eyeIcon}>
                  {showPassword ? <EyeOff size={20} color="#B8A3C9" /> : <Eye size={20} color="#B8A3C9" />}
                </TouchableOpacity>
              </View>
            </View>

            {/* 비밀번호 확인 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>비밀번호 확인</Text>
              <View style={styles.passwordWrapper}>
                <TextInput
                  style={[styles.input, { flex: 1 }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  secureTextEntry={!showConfirmPassword}
                  placeholder="비밀번호를 다시 입력하세요"
                  placeholderTextColor="#A98BB5"
                />
                <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)} style={styles.eyeIcon}>
                  {showConfirmPassword ? <EyeOff size={20} color="#B8A3C9" /> : <Eye size={20} color="#B8A3C9" />}
                </TouchableOpacity>
              </View>
              {confirmPassword !== '' && password !== confirmPassword && (
                <Text style={styles.errorText}>비밀번호가 일치하지 않습니다.</Text>
              )}
            </View>

            {/* 이메일 입력 */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>이메일</Text>
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                placeholder="이메일을 입력하세요"
                placeholderTextColor="#A98BB5"
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>

            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <Text style={styles.submitButtonText}>회원가입</Text>
            </TouchableOpacity>

            {/* <View style={styles.dividerRow}>
              <View style={styles.line} />
              <Text style={styles.dividerText}>또는</Text>
              <View style={styles.line} />
            </View> */}

            {/* 소셜 가입 버튼 */}
            {/* <TouchableOpacity style={[styles.socialButton, { backgroundColor: '#FEE500' }]}>
              <Text style={[styles.socialText, { color: '#3C1E1E' }]}>카카오로 가입하기</Text>
            </TouchableOpacity>

            <TouchableOpacity style={[styles.socialButton, { backgroundColor: '#03C75A', marginTop: 10 }]}>
              <Text style={[styles.socialText, { color: 'white' }]}>네이버로 가입하기</Text>
            </TouchableOpacity> */}

            <TouchableOpacity onPress={() => navigation.navigate('Login')} style={styles.footer}>
              <Text style={styles.footerText}>이미 계정이 있으신가요? <Text style={styles.loginLink}>로그인</Text></Text>
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
  card: { backgroundColor: '#FFF5F7', borderRadius: 30, padding: 25, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
  title: { fontSize: 26, fontWeight: 'bold', color: '#8B6F9C', textAlign: 'center' },
  subtitle: { fontSize: 13, color: '#A98BB5', textAlign: 'center', marginBottom: 25, marginTop: 5 },
  inputGroup: { marginBottom: 15 },
  label: { fontSize: 14, color: '#8B6F9C', marginBottom: 6, fontWeight: '600' },
  row: { flexDirection: 'row', gap: 8 },
  flexInputWrapper: { flex: 1, position: 'relative', justifyContent: 'center' },
  input: { backgroundColor: 'white', height: 48, borderRadius: 12, paddingHorizontal: 15, borderWidth: 1, borderColor: '#E5D4ED', color: '#333' },
  statusIcon: { position: 'absolute', right: 12 },
  checkButton: { backgroundColor: '#B8A3C9', borderRadius: 12, paddingHorizontal: 12, justifyContent: 'center', height: 48 },
  checkButtonText: { color: 'white', fontWeight: 'bold', fontSize: 12 },
  disabledButton: { backgroundColor: '#D4C4DD' },
  helperText: { fontSize: 12, marginTop: 4, marginLeft: 2 },
  errorText: { fontSize: 12, color: '#F5A3A3', marginTop: 4, marginLeft: 2 },
  passwordWrapper: { flexDirection: 'row', alignItems: 'center' },
  eyeIcon: { position: 'absolute', right: 15 },
  submitButton: { backgroundColor: '#B8A3C9', height: 52, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginTop: 10 },
  submitButtonText: { color: 'white', fontSize: 16, fontWeight: 'bold' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', marginVertical: 20 },
  line: { flex: 1, height: 1, backgroundColor: '#E5D4ED' },
  dividerText: { marginHorizontal: 10, color: '#A98BB5', fontSize: 12 },
  socialButton: { height: 48, borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  socialText: { fontWeight: 'bold', fontSize: 14 },
  footer: { marginTop: 25, alignItems: 'center' },
  footerText: { color: '#A98BB5', fontSize: 14 },
  loginLink: { color: '#8B6F9C', fontWeight: 'bold', textDecorationLine: 'underline' }
});

export default SignUpScreen;