import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { 
  StyleSheet, 
  TouchableOpacity,
  Text, 
  View,   
  Image,
} from 'react-native';

import LOGO_IMAGES from './../SubsImageURL';
import SubsChange from './SubsChange';
import axios from 'axios';
import BASE_URL, { API_ENDPOINTS } from './../../../common/api/config';

const SubsMainList = ( { subs , fetchUserSubs, triggerSearchRefresh  } )=>{
    const [isChanging, setIsChanging] = useState(false);
    const [selectedItem, setSelectedItem] = useState(null); // 데이터 전달용 변수

    const navigation = useNavigation();

    // 사용자가 구독한 구독 로고 이미지 - list형식으로 변환
    const getLogo = (subs) => {
      if (!subs || subs.length === 0) return [];

      return subs.map(item => ({
        id: item.master_id,          // user_sub_id
        logo: item.logo_img   // 로고
      }));      
    };

    // 사용자가 구독한 구독 서비스 정보 dict형식으로 변환
    const userSubsInfo = (subs) => {
      if (!subs || subs.length === 0) return [];

      return subs.map(item => ({
        id: item.master_id,
        name: item.name,
        logo_img: item.logo_img,
        base_price: Number(item.base_price),
        category: item.category
      }));
    };

    // 변경하기 버튼 클릭시
    const handleEditPress = (item) => {
      setSelectedItem(item); // 클릭한 행의 데이터 저장
      setIsChanging(true);   // 화면 전환
    };

    // 해지하기 버튼 클릭시 db 삭제
    const handleDeletePress = async (item) => {
      const userId = subs[0].user_id; // 현재 유저

      try {
        await axios.delete(
          `${BASE_URL}${API_ENDPOINTS.SUBS.DELETE_USER_SUB(userId, item.id)}`
        );

        
        
        // 삭제 후 리스트 다시 불러오기
        fetchUserSubs();
        triggerSearchRefresh()
      } catch (e) {
        console.log('삭제 실패:', e);
      }
    };

    return (
    <SafeAreaView style={styles.safeArea}>
        <View style={styles.header}>
            <Text style={{borderBottomWidth:1}}>내 구독 리스트</Text>
            <View style={styles.headerbox}>
                {getLogo(subs).map((item, index) => (
                   <View key={`${item.id}-${index}`} style={styles.headerboxlist}>
                    <Image source={LOGO_IMAGES[item.logo]} style={styles.imageLogo} />
                  </View>
                ))}
            </View>
        </View>
        {!isChanging ? (
        <>
          <View style={styles.container}>
              <View style={styles.containertop}>
                  <Text>구독 서비스 변경 추천</Text>
                  <TouchableOpacity style={styles.containerSearchButton} onPress={() => console.log('a')}>
                      <Text style={styles.buttonText}>찾아보기</Text>
                  </TouchableOpacity>
              </View>            
          </View>

          <View style={styles.bottom}>
              <Text style={{borderBottomWidth:1, padding:5}}>구독 서비스 요금제 목록</Text>
              {userSubsInfo(subs).map((item, index) => (
                <View key={`${item.id}-${index}`} style={styles.bottomboxlist}>                       
                  <Text style={[styles.bottombox, {flex:1,}]}>{item.category}</Text>
                  <View style={[styles.bottombox, {flex:3, flexDirection: 'row',}]}>
                    <Image source={LOGO_IMAGES[item.logo_img]} style={styles.imageLogo}></Image>
                    <Text style={{marginLeft:15}}>{item.name}</Text>
                  </View>
                  <Text style={[styles.bottombox, {flex:1}]}>{item.base_price}</Text>
                  <TouchableOpacity style={[styles.bottombutton, {marginLeft:10}]} onPress={() => handleEditPress(item)}>
                      <Text>변경{'\n'}하기</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.bottombutton, {marginLeft:1}]} onPress={() => handleDeletePress(item)}>
                      <Text>해지{'\n'}하기</Text>
                  </TouchableOpacity>
              </View>
              ))}
          </View>
        </>
        ) : (
          // === 변경하기 클릭 시 새 공간 ===
        <View style={styles.ChangeContainer}>
          <SubsChange                         
            data={selectedItem} 
            userid={subs[0].user_id}
            onBack={() => setIsChanging(false)}
            onRefresh={fetchUserSubs}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa', // 아이폰 스타일의 연한 회색 배경    
    position: 'relative',
    padding: 5,    
    
  },

  header:{
    minHeight: 130,
    borderBottomWidth: 1,
  },

  headerbox:{
    padding: 2,
    flexDirection: 'row',
    flexWrap: 'wrap'
  },

  headerboxlist:{
    paddingHorizontal:5,
    paddingTop: 5,
  },

  container: {    
    minHeight:100,
    borderBottomWidth:1,
  },

  containertop:{
    flexDirection: 'row',
    padding:5,
    
  },

  containerSearchButton:{
    marginLeft: 'auto',
    paddingHorizontal: 5,
    backgroundColor: '#DDD',
  },

  bottom:{
    flex:1,    
  },

  bottomboxlist:{        
    flexDirection: 'row',     
    borderBottomWidth:1,    
    maxHeight:60,        
  },
  
  bottombox:{    
    alignItems: 'center',    
    paddingHorizontal:10,
    paddingVertical: 10, 
    borderRightWidth:1,    
  },

  bottombutton:{
    width:35, 
    height:45, 
    backgroundColor:'lightgray',
    marginRight:10,
    justifyContent: 'center',
    alignItems: 'center',
    
  },

  imageLogo:{
    width: 30, 
    height: 30,
    borderRadius: 100 / 2,
    borderWidth:1,
  },

  // 변경하기 클릭후 화면
  ChangeContainer: {
    flex: 1,     
    backgroundColor: '#fff',
  },

})

export default SubsMainList
