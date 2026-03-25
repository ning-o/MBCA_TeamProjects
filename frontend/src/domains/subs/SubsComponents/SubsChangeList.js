import React, { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { 
  StyleSheet, 
  TouchableOpacity,
  Text, 
  View,   
  Image,
  ScrollView,
  Dimensions 
} from 'react-native';

import LOGO_IMAGES from './../SubsImageURL';

// 새 컴포넌트 예시 (SubsChangeView.js 라고 가정)
const SubsChangeList = ({ category, onBack }) => {
    
    const templogo = ['netflix', 'disney']; // db에서 카테고리로 검색하여 로그 사진들 가져올 예정

    const [selectedLogo, setSelectedLogo] = useState(null);
    const [selectedDetail, setSelectedDetail] = useState(null);

    const handlePriceSelect = async (price, index) => {
        if (selectedPrice === price) {
            setSelectedPrice(null);
            setSelectedDetail(null);
            return;
        }

        setSelectedPrice(price)
        setSelectedDetail(tempdetail[index])
    }    

  return (
    <View style={styles.container}>
        <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
        >
            <View style={styles.logoListbox}>
                {templogo.map((item, index) => (
                    <View key={index} style={styles.logoList}>
                        <View key={index}>
                          <Image source={LOGO_IMAGES[item]} style={styles.imageLogo}></Image>
                        </View>
                    </View>
                ))}
            </View>
                        
            <View style={styles.bottom}>
                <TouchableOpacity onPress={onBack} style={{marginLeft:'auto', marginTop:'auto', backgroundColor:'#ddd'}}>
                    <Text>뒤로 가기</Text>
                </TouchableOpacity>
            </View>

            
        </ScrollView>
        
        
        
        {/* 선택된 데이터 출력 */}
        {/* <View style={styles.infoCard}>
            <Text>카테고리: {data.category}</Text>
            <Text>서비스명: {data.name}</Text>
            <Text>현재 가격: {data.price}원</Text>
        </View> */}

        {/* 돌아가기 */}
        {/* <TouchableOpacity onPress={onBack} style={styles.backButton}>
            <Text>돌아가기</Text>
        </TouchableOpacity> */}
    </View>
  );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,       
        borderBottomWidth:1,         
    },

    scrollView: {
        flex: 1,        
    },

    scrollContent: {
        flexGrow: 1,
    },

    logoListbox: {
        flexDirection: 'row',  
        flexWrap: 'wrap',
        marginTop:10,
        paddingHorizontal: 5,
    },

    logoList: {
        marginLeft:10,
        marginBottom: 10,
    },

    imageLogo:{
        width: 30, 
        height: 30,
        borderRadius: 100 / 2,        
        borderWidth:1,

    },

    bottom:{
        flex:1,
        flexDirection: 'row',        
        marginLeft: -5,
        
    },


})

export default SubsChangeList;