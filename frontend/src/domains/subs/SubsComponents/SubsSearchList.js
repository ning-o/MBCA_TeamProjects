
// SubscribeSearchList.js
import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  StyleSheet, 
  TouchableOpacity,
  Text, 
  View,   
  Image,
  Dimensions 
} from 'react-native';

import CustomAddModal from './CustomAddSubs';
import LOGO_IMAGES from './../SubsImageURL';

const SubsSearchList = ()=>{    
    const tempData = ['netflix', 'disney']; // 내 카테고리 로고 url 데이터
    const tempcategory = ['OTT', '통신사', '쇼핑'] // 저장된 카테고리들 
    const tempcategorysubscribe = ['netflix', 'disney']; // 카테고리로 검색하여 해당하는 로고 url key 가져와서 사용
    const subscribetempData = [ // name(selectedsubscribe)으로 검색하여 구독 서비스들 정보 데이터
        {'name':'netplex','logo':'img','price':'10000','category':'OTT'},
        {'name':'netplex','logo':'img','price':'20000','category':'OTT'},
    ] 
    const subscribetempDataDetail = ['설명들'] // api로 받아올 구독 요금제대한 상세 정보들    

    const [selectedCategory, setSelectedCategory] = useState(null);
    const [selectedsubscribe, setSelectedsubscribe] = useState(null);
    const [selectedprice, setSelectedprice] = useState(null);
    const [isModalVisible, setIsModalVisible] = useState(false);

    //(예정) 내 구독서비스 데이터 가져오기 
    const fetchUserSubscriptions = async () => {

    }

    // 카테고리 선택시 동작
    const handleCategorySelect = async (categoryName) => {
        // 1. 선택된 카테고리 상태 업데이트
        if (selectedCategory === categoryName) {
            setSelectedCategory(null);
            setSelectedsubscribe(null); // 해제 시 데이터 초기화
            setSelectedprice(null);
            return;
        }

        setSelectedCategory(categoryName);
        setSelectedsubscribe(null); // 이전 카테고리에서 선택한 로고 초기화
        setSelectedprice(null);
    }

    // 카테고리 선택 후 로고 선택시 동작
    const handlelogoSelect = async (logoName) => {
        // 1. 선택된 카테고리 상태 업데이트
        if (selectedsubscribe === logoName) {
            setSelectedsubscribe(null);
            setSelectedprice(null);
            return;
        }

        setSelectedsubscribe(logoName); 
        setSelectedprice(null);       
    }

    const handlepriceSelect = async (price) => {
        // 1. 선택된 카테고리 상태 업데이트
        if (selectedprice === price) {
            setSelectedprice(null);            
            return;
        }

        setSelectedprice(price);        
    }

    // 직접 입력시 추가로 db에 저장 (예정)
    const handleCustomSubmit = (value) => {
        console.log("새로 추가된 서비스:", value);
        
    };

    return (
    <View style={styles.safeArea}>
        <View style={styles.header}>
            <Text style={{height:24, borderBottomWidth:1,}}>내 구독 서비스</Text>
            <View style={styles.headerList}>
                <View style={styles.headerbox}>
                    {tempData.map((item, index) => (
                        <View key={index} style={styles.headerboxlist}>
                            <Image source={LOGO_IMAGES[item]} style={styles.imageLogo}></Image>
                        </View>
                    ))}
                </View>
            </View>
        </View>

        {/* 중단 구독 카테고리 선택 */}        
        <View style={styles.container}>
            <View style={styles.categoryList}>
                {tempcategory.map((item, index) => (
                    <TouchableOpacity key={index} 
                        style={[styles.categorybox, selectedCategory == item && { backgroundColor: '#aaa' }]} 
                        onPress={() => handleCategorySelect(item)}
                    >
                        <Text>{item}</Text>
                    </TouchableOpacity>
                ))}
            </View>
            {/* 수정예정 */}
            <TouchableOpacity style={styles.categorycreatebutton} onPress={() => setIsModalVisible(true)}>
                <Text>직접입력</Text>
            </TouchableOpacity>

            {/* 직접 입력 컴포넌트 */}
            <CustomAddModal 
                visible={isModalVisible} 
                onClose={() => setIsModalVisible(false)}
                onSubmit={handleCustomSubmit}
            />
        </View>

        {/* 하단 구독 서비스 선택 */}
        {selectedCategory && (
        <View style={styles.bottom}>
            <View style={styles.bottomcategoryList}>                
                {tempcategorysubscribe.map((item, index) => (                
                    <TouchableOpacity key={index} 
                        style={[styles.bottomcategorybox, selectedsubscribe == item && { backgroundColor: '#aaa' }]} 
                        onPress={() => handlelogoSelect(item)}
                    >
                        <Image source={LOGO_IMAGES[item]} style={styles.imageLogo}></Image>
                    </TouchableOpacity>
                ))}
            </View>

            {selectedsubscribe && (
            <View style={styles.bottomprice}>
                {/* 구독 서비스 요금제 출력 */}
                <View style={styles.bottompriceList}>
                    <View style={[styles.bottompricebox, {'borderBottomWidth':1, 'height':50}]}>
                        <Image source={LOGO_IMAGES[selectedsubscribe]} style={styles.imageLogo}></Image>
                    </View>

                    {subscribetempData.map((item, index) => (
                        <TouchableOpacity key={index}
                            style={[styles.bottompricebox, selectedprice == item.price && { backgroundColor: '#aaa' }]} 
                            onPress={() => handlepriceSelect(item['price'])}
                        >
                            <Text>{item.price}</Text>
                            
                        </TouchableOpacity>
                    ))}
                </View>
                {/* 상세정보 출력 */}
                
                <View style={styles.bottompricedetail}>   
                    {selectedprice && (                
                    <Text>{subscribetempDataDetail}</Text>
                    )}
                </View>                
            </View>
            )}
        </View>
        )}
    </View>
  );
}
// navigation.navigate('Details', { itemId: 86, otherParam: '안녕!' })}
const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa', // 아이폰 스타일의 연한 회색 배경    
    // position: 'relative',
    padding: 5,
    
  },

  header:{        
    margin:5,    
    borderBottomWidth:1,
  },

  headerList:{
    minHeight:60,
    margin:5,    
  },

  headerbox:{
    padding: 2,    
    flexDirection: 'row',
  },

  headerboxlist:{
    paddingHorizontal:5,
  },

  container:{
    minHeight:70,
    margin: 5,
    borderBottomWidth:1,
  },

  categoryList:{    
    flexDirection:'row',    

  },

  categorybox:{
    margin:3,
    marginHorizontal:6,
    backgroundColor:'#ddd',
    borderRadius: 100 / 2,
    
  },

  categorycreatebutton:{
    marginLeft: 'auto',
    marginTop: 'auto',
    padding: 5,
    margin:5,
    backgroundColor: '#DDD',
  },

//   하단
  bottom: {
    flex: 1,
    backgroundColor: '#fff',
  },

  bottomcategoryList:{
    flexDirection:'row',
    height:70,
    overflow: 'hidden',     
  },

  bottomcategorybox:{
    margin:3,
    marginHorizontal:6,
    width:30,
    height:30,
    backgroundColor:'#ddd',
    borderRadius: 100 / 2,
  },

  bottomprice:{
    flex:1,
    flexDirection: 'row',
    borderTopWidth:1,
    marginLeft: -5,
  },

  bottompriceList:{    
    borderRightWidth:1,
    flex:1,
    
  },

  bottompricebox:{    
    padding:3,    
    justifyContent: 'center', 
    alignItems: 'center',     
    borderBottomWidth:1,     
  },

  bottompricedetail:{
    flex: 6,
  },

  imageLogo:{
    width: 30, 
    height: 30,
    borderRadius: 100 / 2,
    borderWidth:1,
  }

})

export default SubsSearchList
