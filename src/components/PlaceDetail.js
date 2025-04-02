import React, { useState } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, FlatList, Modal, Dimensions, ScrollView } from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Svg, Circle } from 'react-native-svg';
import { SafeAreaView, StatusBar, Platform } from 'react-native';

const SERVER_URL = 'https://api.djournalmood.com';
const screenWidth = Dimensions.get('window').width;
const imageSize = (screenWidth - 50) / 3;

const CircularProgress = ({ percentage, color }) => {
  const radius = 30;
  const strokeWidth = 5;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <Svg width={80} height={80} viewBox="0 0 80 80">
      <Circle cx="40" cy="40" r={radius} stroke="#e0e0e0" strokeWidth={strokeWidth} fill="none" />
      <Circle
        cx="40"
        cy="40"
        r={radius}
        stroke={color}
        strokeWidth={strokeWidth}
        fill="none"
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
      />
    </Svg>
  );
};

const AboutTab = ({ description, positivePercent, neutralPercent, negativePercent }) => (
  <ScrollView style={styles.tabContent} showsVerticalScrollIndicator={false}>
    <Text style={styles.locationDescription}>{description}</Text>
    <View style={styles.moodContainer}>
      <Text style={styles.moodTitle}>Traveler Mood Insights</Text>
      <View style={styles.circularContainer}>
        <View style={styles.moodItem}>
          <CircularProgress percentage={positivePercent} color="#28a745" />
          <Text style={styles.percentageText}>{positivePercent}% Joyful</Text>
        </View>
        <View style={styles.moodItem}>
          <CircularProgress percentage={neutralPercent} color="#ffc107" />
          <Text style={styles.percentageText}>{neutralPercent}% Content</Text>
        </View>
        <View style={styles.moodItem}>
          <CircularProgress percentage={negativePercent} color="#dc3545" />
          <Text style={styles.percentageText}>{negativePercent}% Uncertain</Text>
        </View>
      </View>
    </View>
    {/* You can add more content here that will be scrollable */}
  </ScrollView>
);

const TravelerPhotosTab = ({ images, onImagePress }) => (
  <View style={styles.tabContent}>
    {images.length > 0 ? (
      <FlatList
        data={images}
        numColumns={3}
        showsVerticalScrollIndicator={false}
        keyExtractor={(item, index) => index.toString()}
        contentContainerStyle={styles.galleryContainer}
        renderItem={({ item }) => {
          const imageUri = `${SERVER_URL}${item.image_url}`;
          return (
            <TouchableOpacity style={styles.galleryItem} onPress={() => onImagePress(imageUri)}>
              <Image source={{ uri: imageUri }} style={styles.galleryImage} />
            </TouchableOpacity>
          );
        }}
      />
    ) : (
      <Text style={styles.placeholderText}>No traveler images available</Text>
    )}
  </View>
);

const PlaceDetail = () => {
  const [fontsLoaded] = useFonts({ Poppins_400Regular, Poppins_600SemiBold });
  const navigation = useNavigation();
  const route = useRoute();
  const [selectedTab, setSelectedTab] = useState('About');
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

  const {
    location_name = 'Unknown Location',
    location_place = 'Unknown Place',
    location_description = 'No description available for this place.',
    overall_positive = 50,
    overall_negative = 30,
    overall_neutral = 20,
    location_images = null,
    user_submitted_images = [],
  } = route.params || {};

  if (!fontsLoaded) {
    return null;
  }

  const locationImageUri = location_images
    ? (location_images.startsWith('/')
        ? `${SERVER_URL}${location_images}`
        : `${SERVER_URL}/uploads/${location_images}`)
    : null;

  const handleImagePress = (imageUri) => {
    setSelectedImage(imageUri);
    setModalVisible(true);
  };

  const normalizedImages = user_submitted_images.length > 0 
    ? user_submitted_images 
    : locationImageUri 
      ? [{ image_url: locationImageUri.replace(SERVER_URL, '') }] 
      : [];

  return (
    <SafeAreaView style={styles.safeArea}>
        <StatusBar backgroundColor="#f8f8f8" barStyle="dark-content" />
      <View style={styles.container}>
        {locationImageUri ? (
          <Image source={{ uri: locationImageUri }} style={styles.image} resizeMode="cover" />
        ) : (
          <View style={[styles.image, styles.imageContainer]}>
            <Text style={styles.placeholderText}>No image available</Text>
          </View>
        )}
        <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
          <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
        </TouchableOpacity>
        <View style={styles.contentContainer}>
          <Text style={styles.locationName}>{location_name}</Text>
          <View style={styles.locationContainer}>
            <MaterialCommunityIcons name="map-marker" size={20} color="#13547D" />
            <Text style={styles.locationPlace}>{location_place}</Text>
          </View>
          <View style={styles.tabContainer}>
            <TouchableOpacity style={[styles.tabButton, selectedTab === 'About' && styles.activeTab]} onPress={() => setSelectedTab('About')}>
              <Text style={[styles.tabText, selectedTab === 'About' && styles.activeTabText]}>About</Text>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.tabButton, selectedTab === 'Traveler Photos' && styles.activeTab]} onPress={() => setSelectedTab('Traveler Photos')}>
              <Text style={[styles.tabText, selectedTab === 'Traveler Photos' && styles.activeTabText]}>Traveler Photos</Text>
            </TouchableOpacity>
          </View>
          {selectedTab === 'About' ? (
            <AboutTab description={location_description} positivePercent={overall_positive} neutralPercent={overall_neutral} negativePercent={overall_negative} />
          ) : (
            <TravelerPhotosTab images={normalizedImages} onImagePress={handleImagePress} />
          )}
        </View>
        <Modal visible={modalVisible} transparent={true} animationType="fade">
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={() => setModalVisible(false)}>
              <MaterialCommunityIcons name="close" size={30} color="#fff" />
            </TouchableOpacity>
            {selectedImage && <Image source={{ uri: selectedImage }} style={styles.fullImage} resizeMode="contain" />}
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  container: { 
    flex: 1 
  },
  image: { 
    width: '100%', 
    height: 330
  },
  imageContainer: { 
    backgroundColor: '#f0f0f0', 
    justifyContent: 'center', 
    alignItems: 'center'
  },
  placeholderText: { 
    color: '#666', 
    fontSize: 16, 
    fontFamily: 'Poppins_400Regular' 
  },
  backButton: { 
    position: 'absolute', 
    top: 15, 
    left: 15, 
    backgroundColor: '#00000080', 
    padding: 5, 
    borderRadius: 20 
  },
  contentContainer: { 
    padding: 20, 
    flex: 1, 
    marginTop: -30, 
    backgroundColor: '#fff', 
    borderTopLeftRadius: 35, 
    borderTopRightRadius: 35 
  },
  locationName: { 
    fontSize: 20, 
    fontFamily: 'Poppins_600SemiBold', 
    color: '#333' 
  },
  locationContainer: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    marginBottom: 10 
  },
  locationPlace: { 
    fontSize: 16, 
    fontFamily: 'Poppins_400Regular', 
    color: '#666', 
    marginLeft: 5 
  },
  tabContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginBottom: 10, 
    borderBottomWidth: 1, 
    borderBottomColor: '#ccc' 
  },
  tabButton: { 
    paddingVertical: 10, 
    flex: 1, 
    alignItems: 'center' 
  },
  activeTab: { 
    borderBottomWidth: 3, 
    borderBottomColor: '#13547D' 
  },
  tabText: { 
    fontSize: 16, 
    fontFamily: 'Poppins_400Regular', 
    color: '#666' 
  },
  activeTabText: { 
    fontFamily: 'Poppins_600SemiBold', 
    color: '#13547D' 
  },
  tabContent: {
    flex: 1
  },
  moodContainer: { 
    marginTop: 20, 
    padding: 10, 
    backgroundColor: '#f8f9fa', 
    borderRadius: 10, 
    alignItems: 'center', 
    marginBottom: 20 
  },
  moodTitle: { 
    fontSize: 16, 
    fontFamily: 'Poppins_600SemiBold', 
    color: '#333', 
    marginBottom: 10 
  },
  circularContainer: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    width: '100%' 
  },
  moodItem: { 
    alignItems: 'center', 
    marginHorizontal: 10 
  },
  percentageText: { 
    fontSize: 14, 
    fontFamily: 'Poppins_400Regular', 
    color: '#13547D', 
    marginTop: 5 
  },
  locationDescription: { 
    marginTop: 10, 
    fontSize: 14, 
    fontFamily: 'Poppins_400Regular', 
    color: '#666', 
    lineHeight: 20 
  },
  modalContainer: { 
    flex: 1, 
    backgroundColor: '#000', 
    justifyContent: 'center', 
    alignItems: 'center' 
  },
  closeButton: { 
    position: 'absolute', 
    top: 40, 
    right: 20, 
    padding: 10 
  },
  fullImage: { 
    width: '100%', 
    height: '80%' 
  },
  galleryContainer: {
    paddingVertical: 10
  },
  galleryItem: {
    width: imageSize,
    height: imageSize,
    margin: 1,
    overflow: 'hidden'
  },
  galleryImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  }
});

export default PlaceDetail;