import React, { useState, useEffect, useCallback } from 'react';
import { Modal, View, Text, TextInput, StyleSheet, TouchableOpacity, Alert, Image, ScrollView, FlatList, ActivityIndicator, BackHandler, Switch } from 'react-native';
import { createEntry, updateEntry, fetchLocations } from '../api';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Tooltip from './Tooltip';

const AddEntry = ({ visible, onClose, journalId, entry }) => {
  const [description, setDescription] = useState('');
  const [dateTime, setDateTime] = useState(new Date());
  const [location, setLocation] = useState(null);
  const [locationName, setLocationName] = useState('');
  const [locationId, setLocationId] = useState(null);
  const [entryImages, setEntryImages] = useState([]);
  const [locationModalVisible, setLocationModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [locations, setLocations] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipText, setTooltipText] = useState('');
  const [tooltipPosition, setTooltipPosition] = useState('bottom');
  const [draftSaved, setDraftSaved] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [displayImagesInRecommendation, setDisplayImagesInRecommendation] = useState(true);
  const [imageOptionsVisible, setImageOptionsVisible] = useState(false);
  
  const [initialData, setInitialData] = useState({
    description: '',
    locationName: '',
    locationId: null,
    entryImages: [],
    displayImagesInRecommendation: true,
  });

  const loadLocations = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchLocations();
      setLocations(data);
    } catch (err) {
      setError('Failed to load locations. Please try again.');
      showTooltip('Failed to load locations. Please try again.', 'top');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const checkForDrafts = async () => {
      if (entry) return; 
      
      try {
        const draft = await AsyncStorage.getItem(`draft_${journalId}`);
        if (draft) {
          setHasDraft(true);
        }
      } catch (error) {
        console.error('Error checking for drafts:', error);
      }
    };
    
    if (visible) {
      checkForDrafts();
    }
  }, [journalId, visible, entry]);

  useEffect(() => {
    if (locationModalVisible) {
      loadLocations();
    }
  }, [locationModalVisible]);

  useEffect(() => {
    if (visible && !entry) {
      resetFields();
      setInitialData({
        description: '',
        locationName: '',
        locationId: null,
        entryImages: [],
        displayImagesInRecommendation: true,
      });
    }

    if (entry) {
      const entryDesc = entry.entry_description || '';
      const entryLocationName = entry.entry_location_name || '';
      const entryLocationId = entry.location_id || null;
      const parsedLocation = entry.entry_location ? JSON.parse(entry.entry_location) : null;
      const showInRecommendation = entry.display_images_in_recommendation !== false;
      
      setDescription(entryDesc);
      setDateTime(new Date(entry.entry_datetime || Date.now()));
      setLocation(parsedLocation);
      setLocationName(entryLocationName);
      setLocationId(entryLocationId);
      setDisplayImagesInRecommendation(showInRecommendation);

      let images = [];
      if (entry.entry_images && entry.entry_images !== 'null') {
        images = JSON.parse(entry.entry_images).map(img => 
          img.startsWith('http') ? img : `http://192.168.1.3:3000${img}`
        );
      }
      setEntryImages(images);
      setInitialData({
        description: entryDesc,
        locationName: entryLocationName,
        locationId: entryLocationId,
        entryImages: images,
        displayImagesInRecommendation: showInRecommendation,
      });
      
      if (images.length > 0) {
        setImageOptionsVisible(true);
      }
    }
    
    setHasUnsavedChanges(false);
  }, [entry, visible]);
  
  useEffect(() => {
    if (visible) {
      const hasChanges = 
        description !== initialData.description ||
        locationName !== initialData.locationName ||
        locationId !== initialData.locationId ||
        displayImagesInRecommendation !== initialData.displayImagesInRecommendation ||
        JSON.stringify(entryImages) !== JSON.stringify(initialData.entryImages);
      
      setHasUnsavedChanges(hasChanges);
    }
  }, [description, locationName, locationId, entryImages, displayImagesInRecommendation, visible, initialData]);

  useEffect(() => {
    const backAction = () => {
      if (visible && hasUnsavedChanges) {
        showUnsavedChangesAlert();
        return true; 
      }
      return false;
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [visible, hasUnsavedChanges]);

  useEffect(() => {
    if (!visible || !hasUnsavedChanges) return;
    
    const interval = setInterval(() => {
      saveDraft();
    }, 30000);
    
    return () => clearInterval(interval);
  }, [visible, hasUnsavedChanges, description, locationName, locationId, entryImages, displayImagesInRecommendation]);

  useEffect(() => {
    const interval = setInterval(() => setDateTime(new Date()), 1000);
    return () => clearInterval(interval);
  }, []);

  const saveDraft = useCallback(() => {
    if (!description && !locationName && entryImages.length === 0) return;
    if (entry) return; 
    
    const draftData = {
      description,
      locationName,
      locationId,
      location,
      entryImages,
      displayImagesInRecommendation,
      dateTime: dateTime.toISOString()
    };
    
    try {
      AsyncStorage.setItem(`draft_${journalId}`, JSON.stringify(draftData));
      setDraftSaved(true);
      
      setTimeout(() => {
        setDraftSaved(false);
      }, 2000);
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  }, [description, locationName, locationId, location, entryImages, displayImagesInRecommendation, dateTime, journalId, entry]);

  const loadDraft = async () => {
    try {
      const draftData = await AsyncStorage.getItem(`draft_${journalId}`);
      if (draftData) {
        const parsed = JSON.parse(draftData);
        setDescription(parsed.description || '');
        setLocationName(parsed.locationName || '');
        setLocationId(parsed.locationId);
        setLocation(parsed.location);
        setEntryImages(parsed.entryImages || []);
        setDisplayImagesInRecommendation(parsed.displayImagesInRecommendation !== false);
        setDateTime(new Date(parsed.dateTime || Date.now()));
        setHasDraft(false);
        
        if (parsed.entryImages && parsed.entryImages.length > 0) {
          setImageOptionsVisible(true);
        }
      }
    } catch (error) {
      console.error('Error loading draft:', error);
      showTooltip('Error loading draft', 'top');
    }
  };

  const discardDraft = async () => {
    try {
      await AsyncStorage.removeItem(`draft_${journalId}`);
      setHasDraft(false);
    } catch (error) {
      console.error('Error removing draft:', error);
    }
  };

  const resetFields = () => {
    setDescription('');
    setLocation(null);
    setLocationName('');
    setLocationId(null);
    setEntryImages([]);
    setSearchQuery('');
    setDisplayImagesInRecommendation(true);
    setImageOptionsVisible(false);
  };

  const showTooltip = (text, position = 'bottom') => {
    setTooltipText(text);
    setTooltipPosition(position);
    setTooltipVisible(true);
    
    setTimeout(() => {
      setTooltipVisible(false);
    }, 3000);
  };

  const showUnsavedChangesAlert = () => {
    Alert.alert(
      'Unsaved Changes',
      'You have unsaved changes. Do you want to save before exiting?',
      [
        {
          text: 'Discard',
          style: 'destructive',
          onPress: () => {
            resetFields();
            if (!entry) {
              saveDraftBeforeDiscard();
            }
            onClose();
          },
        },
        { 
          text: 'Cancel', 
          style: 'cancel' 
        },
        {
          text: 'Save & Exit',
          style: 'default',
          onPress: handleSave,
        },
      ]
    );
  };

  const saveDraftBeforeDiscard = () => {
    if (description || locationName || entryImages.length > 0) {
      saveDraft();
      showTooltip('Changes saved as draft', 'top');
    }
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      showUnsavedChangesAlert();
    } else {
      onClose();
    }
  };

  const handleSave = async () => {
    try {
      if (!description.trim()) {
        showTooltip('Description cannot be empty', 'top');
        return;
      }
  
      const entryData = {
        journal_id: journalId,
        entry_description: description,
        entry_datetime: dateTime.toISOString().slice(0,19).replace("T"," "),
        entry_location: location ? JSON.stringify(location) : null,
        entry_location_name: locationName || '',
        location_id: locationId,
        entry_images: entryImages.length > 0 ? entryImages : [],
        display_images_in_recommendation: displayImagesInRecommendation,
      };
      
      if (entry) {
        await updateEntry(entry.entry_id, entryData);
        showTooltip('Entry updated successfully');
      } else {
        await createEntry(entryData);
        showTooltip('Entry created successfully');
        discardDraft();
      }
  
      setHasUnsavedChanges(false);
      onClose();
      resetFields();
    } catch (error) {
      console.error('🚨 Error saving entry:', error);
      showTooltip('Error saving entry. Please try again.');
    }
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      showTooltip('Camera roll permissions are required to select images');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        selectionLimit: 5,
        aspect: [4, 3],
        quality: 1,
      });

      if (!result.canceled) {
        const unsupportedFormats = result.assets.filter(asset => 
          !asset.uri.toLowerCase().endsWith('.jpg') && 
          !asset.uri.toLowerCase().endsWith('.png') && 
          !asset.uri.toLowerCase().endsWith('.jpeg')
        );
        
        if (unsupportedFormats.length > 0) {
          showTooltip('Only JPG and PNG formats are supported');
          return;
        }
        
        if (entryImages.length + result.assets.length > 5) {
          showTooltip('Maximum 5 images allowed');
          const remaining = 5 - entryImages.length;
          const newImages = result.assets.slice(0, remaining).map(asset => asset.uri);
          setEntryImages(prevImages => [...prevImages, ...newImages]);
          return;
        }
        
        const newImages = result.assets.map(asset => asset.uri);
        setEntryImages(prevImages => [...prevImages, ...newImages]);
        
        if (entryImages.length === 0 && newImages.length > 0) {
          setImageOptionsVisible(true);
        }
      }
    } catch (error) {
      console.error('Error picking images:', error);
      showTooltip('Error selecting images');
    }
  };

  const removeImage = (index) => {
    setEntryImages(prevImages => prevImages.filter((_, i) => i !== index));
    if (entryImages.length === 1) {
      setImageOptionsVisible(false);
    }
  };

  const filteredLocations = locations.filter(loc => 
    loc.location_place.toLowerCase().includes(searchQuery.toLowerCase()) ||
    loc.location_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const renderLocationItem = ({ item }) => (
    <TouchableOpacity
      style={styles.locationItem}
      onPress={() => {
        setLocation({
          latitude: item.latitude,
          longitude: item.longitude,
        });
        setLocationName(`${item.location_name}, ${item.location_place}`);
        setLocationId(item.location_id);
        setLocationModalVisible(false);
        setSearchQuery('');
      }}
    >
      <Ionicons name="location-sharp" size={25} color="#666" style={styles.locationIcon} />
      <View style={styles.locationTextContainer}>
        <Text style={styles.locationPlace}>{item.location_name}</Text>
        <Text style={styles.locationDetail}>{item.location_place}</Text>
      </View>
    </TouchableOpacity>
  );

  const renderLocationList = () => {
    if (isLoading) {
      return (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#5a67d8" />
          <Text style={styles.loadingText}>Loading locations...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={loadLocations}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (filteredLocations.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No locations found matching "{searchQuery}"</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={filteredLocations}
        renderItem={renderLocationItem}
        keyExtractor={(item) => `${item.location_id}`}
        style={styles.locationList}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
    );
  };

  const toggleImageOptions = () => {
    setImageOptionsVisible(!imageOptionsVisible);
  };

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={handleClose}>
      <View style={styles.container}>
        {hasDraft && (
          <View style={styles.draftNotice}>
            <Text style={styles.draftText}>You have an unsaved draft</Text>
            <View style={styles.draftButtons}>
              <TouchableOpacity onPress={loadDraft} style={styles.draftButton}>
                <Text style={styles.draftButtonText}>Load Draft</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                onPress={discardDraft} 
                style={[styles.draftButton, styles.discardButton]}
              >
                <Text style={styles.draftButtonText}>Discard</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {draftSaved && (
          <View style={styles.draftSavedIndicator}>
            <Text style={styles.draftSavedText}>Draft saved</Text>
          </View>
        )}

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
          <Ionicons name="location-sharp" size={20} color="#13547D" />
          <Text style={styles.addButtonText}>
            {locationName ? locationName : 'Add Location'} 
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.addButton} 
          onPress={pickImages}
        >
          <Ionicons name="images" size={20} color="#13547D" />
          <Text style={styles.addButtonText}>
            {entryImages.length > 0 
              ? `Images (${entryImages.length}/5)` 
              : 'Add Images'}
          </Text>
          {entryImages.length > 0 && (
            <TouchableOpacity 
              onPress={toggleImageOptions}
              style={styles.imageSettingsButton}
            >
              <Ionicons name="settings-outline" size={16} color="#666" />
            </TouchableOpacity>
          )}
        </TouchableOpacity>

        {imageOptionsVisible && entryImages.length > 0 && (
          <View style={styles.imageOptionsContainer}>
            <Text style={styles.imageOptionsTitle}>Image Privacy Settings</Text>
            <View style={styles.optionRow}>
              <Text style={styles.optionText}>Share my photos with other travelers</Text>
              <Switch
                value={displayImagesInRecommendation}
                onValueChange={setDisplayImagesInRecommendation}
                trackColor={{ false: "#767577", true: "#13547D" }}
                thumbColor="#f4f3f4"
              />
            </View>
            <Text style={styles.optionDescription}>
              {displayImagesInRecommendation 
                ? "Your photos will be visible to other users when this location is recommended" 
                : "Your photos will remain private and won't be shown to other users"}
            </Text>
          </View>
        )}

        {entryImages.length > 0 && (
          <ScrollView horizontal style={styles.imagePreviewScroll}>
            {entryImages.map((image, index) => (
              <View key={index} style={styles.imagePreviewContainer}>
                <Image source={{ uri: image }} style={styles.imagePreview} />
                <TouchableOpacity 
                  onPress={() => removeImage(index)} 
                  style={styles.clearImageButton}
                >
                  <Ionicons name="close" size={20} color="#fff" />
                </TouchableOpacity>
                {index === 0 && !displayImagesInRecommendation && (
                  <View style={styles.privateImageBadge}>
                    <Ionicons name="lock-closed" size={14} color="#fff" />
                  </View>
                )}
              </View>
            ))}
          </ScrollView>
        )}

        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton]}
            onPress={handleClose}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity style={[styles.button, styles.saveButton]} onPress={handleSave}>
            <Text style={styles.saveButtonText}>{entry ? 'Update' : 'Save'}</Text>
          </TouchableOpacity>
        </View>

        <Tooltip
          visible={tooltipVisible}
          text={tooltipText}
          position={tooltipPosition}
          onHide={() => setTooltipVisible(false)}
        />

        <Modal visible={locationModalVisible} animationType="slide" onRequestClose={() => setLocationModalVisible(false)}>
          <View style={styles.locationModal}>
            <Text style={styles.locationTitle}>Select a Location</Text>

            <TextInput
              style={styles.searchInput}
              placeholder="Search locations..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              autoCapitalize="none"
            />

            {renderLocationList()}

            <TouchableOpacity 
              style={styles.closeModalButton}
              onPress={() => {
                setLocationModalVisible(false);
                setSearchQuery('');
              }}
            >
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
    flex: 1,
  },
  imageSettingsButton: {
    padding: 8,
  },
  imageOptionsContainer: {
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  imageOptionsTitle: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Poppins_600SemiBold',
  },
  optionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 14,
    color: '#333',
    fontFamily: 'Poppins_400Regular',
  },
  optionDescription: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
    fontStyle: 'italic',
  },
  imagePreviewScroll: {
    flexGrow: 0,
    marginVertical: 10,
  },
  imagePreviewContainer: {
    marginRight: 10,
    position: 'relative',
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  clearImageButton: {
    position: 'absolute',
    top: -5,
    right: -5,
    backgroundColor: 'rgba(0,0,0,0.7)',
    borderRadius: 12,
    width: 24,
    height: 24,
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
    backgroundColor: '#237CA2',
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
  searchInput: {
    height: 40,
    borderWidth: 1,
    borderColor: '#dcdcdc',
    borderRadius: 8,
    padding: 10,
    marginBottom: 15,
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
  },
  locationList: {
    flex: 1,
  },
  locationItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
  },
  locationIcon: {
    marginRight: 15,
  },
  locationTextContainer: {
    flex: 1,
  },
  locationPlace: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#333',
  },
  locationDetail: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    marginTop: 2,
  },
  separator: {
    height: 1,
    backgroundColor: '#f0f0f0',
  },
  closeModalButton: {
    padding: 15,
    backgroundColor: '#13547D',
    borderRadius: 8,
    marginTop: 15,
  },
  closeModalButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  loadingText: {
    marginTop: 10,
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#dc2626',
    marginBottom: 10,
    textAlign: 'center',
  },
  retryButton: {
    padding: 10,
    backgroundColor: '#5a67d8',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
  },
  draftNotice: {
    backgroundColor: '#f8f4e3',
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    borderLeftWidth: 4,
    borderLeftColor: '#13547D',
  },
  draftText: {
    fontWeight: '500',
    marginBottom: 8,
  },
  draftButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
  },
  draftButton: {
    backgroundColor: '#13547D',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    marginLeft: 10,
  },
  draftButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  discardButton: {
    backgroundColor: '#888',
  },
  draftSavedIndicator: {
    position: 'absolute',
    top: 10,
    right: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    zIndex: 999,
  },
  draftSavedText: {
    color: '#fff',
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    textAlign: 'center',
  },
});

export default AddEntry;