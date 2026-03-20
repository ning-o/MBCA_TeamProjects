import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Dimensions } from 'react-native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator'; 
import { X } from 'lucide-react-native';
import { useNavigation } from '@react-navigation/native';

const { width, height } = Dimensions.get('window');

const CustomCameraScreen = () => {
  const navigation = useNavigation();
  const cameraRef = useRef(null);
  
  const [permission, requestPermission] = useCameraPermissions();

  useEffect(() => {
    if (!permission) requestPermission();
  }, [permission]);

  if (!permission) return <View style={styles.container} />;
  
  if (!permission.granted) {
    return (
      <View style={styles.permissionContainer}>
        <Text style={styles.permissionText}>영수증 촬영을 위해 카메라 권한이 필요합니다.</Text>
        <TouchableOpacity style={styles.permissionButton} onPress={requestPermission}>
          <Text style={styles.permissionButtonText}>권한 허용하기</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // ★ 사진 촬영 및 크롭(자르기) 함수 ★
  const takePicture = async () => {
    if (cameraRef.current) {
      try {
        const photo = await cameraRef.current.takePictureAsync({
          quality: 1,
          base64: false,
        });

        const croppedPhoto = await ImageManipulator.manipulateAsync(
          photo.uri,
          [
            {
              crop: {
                originX: photo.width * 0.15,   // 좌측 15% 지점부터
                originY: photo.height * 0.075, // 상단 7.5% 지점부터
                width: photo.width * 0.7,      // 가로 70%
                height: photo.height * 0.85,   // 세로 85%
              },
            },
          ],
          { compress: 0.8, format: ImageManipulator.SaveFormat.JPEG } 
        );

        navigation.navigate('OCRConfirm', { photoUri: croppedPhoto.uri });
      } catch (error) {
        console.error(error);
        Alert.alert("에러", "사진 촬영 및 가공에 실패했습니다.");
      }
    }
  };

  return (
    <View style={styles.container}>
      <CameraView style={styles.camera} ref={cameraRef}>
        
        {/* =======================================================
            [START] 1. 반투명 마스크 덮개 (가운데 영수증 구멍 뚫기) 
            ======================================================= */}
        <View style={StyleSheet.absoluteFill}>
          {/* 상단 어두운 영역 (7.5%) */}
          <View style={styles.maskArea} /> 
          
          <View style={{ flexDirection: 'row', height: '73%' }}>
            {/* 좌측 어두운 영역 (15%) */}
            <View style={styles.maskArea} /> 
            
            {/* 뚫려있는 중앙 가이드 영역 (70%) */}
            <View style={styles.guideContainer}>
              <View style={styles.receiptGuide}>
                <View style={[styles.corner, styles.topLeft]} />
                <View style={[styles.corner, styles.topRight]} />
                <View style={[styles.corner, styles.bottomLeft]} />
                <View style={[styles.corner, styles.bottomRight]} />
                <Text style={styles.guideText}>영수증을 이 칸에 맞춰주세요</Text>
              </View>
            </View>

            {/* 우측 어두운 영역 (15%) */}
            <View style={styles.maskArea} /> 
          </View>
          
          {/* 하단 어두운 영역 (7.5%) */}
          <View style={styles.maskArea} /> 
        </View>

        {/* =======================================================
            [START] 2. 상/하단 버튼 층 (마스크 위에 배치) 
            ======================================================= */}
        <View style={StyleSheet.absoluteFill}>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.closeButton}>
              <X color="#fff" size={30} />
            </TouchableOpacity>
          </View>

          {/* 카메라 렌즈(가이드라인) 영역 비워두기 */}
          <View style={{ flex: 1 }} /> 

          <View style={styles.bottomBar}>
            <View style={styles.sideSpace} />
            <TouchableOpacity style={styles.shutterButton} onPress={takePicture}>
              <View style={styles.shutterInner} />
            </TouchableOpacity>
            <View style={styles.sideSpace} />
          </View>
        </View>

      </CameraView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  camera: { flex: 1 },
  
  permissionContainer: { flex: 1, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center', padding: 20 },
  permissionText: { color: '#fff', marginBottom: 20, textAlign: 'center' },
  permissionButton: { backgroundColor: '#3B82F6', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 10 },
  permissionButtonText: { color: '#fff', fontWeight: 'bold' },

  // --- [마스크 및 가이드 스타일] ---
  maskArea: { 
    flex: 1, 
    backgroundColor: 'rgba(0, 0, 0, 0.45)' // ★ 가이드 밖의 투명도. 아까(0.75)보단 맑고 은은하게 설정
  },
  guideContainer: { 
    width: '70%', 
    height: '100%' 
  },
  receiptGuide: {
    flex: 1,
    borderWidth: 1.5, // 선을 조금 더 또렷하게
    borderColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  guideText: { 
    color: '#fff', fontSize: 13, backgroundColor: 'rgba(0,0,0,0.5)', 
    paddingHorizontal: 10, paddingVertical: 5, borderRadius: 4, overflow: 'hidden'
  },
  
  // 모서리 가이드 
  corner: { position: 'absolute', width: 24, height: 24, borderColor: '#3B82F6', borderWidth: 4 }, // 꺾쇠 살짝 더 키움
  topLeft: { top: -2, left: -2, borderBottomWidth: 0, borderRightWidth: 0 },
  topRight: { top: -2, right: -2, borderBottomWidth: 0, borderLeftWidth: 0 },
  bottomLeft: { bottom: -2, left: -2, borderTopWidth: 0, borderRightWidth: 0 },
  bottomRight: { bottom: -2, right: -2, borderTopWidth: 0, borderLeftWidth: 0 },

  // --- [UI 버튼 스타일] ---
  topBar: { paddingTop: 50, paddingHorizontal: 20, flexDirection: 'row', justifyContent: 'flex-start' },
  closeButton: { padding: 10 },

  bottomBar: { height: 140, flexDirection: 'row', justifyContent: 'center', alignItems: 'center' },
  sideSpace: { width: 70 },
  shutterButton: {
    width: 76, height: 76, borderRadius: 38, backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center', alignItems: 'center', borderWidth: 4, borderColor: '#fff'
  },
  shutterInner: { width: 60, height: 60, borderRadius: 30, backgroundColor: '#fff' }
});

export default CustomCameraScreen;