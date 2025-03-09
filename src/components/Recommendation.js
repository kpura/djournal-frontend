import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';

const Recommendation = ({ data }) => {
  const navigation = useNavigation();

  const userImages = Array.isArray(data.user_submitted_images) ? data.user_submitted_images : [];

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
        <Image
          source={{ 
            uri: data.location_images.startsWith('/') 
              ? `http://192.168.1.11:3000${data.location_images}` 
              : `http://192.168.1.11:3000/uploads/${data.location_images}` 
          }}
          style={styles.image}
          resizeMode="cover"
        />
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
  image: {
    width: 130,
    height: 100,
    borderRadius: 10,
    marginRight: 15,
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
});

export default Recommendation;
