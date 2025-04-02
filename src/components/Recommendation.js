import React, { useState } from 'react'; 
import { View, Text, StyleSheet, Image, TouchableOpacity, ActivityIndicator } from 'react-native'; 
import { useNavigation } from '@react-navigation/native'; 

const Recommendation = ({ data }) => { 
  const navigation = useNavigation(); 
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
 
  const userImages = Array.isArray(data.user_submitted_images) ? data.user_submitted_images : [];   
  const getImageUrl = () => {
    if (!data.location_images) return null;
    
    if (data.location_images.startsWith('https')) {
      return data.location_images;
    }
    
    return `https://api.djournalmood.com${data.location_images}`;
  };
  
  const imageUrl = getImageUrl();
  console.log('Constructed URL:', imageUrl);
 
  return ( 
    <TouchableOpacity 
      style={styles.card} 
      onPress={() => navigation.navigate('PlaceDetail', { 
        location_name: data.location_name, 
        location_place: data.location_place, 
        location_description: data.location_description, 
        overall_positive: data.overall_positive, 
        overall_negative: data.overall_negative, 
        overall_neutral: data.overall_neutral, 
        location_images: data.location_images, 
        user_submitted_images: userImages, 
      })} 
    > 
      {data.location_images ? ( 
        <View style={styles.imageContainer}>
          {imageLoading && (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color="#13547D" />
            </View>
          )}
          {imageError ? (
            <View style={[styles.image, styles.imagePlaceholder]}>
              <Text style={styles.placeholderText}>Image Error</Text>
            </View>
          ) : (
            <Image 
              source={{ uri: imageUrl }} 
              style={styles.image} 
              resizeMode="cover"
              onLoadStart={() => {
                setImageLoading(true);
                setImageError(false);
              }}
              onLoadEnd={() => setImageLoading(false)}
              onError={(e) => {
                console.log('Image error:', e.nativeEvent.error);
                setImageLoading(false);
                setImageError(true);
              }}
            /> 
          )}
        </View>
      ) : ( 
        <View style={[styles.image, styles.imagePlaceholder]}> 
          <Text style={styles.placeholderText}>No image</Text> 
        </View> 
      )} 
 
      <View style={styles.textContainer}> 
        <Text style={styles.title} numberOfLines={2} ellipsizeMode="tail"> 
          {data.location_name} 
        </Text> 
        <Text style={styles.subtitle} numberOfLines={2} ellipsizeMode="tail"> 
          {data.location_place} 
        </Text> 
      </View> 
    </TouchableOpacity> 
  ); 
}; 

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 5,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    alignItems: 'center',
    marginHorizontal: 5,
  },
  imageContainer: {
    width: 130,
    height: 100,
    borderRadius: 10,
    marginRight: 15,
    overflow: 'hidden',
  },
  image: {
    width: 130,
    height: 100,
    borderRadius: 10,
  },
  imagePlaceholder: {
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    color: '#666',
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
    paddingRight: 10, 
  },
  title: {
    fontSize: 17,
    fontFamily: 'Poppins_600SemiBold',
    color: '#13547D',
    flexWrap: 'wrap',
  },
  subtitle: {
    fontSize: 13,
    fontFamily: 'Poppins_400Regular',
    color: '#13547D',
    marginVertical: 4,
  },
  loaderContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    backgroundColor: 'rgba(255,255,255,0.5)',
  }
});

export default Recommendation;