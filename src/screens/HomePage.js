import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, RefreshControl, TouchableOpacity, ActivityIndicator, ImageBackground, Alert } from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { FontAwesome6 } from '@expo/vector-icons'; 
import Recommendation from '../components/Recommendation';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCurrentUser } from '../api/index';

const HomePage = () => {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  const [greeting, setGreeting] = useState('');
  const [userName, setUserName] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profileLastUpdated, setProfileLastUpdated] = useState(Date.now());

  const navigation = useNavigation();

  useEffect(() => {
    const getToken = async () => {
      try {
        const userToken = await AsyncStorage.getItem('userToken');
        setToken(userToken);
      } catch (error) {
        console.error('Error retrieving token:', error);
      }
    };
    
    getToken();
  }, []);

  const fetchUserProfile = async () => {
    if (!token) return;
    
    try {
      const userData = await getCurrentUser();
      console.log("Full user data:", userData);
      setUserName(userData.name);
      
      console.log("Profile picture from server:", userData.profile_picture);
      
      if (userData.profile_picture) {
        const picturePath = userData.profile_picture.startsWith('/') 
          ? userData.profile_picture.substring(1) 
          : userData.profile_picture;
        
        const timestamp = Date.now();
        setProfilePicture(`http://192.168.1.11:3000/${picturePath}?t=${timestamp}`);
      } else {
        setProfilePicture(null);
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
    }
  };

  useEffect(() => {
    if (token) {
      fetchUserProfile();
    }
  }, [token, profileLastUpdated]);

  useFocusEffect(
    React.useCallback(() => {
      if (token) {
        fetchUserProfile();
        fetchRecommendations();
      }
    }, [token])
  );

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good Morning');
    } else if (hour < 18) {
      setGreeting('Good Afternoon');
    } else {
      setGreeting('Good Evening');
    }
  }, []);

  const fetchRecommendations = async () => {
    if (!token) {
      console.log('No token available, cannot fetch recommendations');
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const response = await axios.get('http://192.168.1.11:3000/api/recommendations', {
        headers: { 'Authorization': `Bearer ${token}` }
      });

      console.log('Recommendations received:', response.data);
      setRecommendations(response.data);
    } catch (error) {
      console.error('Error fetching recommendations:', error.response?.data || error.message);
      Alert.alert('Error', 'Failed to fetch recommendations. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    // Refresh profile picture by updating the timestamp
    setProfileLastUpdated(Date.now());
    await fetchRecommendations();
    setRefreshing(false);
  };

  const refreshProfilePicture = () => {
    // Function that can be called to refresh profile picture
    setProfileLastUpdated(Date.now());
  };

  if (!fontsLoaded) {
    return <ActivityIndicator size="large" color="#6c79e0" />;
  }

  return (
    <View style={styles.container}>
      <ImageBackground 
        source={require('../../assets/home_bg.jpg')}
        style={styles.headerBackground}
      >
        <View style={styles.headerContent}>
          <View style={styles.headerTop}>
            <TouchableOpacity 
              style={styles.profilePictureContainer}
              onPress={refreshProfilePicture}
            >
              {profilePicture ? (
                <Image 
                  source={{ uri: profilePicture }} 
                  style={styles.profilePicture} 
                  // Make sure to set cache control
                  onError={() => console.log("Error loading profile picture")}
                />
              ) : (
                <View style={styles.defaultProfilePicture}>
                  <Text style={styles.defaultProfileInitial}>
                    {userName ? userName.charAt(0).toUpperCase() : '?'}
                  </Text>
                </View>
              )}
            </TouchableOpacity>
            
            <View style={styles.greetingTextContainer}>
              <Text style={styles.headerGreeting}>{greeting}, {userName}!</Text>
            </View>
            
            <TouchableOpacity
              style={styles.dataButton}
              onPress={() => navigation.navigate('DataVisualization')}
            >
              <FontAwesome6 name="chart-column" size={25} color="#ffffff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>Welcome to Sorsogon</Text>
          </View>
        </View>
      </ImageBackground>
  
      <View style={styles.mainContent}>
        <View style={styles.gifContainer}>
          <View style={styles.gifItem}>
            <Image source={require('../../assets/joyful.png')} style={styles.gif} />
            <Text style={styles.gifLabel}>Joyful</Text>
          </View>
          <View style={styles.gifItem}>
            <Image source={require('../../assets/content.png')} style={styles.gif} />
            <Text style={styles.gifLabel}>Content</Text>
          </View>
          <View style={styles.gifItem}>
            <Image source={require('../../assets/uncertain.png')} style={styles.gif} />
            <Text style={styles.gifLabel}>Uncertain</Text>
          </View>
        </View>
  
        <View style={styles.recommendationContainer}>
          <Text style={styles.sectionTitle}>Recommended For You</Text>
          {loading ? (
            <ActivityIndicator size="large" color="#6c79e0" style={styles.loader} />
          ) : (
            <ScrollView 
              contentContainerStyle={styles.scrollContent}
              refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            > 
              {recommendations.length > 0 ? (
                recommendations.map((rec, index) => (
                  <Recommendation key={index} data={rec} />
                ))
              ) : (
                <Text style={styles.noRecommendations}>No recommendations available.</Text>
              )}
            </ScrollView>
          )}
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingBottom: 20,
  },
  headerBackground: {
    width: '100%',
    height: 330,
  },
  headerContent: {
    paddingTop: 50,
    paddingHorizontal: 20,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePictureContainer: {
    width: 45,
    height: 45,
  },
  profilePicture: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  defaultProfilePicture: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  defaultProfileInitial: {
    fontSize: 22,
    fontFamily: 'Poppins_600SemiBold',
    color: '#13547D',
  },
  greetingTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerGreeting: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
    textAlign: 'center',
  },
  dataButton: {
    padding: 5,
  },
  greetingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 50,
  },
  greetingText: {
    fontSize: 25,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  mainContent: {
    flex: 1,
    marginTop: -30,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  gifContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    padding: 10,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
  },
  gifItem: {
    alignItems: 'center',
  },
  gif: {
    width: 75,
    height: 75,
    backgroundColor: '#13547D',
    borderRadius: 50,
  },
  gifLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: '#13547D',
    marginTop: 10,
  },
  recommendationContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 19,
    fontFamily: 'Poppins_600SemiBold',
    color: '#13547D',
    marginBottom: 10,
  },
  scrollContent: {
    paddingVertical: 10,
  },
  loader: {
    marginTop: 100,
  },
  noRecommendations: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  }
});

export default HomePage;