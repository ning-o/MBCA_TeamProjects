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

import SubsMainList from './SubsComponents/SubsMainList';
import Subsfooter from './SubsComponents/SubsFooter';

const { width, height } = Dimensions.get('window');

export default function SubsMain() {
  return (
    <View style={{flex:1}}>
      <Header/>
      <View style={styles.container}>            
        <View style={styles.mainbox}>        
          <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>              
            <SubsMainList />          
          </ScrollView>

          <Subsfooter />        
        </View>      
      </View>
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
    width:width,
    height:height,
    backgroundColor: '#f8f9fa', // 아이폰 스타일의 연한 회색 배경    
    borderWidth: 1,
    overflow: 'hidden',

  },

  scrollContent: {    
    paddingTop: 20,    
    paddingBottom:100,
    minHeight: '100%',
  },

});
