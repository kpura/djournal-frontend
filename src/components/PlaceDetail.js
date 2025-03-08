import React from 'react';
import { 
  View, Text, Image, StyleSheet, ScrollView, TouchableOpacity, FlatList 
} from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { Svg, Circle } from 'react-native-svg';

const SERVER_URL = 'http://192.168.1.3:3000'; // Change this if your server has a different IP

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

const PlaceDetail = () => {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  const navigation = useNavigation();
  const route = useRoute();

  // Destructuring data from route params
  const {
    location_name = 'Unknown Location',
    location_place = 'Unknown Place',
    location_description = 'No description available for this place.',
    overall_positive = 50,
    overall_negative = 30,
    overall_neutral = 20,
    location_images = null,
    user_submitted_images = [], // Traveler-submitted images
  } = route.params || {};

  if (!fontsLoaded) {
    return null;
  }

  // Construct full image URL for `location_images`
  const locationImageUri = location_images
    ? (location_images.startsWith('/')
        ? `${SERVER_URL}${location_images}`
        : `${SERVER_URL}/uploads/${location_images}`)
    : null;

  return (
    <View style={styles.container}>
      {/* Location Image */}
      {locationImageUri ? (
        <Image source={{ uri: locationImageUri }} style={styles.image} resizeMode="cover" />
      ) : (
        <View style={[styles.image, styles.imageContainer]}>
          <Text style={styles.placeholderText}>No image available</Text>
        </View>
      )}

      {/* Back Button */}
      <TouchableOpacity style={styles.backButton} onPress={() => navigation.goBack()}>
        <MaterialCommunityIcons name="arrow-left" size={24} color="#fff" />
      </TouchableOpacity>

      {/* Content */}
      <View style={styles.contentContainer}>
        <Text style={styles.locationName}>{location_name}</Text>

        <View style={styles.locationContainer}>
          <MaterialCommunityIcons name="map-marker" size={20} color="#525fe1" />
          <Text style={styles.locationPlace}>{location_place}</Text>
        </View>

        <Text style={styles.descriptionTitle}>About</Text>
        <ScrollView style={styles.scrollSection} contentContainerStyle={styles.scrollSectionContainer}>
          <Text style={styles.locationDescription}>{location_description}</Text>

          {/* Mood Insights */}
          <View style={styles.moodContainer}>
            <Text style={styles.moodTitle}>Traveler Mood Insights</Text>
            <View style={styles.circularContainer}>
              <View style={styles.moodItem}>
                <CircularProgress percentage={overall_positive} color="#28a745" />
                <Text style={styles.percentageText}>{overall_positive}% Joyful</Text>
              </View>
              <View style={styles.moodItem}>
                <CircularProgress percentage={overall_neutral} color="#ffc107" />
                <Text style={styles.percentageText}>{overall_neutral}% Content</Text>
              </View>
              <View style={styles.moodItem}>
                <CircularProgress percentage={overall_negative} color="#dc3545" />
                <Text style={styles.percentageText}>{overall_negative}% Uncertain</Text>
              </View>
            </View>
          </View>

          {/* Traveler Reviews Section */}
          {user_submitted_images.length > 0 ? (
            <FlatList
              data={user_submitted_images}
              horizontal
              showsHorizontalScrollIndicator={false}
              keyExtractor={(item, index) => index.toString()}
              renderItem={({ item }) => {
                const imageUri = `http://192.168.1.3:3000${item.image_url}`; // Extract the image URL properly
                return (
                  <Image
                    source={{ uri: imageUri }}
                    style={styles.reviewImage}
                  />
                );
              }}
            />
          ) : (
            <Text style={styles.placeholderText}>No traveler images available</Text>
          )}
        </ScrollView>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  image: {
    width: '100%',
    height: 300,
    resizeMode: 'cover',
  },
  imageContainer: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    height: 300,
  },
  placeholderText: {
    color: '#666',
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
  },
  backButton: {
    position: 'absolute',
    top: 50,
    left: 15,
    backgroundColor: '#00000080',
    padding: 5,
    borderRadius: 20,
  },
  contentContainer: {
    padding: 20,
    flex: 1,
    marginTop: -30,
    backgroundColor: '#fff',
    borderTopLeftRadius: 35,
    borderTopRightRadius: 35,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 5,
  },
  locationName: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
  },
  locationContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  locationPlace: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    marginLeft: 5,
  },
  descriptionTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginBottom: 10,
  },
  locationDescription: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    lineHeight: 20,
  },
  moodContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    alignItems: 'center',
  },
  moodTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginBottom: 10,
  },
  circularContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  moodItem: {
    alignItems: 'center',
    marginHorizontal: 10,
  },
  percentageText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#13547D',
    marginTop: 5,
  },
  reviewsContainer: {
    marginTop: 20,
  },
  reviewsTitle: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    marginBottom: 10,
  },
  reviewImage: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginRight: 10,
  },
});

export default PlaceDetail;
