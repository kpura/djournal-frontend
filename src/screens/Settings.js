// src/screens/Settings.js
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { useNavigation } from '@react-navigation/native';

const Settings = () => {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });
  
  const [loading, setLoading] = useState(false);
  const navigation = useNavigation();

  if (!fontsLoaded) return null;

  const handleLogout = async () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      navigation.replace('AuthOptions');
    }, 3000);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Account</Text>
        <TouchableOpacity style={styles.featureButton}>
          <Image
            source={require('../../assets/default-profile.jpg')}
            style={styles.smallProfileImage}
          />
          <View style={styles.manageAccountInfo}>
            <Text style={styles.username}>Guest User</Text>
            <Text style={styles.personalInfoText}>Personal Info</Text>
          </View>
          <Icon name="chevron-forward-outline" size={20} color="#ccc" style={styles.arrowIcon} />
        </TouchableOpacity>
      </View>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>General</Text>
        <TouchableOpacity style={styles.featureButton}>
          <Icon name="images" size={24} color="#000" />
          <Text style={styles.featureText}>Photos</Text>
          <Icon name="chevron-forward-outline" size={20} color="#ccc" style={styles.arrowIcon} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.featureButton}>
          <Icon name="lock-closed" size={24} color="#000" />
          <Text style={styles.featureText}>Password</Text>
          <Icon name="chevron-forward-outline" size={20} color="#ccc" style={styles.arrowIcon} />
        </TouchableOpacity>

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
      </View>

      {/* Feedback Section */}
      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Feedback</Text>
        <TouchableOpacity style={styles.featureButton}>
          <Icon name="bug" size={24} color="#000" />
          <Text style={styles.featureText}>Report a Bug</Text>
          <Icon name="chevron-forward-outline" size={20} color="#ccc" style={styles.arrowIcon} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.featureButton}>
          <Icon name="chatbubbles" size={24} color="#000" />
          <Text style={styles.featureText}>Send Feedback</Text>
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
    paddingTop: 70,
  },
  title: {
    fontSize: 32,
    color: '#000',
    fontFamily: 'Poppins_600SemiBold',
    marginBottom: 20,
  },
  smallProfileImage: {
    width: 50,
    height: 50,
    borderRadius: 50,
  },
  manageAccountInfo: {
    marginLeft: 20,
    flex: 1,
  },
  username: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
  },
  personalInfoText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#555',
  },
  sectionContainer: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 14,
    color: '#333',
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
