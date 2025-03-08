// src/screens/Settings.js
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Linking } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { useNavigation } from '@react-navigation/native';
import { getCurrentUser, logoutUser  } from '../api';

const Settings = () => {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });
  
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({ name: 'Guest User', email: 'Personal Info' });
  const [profileLoading, setProfileLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    // Fetch user profile data when component mounts
    const fetchUserProfile = async () => {
      try {
        setProfileLoading(true);
        const userProfile = await getCurrentUser();
        setUserData({
          name: userProfile.name,
          email: userProfile.email
        });
      } catch (error) {
        console.error('Failed to load user profile:', error);
        // Keep default values if there's an error
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  if (!fontsLoaded) return null;

  const handleLogout = async () => {
    setLoading(true);
    try {
      const success = await logoutUser();
      if (success) {
        setTimeout(() => {
          setLoading(false);
          navigation.replace('GetStarted');
        }, 3000);
      } else {
        console.error('Failed to logout');
        setLoading(false);
      }
    } catch (error) {
      console.error('Error during logout:', error);
      setLoading(false);
    }
  };
  
  const handleOpenLink = () => {
    Linking.openURL('https://docs.google.com/forms/d/e/1FAIpQLScZFB56ksHBmvuxwwgqMajNwbLJ9GVB78dfPbbiUmRy5sHgDA/viewform');
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.featureButton}>
          <View style={styles.manageAccountInfo}>
            {profileLoading ? (
              <ActivityIndicator size="small" color="#13547D" />
            ) : (
              <>
                <Text style={styles.username}>{userData.name}</Text>
                <Text style={styles.personalInfoText}>{userData.email}</Text>
              </>
            )}
          </View>
        </View>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>General</Text>
        <TouchableOpacity style={styles.featureButton} onPress={handleLogout}>
          <Icon name="log-out" size={24} color="#000" />
          {loading ? (
            <ActivityIndicator size="small" color="#000" style={styles.loadingSpinner} />
          ) : (
            <Text style={styles.featureText}>Log Out</Text>
          )}
          <Icon name="chevron-forward-outline" size={20} color="#ccc" style={styles.arrowIcon} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.featureButton}>
          <Icon name="trash-outline" size={24} color="red" />
          <Text style={styles.featureDelete}>Delete Account</Text>
          <Icon name="chevron-forward-outline" size={20} color="#ccc" style={styles.arrowIcon} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.featureButton} onPress={handleOpenLink}>
          <Icon name="document-text-outline" size={24} color="#000" />
          <Text style={styles.featureText}>Evaluation Form</Text>
          <Icon name="chevron-forward-outline" size={20} color="#ccc" style={styles.arrowIcon} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 20,
    paddingTop: 50,
  },
  title: {
    fontSize: 35,
    color: '#13547D',
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 50,
  },
  manageAccountInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  username: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#13547D',
  },
  personalInfoText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#ccc',
  },
  sectionContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#13547D',
    fontFamily: 'Poppins_400Regular',
    marginBottom: 10,
  },
  featureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 15,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f9f9f9',
  },
  featureText: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    marginLeft: 20,
    flex: 1,
    color: '#13547D',
  },
  featureDelete: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    marginLeft: 20,
    flex: 1,
    color: 'red',
  },
  arrowIcon: {
    marginLeft: 'auto',
  },
  loadingSpinner: {
    marginLeft: 20,
    marginRight: 'auto',
  },
});

export default Settings;