import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import apiClient from '../../common/api/api_client';

const InviteRoommateScreen = ({ route, navigation }) => {
  const { invenId } = route.params || {};
  const [inviteNickName, setInviteNickName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleInviteRoommate = async () => {
    try {
      if (!inviteNickName.trim()) {
        Alert.alert('알림', '초대할 닉네임을 입력해주세요.');
        return;
      }

      setLoading(true);

      const payload = {
        inven_id: invenId,
        nick_name: inviteNickName.trim(),
      };

      const result = await apiClient.post(
        apiClient.urls.FRIDGE.INVITE_ROOMMATE,
        payload
      );

      Alert.alert('초대 완료', result.message || '동거인을 초대했습니다.');
      setInviteNickName('');
    } catch (error) {
      console.log('[INVITE ROOMMATE ERROR]', error?.response?.data || error);

      Alert.alert(
        '초대 실패',
        error?.response?.data?.detail || '동거인 초대 중 오류가 발생했습니다.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>동거인 초대</Text>
        <Text style={styles.subtitle}>
          함께 냉장고를 사용할 사용자의 닉네임을 입력하세요.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>닉네임</Text>
        <TextInput
          style={styles.input}
          placeholder="초대할 닉네임 입력"
          value={inviteNickName}
          onChangeText={setInviteNickName}
          autoCapitalize="none"
        />

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={handleInviteRoommate}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading ? '초대 중...' : '초대 전송'}
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default InviteRoommateScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    padding: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: '#0F172A',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748B',
    lineHeight: 20,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#334155',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CBD5E1',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    backgroundColor: '#FFFFFF',
    marginBottom: 14,
  },
  button: {
    backgroundColor: '#22C55E',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
});