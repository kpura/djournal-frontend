import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, TextInput, FlatList, Text, TouchableOpacity, Dimensions, Animated, ScrollView, Image } from 'react-native';
import { WebView } from 'react-native-webview';
import Icon from 'react-native-vector-icons/FontAwesome5';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { fetchLocations } from '../api';

const SORSOGON_COORDINATES = {
  latitude: 12.9884,
  longitude: 124.0133
};

const { height } = Dimensions.get('window');
const BOTTOM_SHEET_HEIGHT = height * 0.4;

const Map = () => {
  const [locations, setLocations] = useState([]);
  const [filteredLocations, setFilteredLocations] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showResults, setShowResults] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const webViewRef = useRef(null);
  
  const bottomSheetAnimatedValue = useRef(new Animated.Value(0)).current;
  
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  useEffect(() => {
    const getLocations = async () => {
      try {
        const data = await fetchLocations();
        setLocations(data);
        setFilteredLocations(data);
      } catch (error) {
        console.error('Failed to fetch locations:', error);
      }
    };
    
    getLocations();
  }, []);

  useEffect(() => {
    Animated.timing(bottomSheetAnimatedValue, {
      toValue: showBottomSheet ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [showBottomSheet]);
  
  useEffect(() => {
    if (selectedLocation && webViewRef.current) {
      const { latitude, longitude } = selectedLocation;
      webViewRef.current.injectJavaScript(`
        map.setView([${latitude}, ${longitude}], 14);
        markers.forEach(marker => {
          const isSelected = marker.options.title === "${selectedLocation.location_name}";
          const icon = isSelected ? selectedIcon : defaultIcon;
          marker.setIcon(icon);
        });
        true;
      `);
    }
  }, [selectedLocation]);

  const handleSearch = (text) => {
    setSearchQuery(text);
    
    if (text.trim() === '') {
      setFilteredLocations(locations);
      setShowResults(false);
      return;
    }
    
    const filtered = locations.filter(location => 
      location.location_name.toLowerCase().includes(text.toLowerCase())
    );
    
    setFilteredLocations(filtered);
    setShowResults(true);
  };

  const handleLocationSelect = (location) => {
    setSearchQuery(location.location_name);
    setSelectedLocation(location);
    setShowBottomSheet(true);
    setShowResults(false);
    
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        map.setView([${location.latitude}, ${location.longitude}], 14);
        markers.forEach(marker => {
          const isSelected = marker.options.title === "${location.location_name}";
          const icon = isSelected ? selectedIcon : defaultIcon;
          marker.setIcon(icon);
        });
        true;
      `);
    }
  };

  const clearSearch = () => {
    setSearchQuery('');
    setFilteredLocations(locations);
    setShowResults(false);
    setSelectedLocation(null);
    setShowBottomSheet(false);
    
    if (webViewRef.current) {
      webViewRef.current.injectJavaScript(`
        map.setView([${SORSOGON_COORDINATES.latitude}, ${SORSOGON_COORDINATES.longitude}], 10);
        markers.forEach(marker => {
          marker.setIcon(defaultIcon);
        });
        true;
      `);
    }
  };

  const handleMapEvent = (event) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      
      if (data.type === 'mapClick') {
        if (showBottomSheet || selectedLocation) {
          setSelectedLocation(null);
          setShowBottomSheet(false);
          setSearchQuery('');
          
          if (webViewRef.current) {
            webViewRef.current.injectJavaScript(`
              markers.forEach(marker => {
                marker.setIcon(defaultIcon);
              });
              true;
            `);
          }
        }
      } else if (data.type === 'markerClick') {
        const clickedLocation = locations.find(loc => 
          loc.location_name === data.title
        );
        
        if (clickedLocation) {
          setSelectedLocation(clickedLocation);
          setShowBottomSheet(true);
          setSearchQuery(clickedLocation.location_name); // Update search input with location name
          setShowResults(false); // Hide search results
        }
      }
    } catch (error) {
      console.error('Error parsing WebView message:', error);
    }
  };

  const translateY = bottomSheetAnimatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [BOTTOM_SHEET_HEIGHT, 0],
  });

  const createLeafletHTML = () => {
    const markersData = JSON.stringify(locations);
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
        <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
        <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
        <style>
          body { margin: 0; padding: 0; }
          #map { width: 100%; height: 100vh; }
          .leaflet-top.leaflet-left {
            top: auto !important;
            bottom: 10px !important;
          }
        </style>
      </head>
      <body>
        <div id="map"></div>
        <script>
          // Initialize map
          const map = L.map('map').setView([${SORSOGON_COORDINATES.latitude}, ${SORSOGON_COORDINATES.longitude}], 10);
          
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; OpenStreetMap contributors',
            maxZoom: 19
          }).addTo(map);
          
          // Custom marker icons using PNG
          const defaultIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-blue.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          });
          
          const selectedIcon = L.icon({
            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
            shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
            iconSize: [30, 46],
            iconAnchor: [15, 46],
            popupAnchor: [1, -34],
            shadowSize: [41, 41]
          });
          
          // Add markers from data
          const markers = [];
          const locationsData = ${markersData};
          
          locationsData.forEach(location => {
            const marker = L.marker(
              [parseFloat(location.latitude), parseFloat(location.longitude)], 
              { 
                icon: defaultIcon,
                title: location.location_name
              }
            ).addTo(map);
            
            marker.on('click', function() {
              window.ReactNativeWebView.postMessage(JSON.stringify({
                type: 'markerClick',
                title: location.location_name
              }));
            });
            
            markers.push(marker);
          });
          
          // Handle map click
          map.on('click', function(e) {
            window.ReactNativeWebView.postMessage(JSON.stringify({
              type: 'mapClick',
              latlng: e.latlng
            }));
          });
          
          // Handle user location
          map.locate({setView: false, maxZoom: 16});
          
          function onLocationFound(e) {
            L.marker(e.latlng, {
              icon: L.icon({
                iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-green.png',
                shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
                iconSize: [25, 41],
                iconAnchor: [12, 41],
                popupAnchor: [1, -34],
                shadowSize: [41, 41]
              })
            }).addTo(map)
              .bindPopup("You are within " + e.accuracy + " meters from this point").openPopup();
            
            L.circle(e.latlng, e.accuracy).addTo(map);
          }
          
          map.on('locationfound', onLocationFound);
        </script>
      </body>
      </html>
    `;
  };

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <WebView
        ref={webViewRef}
        originWhitelist={['*']}
        source={{ html: createLeafletHTML() }}
        style={styles.map}
        onMessage={handleMapEvent}
        javaScriptEnabled={true}
        domStorageEnabled={true}
        geolocationEnabled={true}
      />
      
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Icon name="search" size={18} color="#ccc" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search tourist spots"
            value={searchQuery}
            onChangeText={handleSearch}
            placeholderTextColor="#ccc"
          />
          {searchQuery ? (
            <TouchableOpacity onPress={clearSearch} style={styles.clearButton}>
              <Icon name="times-circle" size={20} color="#ccc" />
            </TouchableOpacity>
          ) : null}
        </View>
        
        {showResults && filteredLocations.length > 0 && (
          <FlatList
            data={filteredLocations}
            keyExtractor={(item, index) => index.toString()}
            style={styles.resultsList}
            renderItem={({ item }) => (
              <TouchableOpacity 
                style={styles.resultItem}
                onPress={() => handleLocationSelect(item)}
              >
                <Text style={styles.resultName}>{item.location_name}</Text>
                <Text style={styles.resultPlace}>{item.location_place}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
      
      <Animated.View 
        style={[
          styles.bottomSheet,
          { transform: [{ translateY }] }
        ]}
      >
        <View style={styles.bottomSheetHeader}>
          <View style={styles.bottomSheetHandle} />
        </View>
        
        {selectedLocation && (
          <ScrollView style={styles.locationInfoContainer}>
            {selectedLocation.location_images ? (
              <Image
                source={{ 
                  uri: selectedLocation.location_images.startsWith('/') 
                    ? `http://192.168.1.3:3000${selectedLocation.location_images}`
                    : `http://192.168.1.3:3000/uploads/${selectedLocation.location_images}` 
                }}
                style={styles.locationImage}
                resizeMode="cover"
              />
            ) : (
              <View style={styles.imageContainer}>
                <Text style={styles.placeholderText}>No image available</Text>
              </View>
            )}
            <Text style={styles.locationName}>{selectedLocation.location_name}</Text>
            <Text style={styles.locationPlace}>{selectedLocation.location_place}</Text>
          </ScrollView>
        )}
      </Animated.View>
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
  searchContainer: {
    position: 'absolute',
    top: 60,
    left: 20,
    right: 20,
    zIndex: 1,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 50,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  searchIcon: {
    marginRight: 10,
    marginLeft: 5,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
    top: 2,
  }, 
  clearButton: {
    padding: 8,
  },
  resultsList: {
    backgroundColor: 'white',
    borderRadius: 10,
    marginTop: 10,
    maxHeight: 300,
    elevation: 5,
  },
  resultItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  resultName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    color: '#333',
  },
  resultPlace: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: BOTTOM_SHEET_HEIGHT,
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    elevation: 10,
    padding: 20,
    paddingTop: 10,
  },
  bottomSheetHeader: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  bottomSheetHandle: {
    width: 40,
    height: 5,
    backgroundColor: '#ddd',
    borderRadius: 3,
  },
  locationImage: {
    width: '100%',
    height: 200,
    borderRadius: 10,
    marginBottom: 10,
  },
  locationInfoContainer: {
    flex: 1,
  },
  locationName: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 20,
    color: '#333',
    marginTop: 10,
  },
  locationPlace: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#666',
    marginBottom: 10,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    marginBottom: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontFamily: 'Poppins_400Regular',
    color: '#888',
  }
});

export default Map;