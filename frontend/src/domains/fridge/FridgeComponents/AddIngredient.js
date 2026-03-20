// import React, { useState } from 'react';
// import { View, Text, StyleSheet, TextInput, ScrollView, TouchableOpacity, SafeAreaView } from 'react-native';
// import { useNavigation } from '@react-navigation/native';

// const AddIngredient = () => {
//   const navigation = useNavigation();

//   // 1. 재료 데이터를 상태(State)로 관리합니다.
//   const [searchResults, setSearchResults] = useState([
//     { id: 1, name: "양파", checked: true },
//     { id: 2, name: "적양파", checked: false },
//     { id: 3, name: "샬롯", checked: false },
//     { id: 4, name: "대파", checked: false },
//     { id: 5, name: "쪽파", checked: false },
//   ]);

//   // 2. 체크박스 토글 함수: 아이템을 누르면 실행됩니다.
//   const toggleCheck = (id) => {
//     setSearchResults(prevResults => 
//       prevResults.map(item => 
//         item.id === id ? { ...item, checked: !item.checked } : item
//       )
//     );
//   };

//   // 3. 저장 버튼 클릭 시 로직 (선택된 데이터 확인용)
//   const handleSave = () => {
//     const selectedItems = searchResults.filter(item => item.checked);
//     console.log("선택된 재료들:", selectedItems);
//     alert(`${selectedItems.length}개의 재료가 선택되었습니다!`);
//     navigation.goBack(); // 이전 화면(ConfirmIngredient)으로 복귀
//   };

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* 헤더 */}
//       <View style={styles.header}>
//         <TouchableOpacity onPress={() => navigation.goBack()}>
//           <Text style={styles.backArrow}>←</Text>
//         </TouchableOpacity>
//         <Text style={styles.headerTitle}>직접입력</Text>
//         <TouchableOpacity>
//           <Text style={styles.plusIcon}>+</Text>
//         </TouchableOpacity>
//       </View>

//       {/* 검색바 */}
//       <View style={styles.searchContainer}>
//         <View style={styles.searchBar}>
//           <Text style={styles.searchIcon}>🔍</Text>
//           <TextInput 
//             style={styles.input} 
//             placeholder="재료를 검색하세요" 
//             placeholderTextColor="#94A3B8"
//           />
//         </View>
//       </View>

//       {/* 결과 리스트: 각 행(Row)을 터치 가능하게 설정 */}
//       <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
//         {searchResults.map((item) => (
//           <TouchableOpacity 
//             key={item.id} 
//             style={styles.listRow} 
//             onPress={() => toggleCheck(item.id)} // 행 전체를 눌러도 체크되게!
//             activeOpacity={0.6}
//           >
//             <View style={styles.imagePlaceholder} />
//             <Text style={styles.itemName}>{item.name}</Text>
            
//             {/* 체크박스 디자인 */}
//             <View style={[styles.checkBox, item.checked && styles.checkedBox]}>
//               {item.checked && <Text style={styles.checkMark}>✓</Text>}
//             </View>
//           </TouchableOpacity>
//         ))}
//       </ScrollView>

//       {/* 저장 버튼 */}
//       <TouchableOpacity style={styles.singleSaveButton} onPress={handleSave}>
//         <Text style={styles.buttonText}>재료 저장</Text>
//       </TouchableOpacity>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#FFFFFF' },
//   header: { 
//     flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
//     paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' 
//   },
//   headerTitle: { fontSize: 18, fontWeight: 'bold', color: '#1E293B' },
//   backArrow: { fontSize: 24, color: '#1E293B' },
//   plusIcon: { fontSize: 28, color: '#1E293B' },

//   searchContainer: { paddingHorizontal: 20, marginVertical: 15 },
//   searchBar: { 
//     flexDirection: 'row', alignItems: 'center', backgroundColor: '#F1F5F9', 
//     borderRadius: 15, paddingHorizontal: 15, height: 50 
//   },
//   searchIcon: { fontSize: 18, marginRight: 10 },
//   input: { flex: 1, fontSize: 16, color: '#1E293B' },

//   list: { flex: 1 },
//   listRow: { 
//     flexDirection: 'row', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 15, 
//     borderBottomWidth: 1, borderBottomColor: '#F1F5F9' 
//   },
//   imagePlaceholder: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#E2E8F0', marginRight: 15 },
//   itemName: { flex: 1, fontSize: 17, color: '#334155', fontWeight: '500' },

//   checkBox: { 
//     width: 24, height: 24, borderWidth: 2, borderColor: '#CBD5E1', 
//     borderRadius: 6, justifyContent: 'center', alignItems: 'center' 
//   },
//   checkedBox: { backgroundColor: '#6366F1', borderColor: '#6366F1' }, // 메추리 포인트 컬러(보라/블루)
//   checkMark: { color: '#FFFFFF', fontSize: 14, fontWeight: 'bold' },

//   singleSaveButton: { 
//     position: 'absolute', bottom: 30, left: 20, right: 20,
//     backgroundColor: '#000000', paddingVertical: 18, borderRadius: 30, alignItems: 'center',
//     elevation: 5, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.25, shadowRadius: 3.84
//   },
//   buttonText: { color: '#FFFFFF', fontSize: 18, fontWeight: 'bold' }
// });

// export default AddIngredient;
// ==============================================================================
