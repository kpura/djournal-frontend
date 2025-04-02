import React, { useState, useEffect } from 'react';
import { 
  View, Text, StyleSheet, ScrollView, Image, RefreshControl, 
  TouchableOpacity, ActivityIndicator, ImageBackground, Alert, SafeAreaView, StatusBar 
} from 'react-native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { FontAwesome6 } from '@expo/vector-icons'; 
import Recommendation from '../components/Recommendation';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { 
  getCurrentUser, 
  fetchJournals, 
  fetchEntries, 
  createJournal, 
  updateJournal, 
  deleteJournal, 
  createEntry, 
  updateEntry, 
  deleteEntry, 
  fetchRecommendations
} from '../api/index';

const HomePage = () => {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  const [userName, setUserName] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(null);
  const [profilePicture, setProfilePicture] = useState(null);
  const [profileLastUpdated, setProfileLastUpdated] = useState(Date.now());
  const [isOnline, setIsOnline] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [lastSyncTime, setLastSyncTime] = useState(null);
  const [offlineCapabilities] = useState({
    journals: true,       
    entries: true,        
    images: false,        
    sentiment: false,     
    recommendations: false 
  });

  const navigation = useNavigation();

  useEffect(() => {
    NetInfo.fetch().then(state => {
      setIsOnline(state.isConnected && state.isInternetReachable);
      if (!state.isConnected || !state.isInternetReachable) {
        setOfflineMode(true);
        Alert.alert('Offline Mode', 'You are currently offline. Limited functionality is available.');
      }
    });
    
    const unsubscribe = NetInfo.addEventListener(state => {
      const networkAvailable = state.isConnected && state.isInternetReachable;
      setIsOnline(networkAvailable);
      
      if (networkAvailable && offlineMode) {
        setOfflineMode(false); // Add this line to ensure state is updated
        Alert.alert(
          'Connection Restored',
          'Would you like to sync your data now?',
          [
            { text: 'Not Now', style: 'cancel' },
            { text: 'Sync Now', onPress: syncData }
          ]
        );
      }
      
      if (!networkAvailable && !offlineMode) {
        setOfflineMode(true);
        Alert.alert('Offline Mode', 'You are now offline. Limited functionality is available. You can still manage journals and entries but some features are disabled.');
      }
    });
    
    return () => {
      unsubscribe();
    };
  }, [offlineMode]);

  useEffect(() => {
    const getToken = async () => {
      try {
        const userToken = await AsyncStorage.getItem('userToken');
        setToken(userToken);
      } catch (error) {
        console.error('Error retrieving token:', error);
      }
    };
    
    getToken();
  }, []);

  // Function to sync data when online
  const syncData = async () => {
    console.log('Sync button pressed, isOnline:', isOnline, 'token:', !!token);
  
    if (!isOnline || !token) {
      console.log('Cannot sync: isOnline or token missing');
      return;
    }
    
    setLoading(true);
    try {
      await downloadAllData();
      await uploadPendingChanges();
      
      setOfflineMode(false);
      const syncTime = new Date().toISOString();
      setLastSyncTime(syncTime);
      await AsyncStorage.setItem('lastSyncTime', syncTime);
      Alert.alert('Success', 'All data synced successfully');
    } catch (error) {
      console.error('Error syncing data:', error);
      Alert.alert('Sync Failed', 'Unable to sync data. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  // Function to upload any pending changes made during offline mode
  const uploadPendingChanges = async () => {
    if (!isOnline || !token) return;
    
    try {
      await processPendingOperations('Journal');
      await processPendingOperations('Entry');
      
      console.log('All pending changes uploaded successfully');
      return true;
    } catch (error) {
      console.error('Error uploading pending changes:', error);
      throw error;
    }
  };

  const processPendingOperations = async (type) => {
    const key = `pending${type}Ops`;
    const pendingOpsStr = await AsyncStorage.getItem(key);
    if (!pendingOpsStr) return;
    
    const ops = JSON.parse(pendingOpsStr);
    if (!ops || ops.length === 0) return;
    
    console.log(`Processing ${ops.length} pending ${type} operations`);
    
    const failedOps = [];
    
    for (const op of ops) {
      try {
        if (type === 'Journal') {
          if (op.type === 'create') {
            await createJournal(op.data.journal_title, op.data.journal_date);
          } else if (op.type === 'update') {
            await updateJournal(op.data.journal_id, op.data.journal_title, op.data.journal_date);
          } else if (op.type === 'delete') {
            await deleteJournal(op.data.journal_id);
          }
        } else if (type === 'Entry') {
          if (op.type === 'create') {
            // If there are pending images, assign them to entry_images
            if (op.data.pending_images && op.data.pending_images.length > 0) {
              op.data.entry_images = op.data.pending_images;
              delete op.data.pending_images;
            }
            await createEntry(op.data);
          } else if (op.type === 'update') {
            if (op.data.pending_images && op.data.pending_images.length > 0) {
              op.data.entry_images = op.data.pending_images;
              delete op.data.pending_images;
            }
            await updateEntry(op.data.entry_id, op.data);
          } else if (op.type === 'delete') {
            await deleteEntry(op.data.entry_id);
          }
        }
      } catch (opError) {
        console.error(`Error processing ${type} operation ${op.type}:`, opError);
        failedOps.push(op);
      }
    }
    
    if (failedOps.length > 0) {
      await AsyncStorage.setItem(key, JSON.stringify(failedOps));
      console.log(`${failedOps.length} ${type} operations failed and will be retried later`);
    } else {
      await AsyncStorage.removeItem(key);
    }
  };

  // Function to download all necessary data for offline use
  const downloadAllData = async () => {
    if (!isOnline || !token) return;
    try {
      const userData = await getCurrentUser();
      await AsyncStorage.setItem('userData', JSON.stringify(userData));
      
      const journals = await fetchJournals();
      await AsyncStorage.setItem('journals', JSON.stringify(journals));
      
      for (const journal of journals) {
        const entries = await fetchEntries(journal.journal_id);
        await AsyncStorage.setItem(`entries_${journal.journal_id}`, JSON.stringify(entries));
      }
        
      if (!offlineMode) {
        const recs = await fetchRecommendations();
        await AsyncStorage.setItem('recommendations', JSON.stringify(recs));
        setRecommendations(recs);
      }
      
      console.log('All data downloaded for offline use');
      return true;
    } catch (error) {
      console.error('Error downloading data:', error);
      throw error;
    }
  };

  // Auto-download data on mount if online
  useEffect(() => {
    const autoDownloadData = async () => {
      if (token && isOnline) {
        try {
          const lastSync = await AsyncStorage.getItem('lastSyncTime');
          if (!lastSync || new Date() - new Date(lastSync) > 3600000) {
            console.log('Auto-downloading data...');
            await downloadAllData();
            const syncTime = new Date().toISOString();
            setLastSyncTime(syncTime);
            await AsyncStorage.setItem('lastSyncTime', syncTime);
          }
        } catch (error) {
          console.error('Error in auto-download:', error);
        }
      }
    };
    
    autoDownloadData();
  }, [token, isOnline, offlineMode]);

  const fetchUserProfile = async () => {
    if (!token) return;
    try {
      if (isOnline) {
        const userData = await getCurrentUser();
        setUserName(userData.name);
        if (userData.profile_picture) {
          const picturePath = userData.profile_picture.startsWith('/') 
            ? userData.profile_picture.substring(1) 
            : userData.profile_picture;
          const timestamp = Date.now();
          setProfilePicture(`http://192.168.1.3:3000/${picturePath}?t=${timestamp}`);
        } else {
          setProfilePicture(null);
        }
        await AsyncStorage.setItem('userData', JSON.stringify(userData));
      } else {
        const cachedUserData = await AsyncStorage.getItem('userData');
        if (cachedUserData) {
          const userData = JSON.parse(cachedUserData);
          setUserName(userData.name);
          setProfilePicture(null);
        }
      }
    } catch (error) {
      console.error('Error fetching user profile:', error);
      try {
        const cachedUserData = await AsyncStorage.getItem('userData');
        if (cachedUserData) {
          const userData = JSON.parse(cachedUserData);
          setUserName(userData.name);
        }
      } catch (e) {
        console.error('Error getting cached user data:', e);
      }
    }
  };

  const loadRecommendations = async () => {
    if (offlineMode || !isOnline || !token) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const recs = await fetchRecommendations();
      console.log('Recommendations received:', recs);
      setRecommendations(recs);
      await AsyncStorage.setItem('recommendations', JSON.stringify(recs));
    } catch (error) {
      console.error('Error fetching recommendations:', error.message);
      try {
        const cachedRecommendations = await AsyncStorage.getItem('recommendations');
        if (cachedRecommendations) {
          setRecommendations(JSON.parse(cachedRecommendations));
        }
      } catch (e) {
        console.error('Error getting cached recommendations:', e);
      }
      if (isOnline) {
        Alert.alert('Error', 'Failed to fetch recommendations. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      if (token) {
        fetchUserProfile();
        if (!offlineMode && isOnline) {
          loadRecommendations();
        }
      }
    }, [token, offlineMode, isOnline])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    setProfileLastUpdated(Date.now());
    if (isOnline) {
      if (!offlineMode) {
        loadRecommendations();
      }
      if (networkAvailable && offlineMode) {
        setOfflineMode(false); // Add this line to ensure state is updated
        Alert.alert(
          'Connection Restored',
          'Would you like to sync your data now?',
          [
            { text: 'Not Now', style: 'cancel' },
            { text: 'Sync Now', onPress: syncData }
          ]
        );
      }
    } else {
      Alert.alert('Offline Mode', 'Cannot refresh data while offline.');
    }
    setRefreshing(false);
  };

  const refreshProfilePicture = () => {
    if (isOnline) {
      setProfileLastUpdated(Date.now());
    } else {
      Alert.alert('Offline Mode', 'Cannot refresh profile picture while offline.');
    }
  };

  if (!fontsLoaded) {
    return <ActivityIndicator size="large" color="#6c79e0" />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar translucent backgroundColor="transparent" />
      <View style={styles.container}>
        <ImageBackground 
          source={require('../../assets/home_bg.jpg')}
          style={styles.headerBackground}
        >
          <View style={styles.headerContent}>
            <View style={styles.headerTop}>
              <TouchableOpacity 
                style={styles.profilePictureContainer}
                onPress={refreshProfilePicture}
              >
                {profilePicture && isOnline ? (
                  <Image 
                    source={{ uri: profilePicture }} 
                    style={styles.profilePicture} 
                    onError={() => console.log("Error loading profile picture")}
                  />
                ) : (
                  <View style={styles.defaultProfilePicture}>
                    <Text style={styles.defaultProfileInitial}>
                      {userName ? userName.charAt(0).toUpperCase() : '?'}
                    </Text>
                  </View>
                )}
              </TouchableOpacity>
              
              <View style={styles.greetingTextContainer}>
                <Text style={styles.headerGreeting}>{userName}</Text>
                {offlineMode && <Text style={styles.offlineIndicator}>OFFLINE MODE</Text>}
              </View>
              
              <TouchableOpacity
                style={styles.dataButton}
                onPress={() => {
                  if (isOnline && !offlineMode) {
                    navigation.navigate('DataVisualization');
                  } else {
                    Alert.alert('Offline Mode', 'Data visualization is not available in offline mode.');
                  }
                }}
              >
                <FontAwesome6 name="chart-column" size={25} color="#ffffff" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.greetingContainer}>
              <Text style={styles.greetingText}>Welcome to Sorsogon</Text>
              {lastSyncTime && (
                <Text style={styles.syncText}>
                  Last synced: {new Date(lastSyncTime).toLocaleString()}
                </Text>
              )}
            </View>
          </View>
        </ImageBackground>
    
        <View style={styles.mainContent}>
          {offlineMode && isOnline && (
            <TouchableOpacity style={styles.syncButton} onPress={syncData}>
              <Text style={styles.syncButtonText}>Sync Now</Text>
            </TouchableOpacity>
          )}
          
          <View style={styles.gifContainer}>
            <View style={styles.gifItem}>
              <Image source={require('../../assets/joyful.png')} style={styles.gif} />
              <Text style={styles.gifLabel}>Joyful</Text>
            </View>
            <View style={styles.gifItem}>
              <Image source={require('../../assets/content.png')} style={styles.gif} />
              <Text style={styles.gifLabel}>Content</Text>
            </View>
            <View style={styles.gifItem}>
              <Image source={require('../../assets/uncertain.png')} style={styles.gif} />
              <Text style={styles.gifLabel}>Uncertain</Text>
            </View>
          </View>
    
          {/* Recommendations section */}
          <View style={styles.recommendationContainer}>
            <Text style={styles.sectionTitle}>Recommended For You</Text>
            {loading ? (
              <ActivityIndicator size="large" color="#6c79e0" style={styles.loader} />
            ) : (
              <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
              > 
                {offlineMode || !isOnline ? (
                  <Text style={styles.offlineMessage}>
                    Recommendations are not available in offline mode. Pull down to check connection.
                  </Text>
                ) : recommendations.length > 0 ? (
                  recommendations.map((rec, index) => (
                    <Recommendation key={index} data={rec} />
                  ))
                ) : (
                  <Text style={styles.noRecommendations}>No recommendations available.</Text>
                )}
              </ScrollView>
            )}
          </View>
          
          {offlineMode && (
            <View style={styles.offlineInfoContainer}>
              <Text style={styles.offlineInfoTitle}>Offline Mode Capabilities:</Text>
              <Text style={styles.offlineInfoText}>✅ Create journals and entries</Text>
              <Text style={styles.offlineInfoText}>✅ Add locations in entry</Text>
              <Text style={styles.offlineInfoText}>❌ Update journals and entries</Text>
              <Text style={styles.offlineInfoText}>❌ Delete journals and entries</Text>
              <Text style={styles.offlineInfoText}>❌ Analyze sentiment</Text>
              <Text style={styles.offlineInfoText}>❌ Recommendations</Text>
            </View>
          )}
        </View>
      </View>
    </SafeAreaView>
  );  
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    backgroundColor: '#fff',
    paddingBottom: 20,
  },
  headerBackground: {
    width: '100%',
    height: 330,
  },
  headerContent: {
    paddingTop: 55,
    paddingHorizontal: 15,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  profilePictureContainer: {
    width: 45,
    height: 45,
  },
  profilePicture: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  defaultProfilePicture: {
    width: 45,
    height: 45,
    borderRadius: 22.5,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#13547D',
  },
  defaultProfileInitial: {
    fontSize: 22,
    fontFamily: 'Poppins_600SemiBold',
    color: '#13547D',
    marginTop: 5,
  },
  greetingTextContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerGreeting: {
    fontSize: 16,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
    textAlign: 'center',
  },
  offlineIndicator: {
    fontSize: 12,
    fontFamily: 'Poppins_600SemiBold',
    color: '#FF9800',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  dataButton: {
    padding: 5,
  },
  greetingContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 40,
  },
  greetingText: {
    fontSize: 25,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 2, height: 2 },
    textShadowRadius: 5,
  },
  syncText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#ffffff',
    marginTop: 5,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  mainContent: {
    flex: 1,
    marginTop: -30,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    paddingTop: 20,
    paddingHorizontal: 20,
  },
  syncButton: {
    backgroundColor: '#13547D',
    padding: 8,
    borderRadius: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  syncButtonText: {
    color: '#ffffff',
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
  },
  gifContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 15,
    padding: 10,
    borderRadius: 30,
    backgroundColor: '#f0f0f0',
  },
  gifItem: {
    alignItems: 'center',
  },
  gif: {
    width: 75,
    height: 75,
    backgroundColor: '#13547D',
    borderRadius: 50,
  },
  gifLabel: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 15,
    color: '#13547D',
    marginTop: 10,
  },
  recommendationContainer: {
    flex: 1,
  },
  sectionTitle: {
    fontSize: 19,
    fontFamily: 'Poppins_600SemiBold',
    color: '#13547D',
    marginBottom: 10,
  },
  scrollContent: {
    paddingVertical: 10,
  },
  loader: {
    marginTop: 100,
  },
  noRecommendations: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#666',
    textAlign: 'center',
    marginTop: 20,
  },
  offlineMessage: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#FF9800',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  offlineInfoContainer: {
    backgroundColor: '#f5f5f5',
    padding: 5,
    borderRadius: 10,
    marginTop: 10,
  },
  offlineInfoTitle: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#13547D',
    marginBottom: 3,
  },
  offlineInfoText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#333',
    marginBottom: 3,
  }
});

export default HomePage;