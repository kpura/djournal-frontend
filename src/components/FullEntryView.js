//FullEntry
import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity, ScrollView, Modal, ImageBackground, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: screenWidth } = Dimensions.get('window');

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

  const [selectedImageIndex, setSelectedImageIndex] = useState(null);
  const [imageViewerVisible, setImageViewerVisible] = useState(false);

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

  const renderImageGrid = () => {
    if (!entry.entry_images || entry.entry_images === 'null' || JSON.parse(entry.entry_images).length === 0) {
      return null;
    }
  
    const images = JSON.parse(entry.entry_images);
    const imageCount = images.length;
  
    if (imageCount === 1) {
      return (
        <TouchableOpacity 
          onPress={() => {
            setSelectedImageIndex(0);
            setImageViewerVisible(true);
          }}
        >
          <Image
            source={{ 
              uri: images[0].startsWith('http') 
                ? images[0] 
                : `http://192.168.1.11:3000${images[0]}` 
            }}
            style={styles.singleImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      );
    }
  
    return (
      <View style={styles.imageGrid}>
        {images.map((image, index) => {
          const isLastImage = index === images.length - 1;
          const remainingCount = images.length - 4;
          
          const imageStyle = [
            styles.gridImage,
            imageCount === 2 && styles.twoImagesStyle,
            imageCount === 3 && styles.threeImagesStyle,
            imageCount >= 4 && styles.fourPlusImagesStyle,
          ];
  
          return (
            <TouchableOpacity
              key={index}
              style={imageStyle}
              onPress={() => {
                setSelectedImageIndex(index);
                setImageViewerVisible(true);
              }}
            >
              <Image
                source={{ 
                  uri: image.startsWith('http') 
                    ? image 
                    : `http://192.168.1.11:3000${image}` 
                }}
                style={StyleSheet.absoluteFill}
                resizeMode="cover"
              />
              {isLastImage && index >= 4 && remainingCount > 0 && (
                <View style={styles.remainingCountOverlay}>
                  <Text style={styles.remainingCountText}>+{remainingCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const ImageViewerModal = () => {
    if (selectedImageIndex === null) return null;
    
    const images = JSON.parse(entry.entry_images);
    
    return (
      <Modal
        visible={imageViewerVisible}
        transparent={true}
        onRequestClose={() => setImageViewerVisible(false)}
      >
        <View style={styles.imageViewerContainer}>
          <TouchableOpacity 
            style={styles.closeImageViewer}
            onPress={() => setImageViewerVisible(false)}
          >
            <FontAwesome5 name="times" size={24} color="#fff" />
          </TouchableOpacity>
          
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.imageViewerContent}
            contentOffset={{ x: selectedImageIndex * screenWidth, y: 0 }}
          >
            {images.map((image, index) => (
              <View key={index} style={styles.fullScreenImageContainer}>
                <Image
                  source={{ 
                    uri: image.startsWith('http') 
                      ? image 
                      : `http://192.168.1.11:3000${image}` 
                  }}
                  style={styles.fullScreenImage}
                  resizeMode="contain"
                />
                <Text style={styles.imageCounter}>
                  {index + 1} / {images.length}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </Modal>
    );
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
                {renderImageGrid()}
                {ImageViewerModal()}
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
              {renderImageGrid()}
              {ImageViewerModal()}
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
            </View>
          </ScrollView>
        </View>
      )}
  
      <Modal
        animationType="slide"
        transparent={true}
        visible={backgroundModalVisible}
        onRequestClose={() => setBackgroundModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setBackgroundModalVisible(false)}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
                <Text style={styles.sectionTitle}>Color</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={styles.colorScrollContainer}>
                  {[
                    '#ffffff', '#FFB3B3', '#D4E9FF', '#D6E6D6', '#FFE4B5',
                    '#FFC1E3', '#FFD1DC', '#E2C2FF', '#B8E8FC', '#D0FFD6',
                  ].map((color) => (
                    <TouchableOpacity
                      key={color}
                      onPress={() => saveColor(color)}
                      style={[styles.colorButton, { backgroundColor: color }]}
                    >
                      {backgroundColor === color && (
                        <View style={styles.checkOverlay}>
                          <FontAwesome5 name="check" size={16} color="#000" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>

                <Text style={styles.sectionTitle}>Background</Text>
                <ScrollView 
                  horizontal 
                  showsHorizontalScrollIndicator={false} 
                  contentContainerStyle={styles.imageScrollContainer}>
                  {[
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
                      {selectedBackground === image && (
                        <View style={styles.checkOverlayImage}>
                          <FontAwesome5 name="check" size={20} color="#FFF" />
                        </View>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
  
      <Modal
        animationType="slide"
        transparent={true}
        visible={customizationModalVisible}
        onRequestClose={() => setCustomizationModalVisible(false)}
      >
        <TouchableWithoutFeedback onPress={() => setCustomizationModalVisible(false)}>
          <View style={styles.modalContainer}>
            <TouchableWithoutFeedback>
              <View style={styles.modalContent}>
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
                        size={20}
                        color={align === alignment ? 'white' : 'black'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

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
                        size={30}
                        color={caseOption === textCase ? 'white' : 'black'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>

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
                        color={styleOption === fontStyle ? 'white' : 'black'}
                      />
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject, // Full-screen coverage
  },
  sectionTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#333',
    marginVertical: 10,
    alignSelf: 'flex-start',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 15,
    zIndex: 1,
    paddingTop: 60,
    marginBottom: 5,
  },
  backButton: {
    marginLeft: 5,
  },
  buttonContainer: {
    flexDirection: 'row',
  },
  customizeButton: {
    marginHorizontal: 15,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalContent: {
    width: '90%',
    backgroundColor: '#fff',
    padding: 20,
    borderRadius: 20,
    alignItems: 'center',
  },
  colorScrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    marginBottom: 5,
  },
  colorButton: {
    width: 80,
    height: 80,
    borderRadius: 50,
    marginRight: 10,
    borderWidth: 1,
    borderColor: '#ccc',
  },
  imageScrollContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  imagePreviewContainer: {
    marginRight: 10,
    borderRadius: 50,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ccc',
    marginBottom: 30,
  },
  imagePreview: {
    width: 80,
    height: 80,
  },
  alignmentContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  alignmentButton: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 70,
    height: 70,
    backgroundColor: '#f4f4f4',
    borderRadius: 18,
    padding: 5,
  },
  activeButton: {
    backgroundColor: '#d9d9d9',
  },
  textCaseContainer: {
    flexDirection: 'row',
    gap: 10,
  },
  textCaseButton: {
    width: 70,
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f4f4',
    borderRadius: 18,
    padding: 5,
  },
  fontStyleContainer: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 20,
  },
  fontStyleButton: {
    width: 70, 
    height: 70,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f4f4f4',
    borderRadius: 18,
    padding: 5,
  },
  alignmentText: {
    fontFamily: 'Poppins_600SemiBold', 
    fontSize: 14,
  },
  activeButton: {
    backgroundColor: '#13547D', 
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-start',
  },
  entryDetails: {
    padding: 20,
  },
  entryDescription: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Poppins_400Regular',
  },
  imageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    marginBottom: 15,
  },
  singleImage: {
    width: '100%',
    height: 200,
    borderRadius: 13,
    marginBottom: 15,
  },
  gridImage: {
    flex: 1,
    height: 200,
    marginHorizontal: 1,
    marginVertical: 1,
  },
  twoImagesStyle: {
    width: '50%',
    height: 150,
  },
  threeImagesStyle: {
    width: '33%',
    height: 200,
  },
  fourPlusImagesStyle: {
    width: '49.5%',
    height: 150,
  },
  remainingCountOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  remainingCountText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  imageViewerContainer: {
    flex: 1,
    backgroundColor: '#000',
  },
  imageViewerContent: {
    flexGrow: 1,
  },
  fullScreenImageContainer: {
    width: screenWidth,
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: screenWidth,
    height: '100%',
  },
  closeImageViewer: {
    position: 'absolute',
    top: 40,
    right: 20,
    zIndex: 10,
    padding: 10,
  },
  imageCounter: {
    position: 'absolute',
    bottom: 20,
    alignSelf: 'center',
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  checkOverlay: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.7)',
    borderRadius: 30,
  },
  checkOverlayImage: {
    position: 'absolute',
    top: 0,
    right: 0,
    bottom: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 50,
  },
  
});

export default FullEntryView;