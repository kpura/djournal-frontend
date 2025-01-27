import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, Image, RefreshControl, TouchableOpacity } from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { Ionicons } from '@expo/vector-icons'; 
import Recommendation from '../components/Recommendation';
import { useNavigation } from '@react-navigation/native';

const HomePage = () => {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  const [greeting, setGreeting] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation(); 

  useEffect(() => {

    // Set greeting message based on time of day
    const hour = new Date().getHours();
    if (hour < 12) {
      setGreeting('Good Morning');
    } else if (hour < 18) {
      setGreeting('Good Afternoon');
    } else {
      setGreeting('Good Evening');
    }
  }, []);

  const recommendations = [
    {
      id: 1,
      image: require('../../assets/palawan.jpg'),
      name: 'Coron Bay',
      location: 'Palawan, Philippines',
      description: 'Coron Bay is known for its crystal-clear waters, vibrant coral reefs, and stunning limestone formations.',
    },
    {
      id: 2,
      image: require('../../assets/rice.jpeg'),
      name: 'Banaue Rice Terraces',
      location: 'Ifugao, Philippines',
      description: 'Banaue Rice Terraces are 2,000-year-old terraces carved into the mountains of Ifugao.',
    },
    {
      id: 3,
      image: require('../../assets/lakesebu.jpg'),
      name: 'Lake Sebu',
      location: 'South Cotabato, Philippines',
      description: 'Lake Sebu is a tranquil freshwater lake surrounded by rolling hills and the cultural heritage of the Tboli people.',
    },
  ];

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => {
      setRefreshing(false);
    }, 2000);
  };

  const handleImagePress = (id) => {
    const selectedPlace = recommendations.find((place) => place.id === id);
    navigation.navigate('PlaceDetail', { place: selectedPlace });
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <ScrollView
      contentContainerStyle={styles.scrollViewContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <View style={styles.container}>
        <View style={styles.headerContainer}>
          <View style={styles.headerTop}>
            <View style={styles.profileContainer}>
              <Image
                source={require('../../assets/default-profile.jpg')}
                style={styles.profilePicture}
              />
            </View>
            <TouchableOpacity
              style={styles.notificationButton}
              onPress={() => navigation.navigate('Notifications')}
            >
              <Ionicons name="notifications" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
          <View style={styles.greetingContainer}>
            <Text style={styles.greetingText}>{greeting}</Text>
          </View>
        </View>

        <View style={styles.additionalContainer}>
          <View style={styles.gifContainer}>
            <View style={styles.gifItem}>
              <Image
                source={require('../../assets/joyful.png')}
                style={styles.gif}
              />
              <Text style={styles.gifLabel}>Joyful</Text>
            </View>
            <View style={styles.gifItem}>
              <Image
                source={require('../../assets/content.png')}
                style={styles.gif}
              />
              <Text style={styles.gifLabel}>Content</Text>
            </View>
            <View style={styles.gifItem}>
              <Image
                source={require('../../assets/uncertain.png')}
                style={styles.gif}
              />
              <Text style={styles.gifLabel}>Uncertain</Text>
            </View>
          </View>
        </View>

        <View style={styles.RecommendationsContainer}>
        <Recommendation
          recommendations={recommendations}
          onImagePress={handleImagePress}
        />
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  scrollViewContainer: {
    flexGrow: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#525fe1',
    paddingTop: 70,
    paddingHorizontal: 16,
  },
  headerContainer: {
    marginBottom: 50,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  profileContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  profilePicture: {
    width: 40,
    height: 40,
    borderRadius: 25,
    marginRight: 10,
  },
  notificationButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#6c79e0',
  },
  greetingContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    justifyContent: 'center',
  },
  greetingText: {
    fontSize: 30,
    fontFamily: 'Poppins_600SemiBold',
    color: '#fff',
  },
  travellerText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#fff',
  },
  RecommendationsContainer: {
    marginTop: 50,
    padding: 10,
    backgroundColor: '#fff',
    borderTopRightRadius: 35,
    borderTopLeftRadius: 35,
    width: '108%',
    height: '200%',
    alignSelf: 'center',
  },
  additionalContainer: {
    borderRadius: 30,
    height: 100,
    width: '100%',
    alignSelf: 'center',
  },
  gifContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  gifItem: {
    alignItems: 'center',
  },
  gif: {
    width: 80,
    height: 80,
    backgroundColor: '#7b9acc',
    borderRadius: 50,
  },
  gifLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: '#e3e3e3',
    marginTop: 10,
  },
});

export default HomePage;
