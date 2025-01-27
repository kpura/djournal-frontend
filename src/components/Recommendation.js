import React from 'react';
import { View, Text, Image, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Recommendation = ({ recommendations, onImagePress }) => {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View>
      <Text style={styles.recommendationTitle}>Recommendation</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContainer}
      >
        {recommendations.map((place) => (
          <View key={place.id} style={styles.placeContainer}>
            <TouchableOpacity onPress={() => onImagePress(place.id)}>
              <Image source={place.image} style={styles.placeImage} />
            </TouchableOpacity>
            <View style={styles.placeHeader}>
              <Text style={styles.placeName}>{place.name}</Text>
            </View>
            <View style={styles.placeInfo}>
              <MaterialCommunityIcons
                name="map-marker"
                size={16}
                color="#525fe1"
                style={styles.locationIcon}
              />
              <Text style={styles.placeLocation}>{place.location}</Text>
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  recommendationTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    marginVertical: 10,
    color: '#000',
    left: 10,
  },
  scrollContainer: {
    paddingHorizontal: 10,
    paddingBottom: 20,
    paddingTop: 5,
  },
  placeContainer: {
    marginRight: 20,
    backgroundColor: '#fff',
    borderRadius: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 4,
    width: 300,
    padding: 5,
    position: 'relative',
  },
  placeImage: {
    width: '100%',
    height: 180,
    borderRadius: 15,
    resizeMode: 'cover',
  },
  placeHeader: {
    marginTop: 15,
  },
  placeName: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
    textAlign: 'left',
    left: 10,
  },
  placeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  locationIcon: {
    marginRight: 5,
    left: 6,
  },
  placeLocation: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    left: 5,
  },
});

export default Recommendation;
