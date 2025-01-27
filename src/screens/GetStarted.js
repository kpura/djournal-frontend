import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';

const GetStarted = ({ navigation }) => {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/logo.png')} style={styles.logo} />
      <Text style={styles.paragraph}>
        Ready to track your mood? Let’s start tracking your mood and gain insights into your journey.
      </Text>
      <TouchableOpacity 
        style={styles.button} 
        onPress={() => navigation.navigate('AuthOptions')}
      >
        <Text style={styles.buttonText}>Get Started</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  logo: {
    width: 250,
    height: 100,
    resizeMode: 'cover',
    bottom: 100,
  },
  paragraph: {
    fontSize: 12,
    textAlign: 'center',
    marginHorizontal: 50,
    position: 'absolute',
    bottom: 130,
    color: '#525fe1',
    fontFamily: 'Poppins_400Regular',
  },
  button: {
    backgroundColor: '#525fe1', 
    paddingVertical: 15,
    paddingHorizontal: 140,
    borderRadius: 14,
    position: 'absolute',
    bottom: 50,  
    alignSelf: 'center',
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    letterSpacing: 0.5,
    fontFamily: 'Poppins_600SemiBold',
  },
});

export default GetStarted;
