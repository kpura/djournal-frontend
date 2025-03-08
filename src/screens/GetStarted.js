import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image, FlatList, Dimensions } from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';

const { width } = Dimensions.get('window');

const carouselData = [
  {
    id: '1',
    image: require('../../assets/get1.jpg'),
    title: 'Explore\nSorsogon\nwith us and\ncapture your\njourney.',
    description: 'Discover the hidden gems and natural wonders of Sorsogon'
  },
  {
    id: '2',
    image: require('../../assets/get2.jpg'),
    title: 'Explore\nSorsogon\nwith us and\ncapture your\njourney.',
    description: 'Experience the rich culture and warm hospitality'
  },
  {
    id: '3',
    image: require('../../assets/get3.jpg'),
    title: 'Explore\nSorsogon\nwith us and\ncapture your\njourney.',
    description: 'Create unforgettable memories in paradise'
  },
];

const GetStarted = ({ navigation }) => {
  const [activeIndex, setActiveIndex] = useState(0);
  const flatListRef = useRef(null);
  const [isPaused, setIsPaused] = useState(false);
  
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  useEffect(() => {
    const autoScrollTimer = setInterval(() => {
      if (!isPaused) {
        const nextIndex = (activeIndex + 1) % carouselData.length;
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({
            index: nextIndex,
            animated: true,
          });
          setActiveIndex(nextIndex);
        }
      }
    }, 8000);

    return () => clearInterval(autoScrollTimer);
  }, [activeIndex, isPaused]);

  const onViewableItemsChanged = useRef(({ viewableItems }) => {
    if (viewableItems.length > 0) {
      setActiveIndex(viewableItems[0].index);
    }
  }).current;

  const viewabilityConfig = useRef({
    itemVisiblePercentThreshold: 50,
  }).current;

  const handleScrollBegin = () => setIsPaused(true);
  const handleScrollEnd = () => setIsPaused(false);

  if (!fontsLoaded) {
    return null;
  }

  const renderCarouselItem = ({ item }) => (
    <View style={styles.carouselItem}>
      <Image
        source={item.image}
        style={styles.carouselImage}
        resizeMode="cover"
      />
      <View style={styles.textOverlay}>
        <Text style={styles.carouselTitle}>{item.title}</Text>
        <Text style={styles.carouselDescription}>{item.description}</Text>
      </View>
    </View>
  );

  const renderDotIndicator = () => {
    return (
      <View style={styles.dotContainer}>
        {carouselData.map((_, index) => (
          <View
            key={index}
            style={[
              styles.dot,
              { backgroundColor: index === activeIndex ? '#237CA2' : '#D9D9D9' }
            ]}
          />
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <FlatList
        ref={flatListRef}
        data={carouselData}
        renderItem={renderCarouselItem}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        keyExtractor={(item) => item.id}
        onScrollBeginDrag={handleScrollBegin}
        onScrollEndDrag={handleScrollEnd}
        onMomentumScrollEnd={handleScrollEnd}
        getItemLayout={(_, index) => ({
          length: width,
          offset: width * index,
          index,
        })}
      />
      
      {renderDotIndicator()}

      <View style={styles.bottomSheet}>
        <Text style={styles.paragraph}>
          Ready to track your mood? Let's start tracking your mood and gain insights into your journey.
        </Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.buttonText}>Login</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={() => navigation.navigate('Register')}>
          <Text style={styles.buttonText}>Create Account</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  logoContainer: {
    position: 'absolute',
    top: 50,
    width: '100%',
    alignItems: 'center',
    zIndex: 10,
  },
  carouselItem: {
    width: width,
    height: '100%',
  },
  carouselImage: {
    width: '100%',
    height: '100%',
  },
  textOverlay: {
    position: 'absolute',
    top: '10%',
    left: 30,
    right: 20,
  },
  carouselTitle: {
    color: '#fff',
    fontSize: 45,
    fontFamily: 'Poppins_400Regular',
    marginBottom: 10,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  carouselDescription: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  dotContainer: {
    flexDirection: 'row',
    position: 'absolute',
    top: '80%',
    alignSelf: 'center',
  },
  dot: {
    width: 20,
    height: 5,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    width: '100%',
    backgroundColor: 'white',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingVertical: 20,
    paddingHorizontal: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  paragraph: {
    fontSize: 12,
    textAlign: 'center',
    marginHorizontal: 30,
    marginBottom: 20,
    color: '#13547D',
    fontFamily: 'Poppins_400Regular',
  },
  button: {
    backgroundColor: '#13547D',
    paddingVertical: 20,
    borderRadius: 20,
    width: '95%',
    alignItems: 'center',
    marginBottom: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 14,
    letterSpacing: 0.5,
    fontFamily: 'Poppins_600SemiBold',
  },
});

export default GetStarted;