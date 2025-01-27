import React, { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { createEntry, updateEntry } from '../api';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { GooglePlacesAutocomplete } from 'react-native-google-places-autocomplete';

const AddEntry = ({ visible, onClose, journalId, entry }) => {
  const [description, setDescription] = useState('');
  const [dateTime, setDateTime] = useState(new Date());
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [entryImage, setEntryImage] = useState(null);
  const [locationModalVisible, setLocationModalVisible] = useState(false);

  const GOOGLE_API_KEY = 'AIzaSyAdI2mDEQkVWZ9XVPb5gh57nNuga6_nuUg';

  useEffect(() => {
    if (visible && !entry) {
      resetFields();
    }

    if (entry) {
      setDescription(entry.entry_description || '');
      setDateTime(new Date(entry.entry_datetime || Date.now()));
      setLocation(entry.entry_location ? JSON.parse(entry.entry_location) : null);
      setLocationName(entry.entry_location_name || '');

      if (entry.entry_image && entry.entry_image !== 'null') {
        const imageUrl = entry.entry_image.startsWith('http') || entry.entry_image.startsWith('/uploads') 
          ? `http://192.168.137.221:3000${entry.entry_image}` 
          : entry.entry_image;
        setEntryImage(imageUrl);
      } else {
        setEntryImage(null);
      }
    }
  }, [entry, visible]);

  const resetFields = () => {
    setDescription('');
    setLocation(null);
    setLocationName('');
    setEntryImage(null);
  };

  const handleSave = async () => {
    try {
      if (!description.trim()) {
        Alert.alert('Validation Error', 'Description cannot be empty.');
        return;
      }

      const entryData = {
        journal_id: journalId,
        entry_description: description,
        entry_datetime: dateTime.toISOString(),
        entry_location: location ? JSON.stringify(location) : null,
        entry_location_name: locationName || '',
        entry_image: entryImage ? entryImage : null,
      };

      if (entry) {
        await updateEntry(entry.entry_id, entryData);
        Alert.alert('Success', 'Entry updated successfully.');
      } else {
        await createEntry(entryData);
        Alert.alert('Success', 'Entry created successfully.');
      }

      onClose();
      resetFields();
    } catch (error) {
      console.error('Error saving entry:', error);
      Alert.alert('Error', 'An error occurred while saving the entry.');
    }
  };

  useEffect(() => {
    const interval = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera roll permissions are required to select an image.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled) {
      setEntryImage(result.assets[0].uri);
    }
  };

  const clearImage = () => {
    setEntryImage(null);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={styles.container}>
        <Text style={styles.title}>{entry ? 'Edit Entry' : 'New Entry'}</Text>

        <TextInput
          style={styles.input}
          placeholder="Describe your moment..."
          value={description}
          onChangeText={setDescription}
          multiline
          textAlignVertical="top"
        />

        <TouchableOpacity style={styles.addButton} onPress={() => setLocationModalVisible(true)}>
          <Ionicons name="location-sharp" size={20} color="#000" />
          <Text style={styles.addButtonText}>
            {locationName ? locationName : 'Add Location'} 
          </Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.addButton} onPress={pickImage}>
          <Ionicons name="images" size={20} color="#000" />
          <Text style={styles.addButtonText}>
            {entryImage ? 'Change Image' : 'Add Image'}
          </Text>
        </TouchableOpacity>

        {entryImage && (
          <View style={styles.imagePreviewContainer}>
            <Image source={{ uri: entryImage }} style={styles.imagePreview} />
            <TouchableOpacity onPress={clearImage} style={styles.clearImageButton}>
              <Ionicons name="close" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={() => {
              onClose();
              resetFields();
            }}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
            <Text style={styles.saveButtonText}>{entry ? 'Update' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        {/* Location Autocomplete Modal */}
        <Modal visible={locationModalVisible} animationType="slide" onRequestClose={() => setLocationModalVisible(false)}>
          <View style={styles.locationModal}>
            <Text style={styles.locationTitle}>Search for a Location</Text>

            <GooglePlacesAutocomplete
              placeholder="Search here. . ."
              fetchDetails={true}
              onPress={(data, details) => {
                setLocation({
                  latitude: details.geometry.location.lat,
                  longitude: details.geometry.location.lng,
                });
                setLocationName(data.description);
                setLocationModalVisible(false);
              }}
              query={{
                key: GOOGLE_API_KEY,
                language: 'en',
              }}
              styles={{
                textInput: styles.locationSearch,
                container: { flex: 1, marginBottom: 20 },
                listView: { backgroundColor: 'white' },
              }}
            />

            <TouchableOpacity onPress={() => setLocationModalVisible(false)} style={styles.closeModalButton}>
              <Text style={styles.closeModalButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        </Modal>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 24,
    fontWeight: '600',
    marginBottom: 20,
    color: '#333',
    fontFamily: 'Poppins_600SemiBold',
  },
  input: {
    height: 300,
    padding: 15,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    marginBottom: 20,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    borderColor: '#dcdcdc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 5,
  },
  addButtonText: {
    marginLeft: 20,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
    color: '#333',
  },
  imagePreviewContainer: {
    alignItems: 'center',
    marginVertical: 10,
  },
  imagePreview: {
    width: 180,
    height: 180,
  },
  clearImageButton: {
    position: 'absolute',
    top: -5,
    right: 5,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 15,
    width: 30,
    height: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 30,
  },
  button: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  saveButton: {
    backgroundColor: '#5a67d8',
  },
  cancelButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#dcdcdc',
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },
  cancelButtonText: {
    color: '#333',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },
  locationModal: {
    flex: 1,
    padding: 20,
    backgroundColor: '#fff',
  },
  locationTitle: {
    fontSize: 20,
    marginBottom: 20,
    fontFamily: 'Poppins_600SemiBold',
  },
  locationSearch: {
    height: 40,
    borderWidth: 1,
    borderColor: '#dcdcdc',
    padding: 10,
    marginBottom: 20,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
  },
  closeModalButton: {
    padding: 15,
    backgroundColor: '#5a67d8',
    borderRadius: 8,
    marginBottom: 50,
  },
  closeModalButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },
});

export default AddEntry;
