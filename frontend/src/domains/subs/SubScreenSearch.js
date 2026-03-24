import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  StyleSheet, 
  Text, 
  View,   
  ScrollView,
  Dimensions 
} from 'react-native';

// 공용 헤더 & 푸터 불러오기
import Header from '../../common/components/Header';
import Footer from '../../common/components/Footer';

import SubsSearchList from './SubsComponents/SubsSearchList';
import Subsfooter from './SubsComponents/SubsFooter';

const { width, height } = Dimensions.get('window');

export default function SubScreenSearch() {
  

  return (    
    <View style={styles.container}>
      {/* [고정] 공용 헤더 사용 */}
      <Header/>
      <View style={styles.mainbox}>
        
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>    
          <SubsSearchList />        
        </ScrollView>

        <Subsfooter />
        
      </View>
      {/* [고정] 공용 푸터 사용 */}
      <Footer />
    </View>    
    
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#afd5fa', // 아이폰 스타일의 연한 회색 배경    
    justifyContent: 'center', // 자식(mainbox)을 세로 중앙으로
    alignItems: 'center',     // 자식(mainbox)을 가로 중앙으로

  },

  mainbox: {
    width: '100%',
    height:height - 15,    
    backgroundColor: '#f8f9fa', // 아이폰 스타일의 연한 회색 배경    
    borderWidth: 1,

  },

  scrollContent: {    
    paddingTop: 55,    
    paddingBottom:100,
    minHeight: '100%',
  },
  
});
