import React, { useEffect } from 'react';
import { View, Image, StyleSheet, Text } from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';

const Logo = ({ navigation }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      navigation.replace('GetStarted');
    }, 4000);

    return () => clearTimeout(timer);
  }, [navigation]);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Image source={require('../../assets/djournal-pin.png')} style={styles.logo} />
      <Text style={styles.paragraph}>
      A mobile application for digital journaling with mood tracking using natural language processing.
      </Text>
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
    height: 150,
    resizeMode: 'cover',
    marginBottom: 150,
  },
  paragraph: {
    fontSize: 12,
    textAlign: 'center',
    marginHorizontal: 35,
    position: 'absolute',
    bottom: 50,
    color: '#0F2236',
    fontFamily: 'Poppins_400Regular',
  },
});

export default Logo;