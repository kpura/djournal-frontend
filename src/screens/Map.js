import React, { useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import Icon from 'react-native-vector-icons/FontAwesome6';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';

const GOOGLE_API_KEY = "AIzaSyAdI2mDEQkVWZ9XVPb5gh57nNuga6_nuUg";
const SORSOGON_COORDINATES = {
  latitude: 12.9714,
  longitude: 124.0141
};

const Map = () => {
  const [currentRegion, setCurrentRegion] = useState(null);
  const [initialRegion, setInitialRegion] = useState(null);
  const [markerLocation, setMarkerLocation] = useState(null);
  const [places, setPlaces] = useState([]);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  useEffect(() => {
    const { latitude, longitude } = SORSOGON_COORDINATES;
    const region = {
      latitude,
      longitude,
      latitudeDelta: 0.5,
      longitudeDelta: 0.5,
    };
    setInitialRegion(region);
    setCurrentRegion(region);

    fetchNearbyPlaces(latitude, longitude);
  }, []);

  const fetchNearbyPlaces = async (latitude, longitude) => {
    const types = [
      'restaurant',
      'lodging',
      'tourist_attraction',
      'park',
      'museum',
      'church',
      'beach',
      'hiking_trail',
      'waterfall',
      'lake',
      'historical_landmark',
      'botanical_garden',
      'hotspring',
      'coldspring',     
    ];     
    let allPlaces = [];
    
    for (const type of types) {
      try {
        const response = await fetch(
          `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${latitude},${longitude}&radius=15000&type=${type}&key=${GOOGLE_API_KEY}`
        );
        const data = await response.json();
        allPlaces = [...allPlaces, ...data.results]; // Collect all results
      } catch (error) {
        console.error('Error fetching places:', error);
      }
    }

    setPlaces(allPlaces); // Update the places state with the fetched data
  };

  const handlePlaceSelection = (data, details) => {
    const { lat, lng } = details.geometry.location;
    const newRegion = {
      latitude: lat,
      longitude: lng,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };

    setCurrentRegion(newRegion);
    setMarkerLocation({ latitude: lat, longitude: lng });
  };

  const handleTextInputClear = () => {
    setMarkerLocation(null);
    setCurrentRegion(initialRegion); // Reset map to initial location
  };

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      {currentRegion ? (
        <>
          <MapView
            style={styles.map}
            region={currentRegion}
            showsUserLocation={true}
            showsMyLocationButton={true}
          >
            {places.map((place, index) => (
              <Marker
                key={index}
                coordinate={{
                  latitude: place.geometry.location.lat,
                  longitude: place.geometry.location.lng,
                }}
                title={place.name}
                description={place.vicinity} // Add more details here as needed
              />
            ))}
            {markerLocation && (
              <Marker
                coordinate={markerLocation}
                title="Selected Location"
              />
            )}
          </MapView>
          <View style={styles.searchContainer}>
            <GooglePlacesAutocomplete
              placeholder="Search for places"
              fetchDetails={true}
              onPress={handlePlaceSelection}
              onFail={console.error}
              onNotFound={handleTextInputClear}
              query={{
                key: GOOGLE_API_KEY,
                language: 'en',
              }}
              textInputProps={{
                onChangeText: (text) => {
                  if (text === '') handleTextInputClear();
                },
              }}
              styles={autoCompleteStyles}
              enablePoweredByContainer={false}
            />
          </View>
        </>
      ) : (
        <View style={styles.loadingContainer}>
          <Icon name="spinner" size={30} color="#525fe1" />
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchContainer: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
  },
});

const autoCompleteStyles = {
  textInput: {
    height: 50,
    borderRadius: 30,
    backgroundColor: 'white',
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    paddingHorizontal: 20,
    elevation: 5,
  },
  listView: {
    backgroundColor: 'white',
    borderRadius: 15,
    marginTop: 10,
    elevation: 5,
  },
};

export default Map;
