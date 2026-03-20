// import React from 'react';
// import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Image } from 'react-native';

// const ConfirmIngredient = () => {
//   // 영수증에서 읽어온 임시 데이터 (나중에 OCR 결과값과 연결)
//   const items = [
//     { id: 1, name: "양파", quantity: 12 },
//     { id: 2, name: "마늘", quantity: 12 },
//     { id: 3, name: "봄동", quantity: 12 },
//     { id: 4, name: "무", quantity: 12 },
//     { id: 5, name: "양파", quantity: 12 },
//     { id: 6, name: "마늘", quantity: 12 },
//   ];

//   return (
//     <SafeAreaView style={styles.container}>
//       {/* 헤더 */}
//       <View style={styles.header}>
//         <Text style={styles.backArrow}>←</Text>
//         <Text style={styles.headerTitle}>장 본 재료 확인</Text>
//         <Text style={styles.plusIcon}>+</Text>
//       </View>

//       {/* 리스트 영역 */}
//       <ScrollView contentContainerStyle={styles.scrollContent}>
//         {items.map((item, index) => (
//           <View key={index} style={styles.itemRow}>
//             <View style={styles.imagePlaceholder} />
//             <View style={styles.infoCol}>
//               <Text style={styles.itemName}>{item.name}</Text>
//               <Text style={styles.quantityText}>수량 : {item.quantity}</Text>
//             </View>
//           </View>
//         ))}
//       </ScrollView>

//       {/* 하단 버튼 바 */}
//       <View style={styles.buttonContainer}>
//         <TouchableOpacity style={styles.addButton}>
//           <Text style={styles.buttonText}>재료 추가</Text>
//         </TouchableOpacity>
//         <TouchableOpacity style={[styles.addButton, styles.saveButton]}>
//           <Text style={styles.buttonText}>재료 저장</Text>
//         </TouchableOpacity>
//       </View>
//     </SafeAreaView>
//   );
// };

// const styles = StyleSheet.create({
//   container: { flex: 1, backgroundColor: '#FFFFFF' },
//   header: { 
//     flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
//     paddingHorizontal: 20, paddingVertical: 15, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' 
//   },
//   headerTitle: { fontSize: 16, fontWeight: '600' },
//   backArrow: { fontSize: 20 },
//   plusIcon: { fontSize: 24 },
//   scrollContent: { paddingHorizontal: 20, paddingBottom: 100 },
//   itemRow: { 
//     flexDirection: 'row', alignItems: 'center', paddingVertical: 15, 
//     borderBottomWidth: 1, borderBottomColor: '#F1F5F9' 
//   },
//   imagePlaceholder: { width: 45, height: 45, borderRadius: 22.5, backgroundColor: '#E2E8F0', marginRight: 15 },
//   infoCol: { flex: 1, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
//   itemName: { fontSize: 16, fontWeight: '500' },
//   quantityText: { fontSize: 14, color: '#94A3B8' },
//   buttonContainer: { 
//     flexDirection: 'row', justifyContent: 'space-evenly', 
//     position: 'absolute', bottom: 30, width: '100%', paddingHorizontal: 20 
//   },
//   addButton: { 
//     backgroundColor: '#000000', width: '45%', paddingVertical: 15, 
//     borderRadius: 25, alignItems: 'center' 
//   },
//   saveButton: { backgroundColor: '#000000' },
//   buttonText: { color: '#FFFFFF', fontWeight: 'bold' }
// });

// export default ConfirmIngredient;