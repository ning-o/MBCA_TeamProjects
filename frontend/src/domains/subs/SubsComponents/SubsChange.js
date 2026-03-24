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
import SubsChangeList from './SubsChangeList';

// 새 컴포넌트 예시 (SubsChangeView.js 라고 가정)
const SubsChange = ({ data, onBack }) => {
    
    const tempprice = ['10000', '15000', '20000']; // db에서 구독 이름으로 검색하여 요금제 가져올 예정
    const tempdetail = ['10000원짜리설명예정','20000원짜리설명예정', '30000원짜리설명예정']

    const [isChanging, setIsChanging] = useState(false);
    const [selectedPrice, setSelectedPrice] = useState(null);
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
    
    // 요금제 변경시 (예정)
    const handlechangePrice = async (price, index) => {

    }

  return (
    <View style={styles.container}>
        <ScrollView 
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={true}
        >
            <View style={styles.header}>
                <Text style={{marginRight:10}}>{data.category}</Text>
                <Image source={LOGO_IMAGES[data.logo]} style={[styles.imageLogo, {marginRight:20}]}></Image>
                <Text style={{marginRight:10}}>{data.name}</Text>
                <Text style={{marginLeft:'auto'}}>{Number(data.price).toLocaleString()}원</Text>
                <View style={styles.headerButtonbox}>
                    <TouchableOpacity 
                        style={[styles.headerButton, isChanging && { opacity: 0.5 }]} 
                        onPress={() => { handlechangePrice(); onBack(); }}
                        disabled={isChanging} 
                        Marcus
                    >
                        <Text style={[{ fontSize: 12 }, isChanging && { color: '#A0A0A0' }]}>
                            변경{"\n"}하기
                        </Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.headerButton} onPress={() => setIsChanging(true)}>
                        <Text style={{fontSize: 12}}>다른{"\n"}구독</Text>
                    </TouchableOpacity>
                </View>
            </View>
            
            {!isChanging ? (
            <>
            <View style={styles.bottomprice}>
                {/* 구독 서비스 요금제 출력 */}
                <View style={styles.bottompriceList}>                    
                    {tempprice.map((item, index) => (
                        <TouchableOpacity key={index}
                            style={[styles.bottompricebox, selectedPrice == item && { backgroundColor: '#aaa' }]}
                            onPress={() => handlePriceSelect(item, index)}
                        >
                            <Text>{item}</Text>
                        </TouchableOpacity>
                    ))}
                </View>
                {/* 상세정보 출력 */}
                
                <View style={styles.bottompricedetail}>   
                    {selectedPrice && (                
                    <Text>{selectedDetail}</Text>
                    )}

                    <TouchableOpacity onPress={onBack} style={{marginLeft:'auto', marginTop:'auto', backgroundColor:'#ddd'}}>
                        <Text>뒤로 가기</Text>
                    </TouchableOpacity>
                </View>                
            </View>
            </>
            ) : (
            // === 다른 구독 클릭 시 새 공간 ===
            <View style={styles.ChangeContainer}>
                <SubsChangeList
                category={data.category} 
                onBack={() => setIsChanging(false)} 
                />
            </View>
            )}
            
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

    header: {
        // justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row',
        height:50,
        marginLeft:5,
        borderBottomWidth: 1,
    },

    imageLogo:{
        width: 30, 
        height: 30,
        borderRadius: 100 / 2,
        borderWidth:1,
    },

    headerButtonbox: {
        marginLeft: 'auto',        
        flexDirection: 'row',
        paddingLeft:10,
        borderLeftWidth:1,        
    },

    headerButton: {
        width:35, 
        height:45, 
        backgroundColor:'lightgray',
        marginRight:10,        
        justifyContent: 'center',
        alignItems: 'center',
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

    // 다른 구독 클릭후 화면
    ChangeContainer: {
        flex: 1,     
        backgroundColor: '#fff',
    },

})

export default SubsChange;