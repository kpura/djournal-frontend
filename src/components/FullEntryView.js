import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Modal, ImageBackground } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import AsyncStorage from '@react-native-async-storage/async-storage';

const FullEntryView = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { entry } = route.params;

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  const [backgroundColor, setBackgroundColor] = useState('#ffffff');
  const [alignment, setAlignment] = useState('left');
  const [textCase, setTextCase] = useState('normal');
  const [fontStyle, setFontStyle] = useState('normal');
  const [backgroundModalVisible, setBackgroundModalVisible] = useState(false);
  const [customizationModalVisible, setCustomizationModalVisible] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState(null); 

  useEffect(() => {
    const loadSettings = async () => {
      try {
        const savedColor = await AsyncStorage.getItem(`backgroundColor_${entry.entry_id}`);
        if (savedColor) setBackgroundColor(savedColor);

        const savedAlignment = await AsyncStorage.getItem(`alignment_${entry.entry_id}`);
        if (savedAlignment) setAlignment(savedAlignment);

        const savedTextCase = await AsyncStorage.getItem(`textCase_${entry.entry_id}`);
        if (savedTextCase) setTextCase(savedTextCase);

        const savedFontStyle = await AsyncStorage.getItem(`fontStyle_${entry.entry_id}`);
        if (savedFontStyle) setFontStyle(savedFontStyle);

        const savedBackground = await AsyncStorage.getItem(`backgroundImage_${entry.entry_id}`);
        if (savedBackground) setSelectedBackground(JSON.parse(savedBackground));
      } catch (error) {
        console.error('Error loading settings:', error);
      }
    };
    loadSettings();
  }, [entry.entry_id]);

  const saveColor = async (color) => {
    try {
      await AsyncStorage.setItem(`backgroundColor_${entry.entry_id}`, color);
      setBackgroundColor(color);
      setSelectedBackground(null); 
      await AsyncStorage.removeItem(`backgroundImage_${entry.entry_id}`);
    } catch (error) {
      console.error('Error saving color:', error);
    }
  };

  const saveImage = async (image) => {
    try {
      await AsyncStorage.setItem(`backgroundImage_${entry.entry_id}`, JSON.stringify(image));
      setSelectedBackground(image);
      setBackgroundColor(null); 
      await AsyncStorage.removeItem(`backgroundColor_${entry.entry_id}`);
    } catch (error) {
      console.error('Error saving image:', error);
    }
  };

  const saveAlignment = async (align) => {
    await AsyncStorage.setItem(`alignment_${entry.entry_id}`, align);
    setAlignment(align);
  };

  const saveTextCase = async (caseType) => {
    await AsyncStorage.setItem(`textCase_${entry.entry_id}`, caseType);
    setTextCase(caseType);
  };

  const saveFontStyle = async (style) => {
    await AsyncStorage.setItem(`fontStyle_${entry.entry_id}`, style);
    setFontStyle(style);
  };

  if (!fontsLoaded) {
    return null;
  }

  const renderSentiment = () => {
    if (entry.sentiment) {
      return (
        <View style={styles.sentimentContainer}>
          <View style={styles.sentimentPercentages}>
            <Text style={styles.percentageText}>
              {'Positive: ' + entry.positive_percentage + '%'}
            </Text>
            <Text style={styles.percentageText}>
              {'Negative: ' + entry.negative_percentage + '%'}
            </Text>
            <Text style={styles.percentageText}>
              {'Neutral: ' + entry.neutral_percentage + '%'}
            </Text>
          </View>
        </View>
      );
    }
    return null;
  };

  return (
    <View style={styles.container}>
      {selectedBackground ? (
        <ImageBackground 
          source={selectedBackground}
          style={styles.backgroundImage}
          resizeMode="cover"
        >
          <View style={[styles.overlay, { backgroundColor: 'rgba(255, 255, 255, 0.7)' }]}>
            <View style={styles.header}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <FontAwesome5 name="arrow-left" size={18} color="#000" />
              </TouchableOpacity>
  
              <View style={styles.buttonContainer}>
                <TouchableOpacity onPress={() => setBackgroundModalVisible(true)} style={styles.customizeButton}>
                  <FontAwesome5 name="palette" size={18} color="#000" />
                </TouchableOpacity>
  
                <TouchableOpacity onPress={() => setCustomizationModalVisible(true)} style={styles.customizeButton}>
                  <FontAwesome5 name="font" size={18} color="#000" />
                </TouchableOpacity>
              </View>
            </View>
            
            <ScrollView>
              <View style={styles.entryDetails}>
                <Text
                  style={[
                    styles.entryDescription,
                    { 
                      textAlign: alignment, 
                      textTransform: textCase, 
                      fontStyle: fontStyle === 'italic' ? 'italic' : 'normal', 
                      fontWeight: fontStyle === 'bold' ? 'bold' : 'normal' 
                    }
                  ]}
                >
                  {entry.entry_description}
                </Text>
  
                {entry.entry_image && entry.entry_image !== 'null' && (
                  <Image 
                    source={{ uri: `http://192.168.137.221:3000${entry.entry_image}` }} 
                    style={styles.entryImage}
                  />
                )}
  
                {renderSentiment()}
              </View>
            </ScrollView>
          </View>
        </ImageBackground>
      ) : (
        <View style={[styles.container, { backgroundColor }]}>
          <View style={styles.header}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <FontAwesome5 name="arrow-left" size={18} color="#000" />
            </TouchableOpacity>
  
            <View style={styles.buttonContainer}>
              <TouchableOpacity onPress={() => setBackgroundModalVisible(true)} style={styles.customizeButton}>
                <FontAwesome5 name="palette" size={18} color="#000" />
              </TouchableOpacity>
  
              <TouchableOpacity onPress={() => setCustomizationModalVisible(true)} style={styles.customizeButton}>
                <FontAwesome5 name="font" size={18} color="#000" />
              </TouchableOpacity>
            </View>
          </View>
  
          <ScrollView>
            <View style={styles.entryDetails}>
              <Text
                style={[
                  styles.entryDescription,
                  { 
                    textAlign: alignment, 
                    textTransform: textCase, 
                    fontStyle: fontStyle === 'italic' ? 'italic' : 'normal', 
                    fontWeight: fontStyle === 'bold' ? 'bold' : 'normal' 
                  }
                ]}
              >
                {entry.entry_description}
              </Text>
  
              {entry.entry_image && entry.entry_image !== 'null' && (
                <Image 
                  source={{ uri: `http://192.168.137.221:3000${entry.entry_image}` }} 
                  style={styles.entryImage}
                />
              )}
  
              {renderSentiment()}
            </View>
          </ScrollView>
        </View>
      )}
  
      {/* Modals */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={backgroundModalVisible}
        onRequestClose={() => setBackgroundModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Customize Background</Text>
  
            {/* Background Color Section */}
            <Text style={styles.sectionTitle}>Background Color</Text>
            <View style={styles.colorSelectorContainer}>
              {[
                '#ffffff', '#FFB3B3', '#D4E9FF', '#D6E6D6', '#FFE4B5',
                '#FFC1E3', '#FFD1DC', '#E2C2FF', '#B8E8FC', '#D0FFD6',
              ].map((color) => (
                <TouchableOpacity
                  key={color}
                  onPress={() => saveColor(color)}
                  style={[styles.colorButton, { backgroundColor: color }]}
                />
              ))}
            </View>
  
            {/* Background Image Section */}
            <Text style={styles.sectionTitle}>Background Image</Text>
            <View style={styles.imageSelectorContainer}>
              {[
                require('../../assets/bg_image1.jpg'),
                require('../../assets/bg_image2.jpg'),
                require('../../assets/bg_image3.jpg'),
                require('../../assets/bg_image4.jpg'),
                require('../../assets/bg_image5.jpg'),
                require('../../assets/bg_image6.jpg'),
              ].map((image, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => saveImage(image)}
                  style={styles.imagePreviewContainer}
                >
                  <Image source={image} style={styles.imagePreview} />
                </TouchableOpacity>
              ))}
            </View>
  
            <TouchableOpacity onPress={() => setBackgroundModalVisible(false)} style={styles.closeModalButton}>
              <Text style={styles.closeModalButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
  
      <Modal
        animationType="slide"
        transparent={true}
        visible={customizationModalVisible}
        onRequestClose={() => setCustomizationModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Customize Entry</Text>
  
            {/* Alignment Selection */}
            <Text style={styles.sectionTitle}>Alignment</Text>
            <View style={styles.alignmentContainer}>
              {['left', 'center', 'right', 'justify'].map((align) => (
                <TouchableOpacity
                  key={align}
                  onPress={() => saveAlignment(align)}
                  style={[
                    styles.alignmentButton,
                    align === alignment ? styles.activeButton : null,
                  ]}
                >
                  <FontAwesome5
                    name={
                      align === 'left' ? 'align-left' :
                      align === 'center' ? 'align-center' :
                      align === 'right' ? 'align-right' :
                      'align-justify'
                    }
                    size={15}
                    color={align === alignment ? 'blue' : 'black'}
                  />
                </TouchableOpacity>
              ))}
            </View>
  
            {/* Text Case Selection */}
            <Text style={styles.sectionTitle}>Text Case</Text>
            <View style={styles.textCaseContainer}>
              {['normal', 'uppercase', 'lowercase'].map((caseOption) => (
                <TouchableOpacity
                  key={caseOption}
                  onPress={() => saveTextCase(caseOption)}
                  style={[
                    styles.textCaseButton,
                    caseOption === textCase ? styles.activeButton : null,
                  ]}
                >
                  <MaterialCommunityIcons
                    name={
                      caseOption === 'normal' ? 'format-letter-case' :
                      caseOption === 'uppercase' ? 'format-letter-case-upper' :
                      'format-letter-case-lower'
                    }
                    size={28}
                    color={caseOption === textCase ? 'blue' : 'black'}
                  />
                </TouchableOpacity>
              ))}
            </View>
  
            {/* Font Style Selection */}
            <Text style={styles.sectionTitle}>Font Style</Text>
            <View style={styles.fontStyleContainer}>
              {['normal', 'bold', 'italic'].map((styleOption) => (
                <TouchableOpacity
                  key={styleOption}
                  onPress={() => saveFontStyle(styleOption)}
                  style={[
                    styles.fontStyleButton,
                    styleOption === fontStyle ? styles.activeButton : null,
                  ]}
                >
                  <FontAwesome5
                    name={
                      styleOption === 'normal' ? 'font' :
                      styleOption === 'bold' ? 'bold' :
                      'italic'
                    }
                    size={20}
                    color={styleOption === fontStyle ? 'blue' : 'black'}
                  />
                </TouchableOpacity>
              ))}
            </View>
  
            <TouchableOpacity onPress={() => setCustomizationModalVisible(false)} style={styles.closeModalButton}>
              <Text style={styles.closeModalButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};


const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#333',
    marginVertical: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    position: 'relative',
    marginBottom: 10,
  },
  backButton: {
    padding: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  customizeButton: {
    padding: 10,
    marginLeft: 5,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    backgroundColor: '#fff',
    padding: 20,
    width: '80%',
    borderRadius: 10,
  },
  modalTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 18,
    marginBottom: 10,
  },
  colorSelectorContainer: {
    flexDirection: 'row',
    gap: 5,
    marginBottom: 15,
  },
  colorButton: {
    width: 25,
    height: 25,
    borderRadius: 15,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  imageSelectorContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
  },
  imagePreviewContainer: {
    margin: 5,
  },
  imagePreview: {
    width: 50,
    height: 50,
    borderRadius: 5,
  },
  uploadImageButton: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#007BFF',
    borderRadius: 5,
  },
  uploadImageButtonText: {
    color: '#fff',
    fontSize: 14,
  },
  alignmentContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  alignmentButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 40,
    height: 40,
    backgroundColor: '#f4f4f4',
    borderRadius: 25,
    padding: 5,
  },
  activeButton: {
    backgroundColor: '#d9d9d9',
  },
  textCaseContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  textCaseButton: {
    width: 45,
    height: 45,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f4f4',
    borderRadius: 25,
    padding: 5,
  },
    fontStyleContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 15,
  },
  fontStyleButton: {
    width: 50, 
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f4f4',
    borderRadius: 25,
    padding: 5,
  },
  alignmentText: {
    fontFamily: 'Poppins_600SemiBold', 
    fontSize: 14,
  },
  activeButton: {
    backgroundColor: '#d9d9d9', 
  },
  entryDetails: {
    padding: 20,
    paddingBottom: 80, 
  },
  entryDescription: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#444',
  },
  entryImage: {
    width: '100%',
    height: 200,
    marginVertical: 10,
    borderRadius: 8,
  },
  closeModalButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
    marginTop: 15,
  },
  closeModalButtonText: {
    color: '#fff',
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
  },
  entryDetails: {
    padding: 30,
    marginBottom: 5,
  },
  entryDescription: {
    fontSize: 15,
    marginBottom: 30,
    color: '#333',
    fontFamily: 'Poppins_400Regular',
  },
  entryImage: {
    width: '100%',
    height: 300,
    marginBottom: 30,
  },
  sentimentContainer: {
    marginBottom: 20,
  },
  percentageText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
  },
});

export default FullEntryView;
