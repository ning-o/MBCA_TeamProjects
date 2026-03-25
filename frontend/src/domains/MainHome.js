import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Header from '../common/components/Header'; // 사용 안 할 거면 지우셔도 됩니다
import Footer from '../common/components/Footer'; // 사용 안 할 거면 지우셔도 됩니다
import { CreditCard, Refrigerator, TrendingUp } from 'lucide-react-native';
import {FeatureCard} from '../common/components/FeatureCard';


function MainHome({ navigation }) {
  const handleSubscription = () => navigation.navigate('SubsRouter');
  const handleRefrigerator = () => navigation.navigate('Fridge');
  const handleStatistics = () => navigation.navigate('Auth');

  return (
    <View style={{ flex: 1, paddingTop:100 }}>
      <View style={styles.cardList}>
        <FeatureCard
          title="구독관리"
          Icon={CreditCard}
          bgColor="#ecdee4" // pink-100
          iconColor="#EC4899" // pink-500
          onPress={handleSubscription}
        />
        <FeatureCard
          title="냉장고관리"
          Icon={Refrigerator}
          bgColor="#DBEAFE" // blue-100
          iconColor="#3B82F6" // blue-500
          onPress={handleRefrigerator}
        />
        <FeatureCard
          title="절약 통계"
          Icon={TrendingUp}
          bgColor="#F3E8FF" // purple-100
          iconColor="#A855F7" // purple-500
          onPress={handleStatistics}
        />
      </View>
      <Footer/>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB', // 부드러운 배경색
  },
  content: {
    flex: 1, // 전체 화면 높이를 차지하게 함
    paddingHorizontal: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#6B7280',
  },
  cardList: {
    gap: 16,
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 40,
    gap: 8,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#D1D5DB',
  },
  activeDot: {
    backgroundColor: '#A855F7',
    width: 20, // 활성화된 도트 길게
  },
});

// const styles = StyleSheet.create({
//   container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
//   text: { fontSize: 20, fontWeight: 'bold' }
// });

export default MainHome;