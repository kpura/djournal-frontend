import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ActivityIndicator, Linking, Alert } from 'react-native';
import Icon from 'react-native-vector-icons/Ionicons';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { useNavigation } from '@react-navigation/native';
import { getCurrentUser, logoutUser, uploadProfilePicture } from '../api';
import * as ImagePicker from 'expo-image-picker';

const Settings = () => {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });
  
  const [loading, setLoading] = useState(false);
  const [uploadLoading, setUploadLoading] = useState(false);
  const [userData, setUserData] = useState({ name: 'Guest User', email: 'Personal Info', profile_picture: null });
  const [profileLoading, setProfileLoading] = useState(true);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setProfileLoading(true);
        const userProfile = await getCurrentUser();
        setUserData({
          name: userProfile.name,
          email: userProfile.email,
          profile_picture: userProfile.profile_picture
        });
      } catch (error) {
        console.error('Failed to load user profile:', error);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  useEffect(() => {
    (async () => {
      const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission Denied', 'We need camera roll permissions to change your profile picture.');
      }
    })();
  }, []);

  const handlePickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.8,
      });

      if (!result.canceled) {
        await handleUploadImage(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image.');
    }
  };

  const handleUploadImage = async (imageUri) => {
    setUploadLoading(true);
    try {
      // Create a form data object to send the image
      const formData = new FormData();
      const filename = imageUri.split('/').pop();
      const match = /\.(\w+)$/.exec(filename);
      const type = match ? `image/${match[1]}` : 'image';
      
      formData.append('profile_picture', {
        uri: imageUri,
        name: filename,
        type,
      });

      const updatedProfile = await uploadProfilePicture(formData);
      
      if (updatedProfile && updatedProfile.profile_picture) {
        setUserData(prev => ({
          ...prev,
          profile_picture: updatedProfile.profile_picture
        }));
        Alert.alert('Success', 'Profile picture updated successfully!');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Error', 'Failed to upload profile picture.');
    } finally {
      setUploadLoading(false);
    }
  };

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

  const getProfileImageSource = () => {
    if (userData.profile_picture) {
      return { uri: `http://192.168.1.11:3000${userData.profile_picture}` };
    }
    return require('../../assets/default-avatar.png');
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Settings</Text>

      <View style={styles.sectionContainer}>
        <Text style={styles.sectionTitle}>Account</Text>
        <View style={styles.featureButton}>
          <TouchableOpacity 
            style={styles.profileImageContainer}
            onPress={handlePickImage}
            disabled={uploadLoading}
          >
            {uploadLoading ? (
              <ActivityIndicator size="small" color="#13547D" style={styles.profileImage} />
            ) : (
              <Image 
                source={getProfileImageSource()} 
                style={styles.profileImage}
              />
            )}
            <View style={styles.editIconContainer}>
              <Icon name="camera" size={14} color="#fff" />
            </View>
          </TouchableOpacity>
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

        <TouchableOpacity style={styles.featureButton} onPress={handleOpenLink}>
          <Icon name="document-text-outline" size={24} color="#000" />
          <Text style={styles.featureText}>Evaluation Form</Text>
          <Icon name="chevron-forward-outline" size={20} color="#ccc" style={styles.arrowIcon} />
        </TouchableOpacity>

        <TouchableOpacity style={styles.featureButton} onPress={() => Linking.openURL('https://djournalmood.com')}>
          <Icon name="globe-outline" size={24} color="#000" />
          <Text style={styles.featureText}>Website Link</Text>
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
    marginLeft: 15,  // Add margin for spacing between image and text
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
  profileImageContainer: {
    position: 'relative',
    width: 60,
    height: 60,
    borderRadius: 30,
    overflow: 'visible',
  },
  profileImage: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 2,
    borderColor: '#13547D',
  },
  editIconContainer: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    backgroundColor: '#13547D',
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
});

export default Settings;