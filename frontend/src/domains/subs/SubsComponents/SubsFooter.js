import React from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  StyleSheet, 
  Text, 
  View,   
  Dimensions 
} from 'react-native';

const Subsfooter = ()=>{
    return (
    <View style={styles.container}>    
      <View style={styles.footer}>
        <View style={[styles.footerItem, {width: 50}]}>
          <Text>총액</Text>
        </View>
        <View style={[styles.footerItem, {paddingHorizontal: 10}]}>
          <Text>OTT, 통신사</Text>
        </View>
        <View style={[styles.footerItem, {flex: 1}]}>
          <Text>10,000</Text>
        </View>          
      </View>    
    </View>
  );
}

const styles = StyleSheet.create({
  container: {    
    backgroundColor: '#f8f9fa', // 아이폰 스타일의 연한 회색 배경    
    position: 'relative'
  },  

  footer:{
    bottom: 110,
    height: 50,         // 새 박스 높이    
    backgroundColor:'#d5dcdf',
    borderColor: 'gray',
    borderWidth: 1,

    flexDirection: 'row',
    fontSize: 16,
    
  },

  footerItem: {        
    justifyContent: 'center', // 아이콘이나 텍스트 세로 중앙
    alignItems: 'center',     // 아이콘이나 텍스트 가로 중앙
    borderWidth: 1,         // 칸 구분을 위해 임시로 넣은 선
    borderColor: '#000000',
  }

})

export default Subsfooter
