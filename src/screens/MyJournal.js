import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, Text, RefreshControl, Alert } from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AddJournal from '../components/AddJournal';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import api from '../../network/api';
import { Swipeable } from 'react-native-gesture-handler';

const MyJournal = () => {
  const [journals, setJournals] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [isTooltipVisible, setTooltipVisible] = useState(false);
  const navigation = useNavigation();

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  const [journalToEdit, setJournalToEdit] = useState(null);
  const [openSwipeableIndex, setOpenSwipeableIndex] = useState(null);
  const swipeableRefs = useRef([]);

  const fetchJournals = async () => {
    setRefreshing(true);
    try {
      const response = await api.get('/api/journals');
      setJournals(response.data);
    } catch (error) {
      console.error('Error fetching journals:', error);
    } finally {
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchJournals();
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      swipeableRefs.current.forEach((ref) => ref?.close());
      setOpenSwipeableIndex(null);

      return () => swipeableRefs.current.forEach((ref) => ref?.close());
    }, [])
  );

  const onRefresh = () => {
    swipeableRefs.current.forEach((ref) => ref?.close());
    fetchJournals();
  };

  const openModal = () => setModalVisible(true);
  const closeModal = () => setModalVisible(false);

  const handleJournalSave = () => {
    closeModal();
    fetchJournals();
    setJournalToEdit(null);
  };

  const handleUpdate = (journal, index) => {
    openModal();
    setJournalToEdit(journal);
    swipeableRefs.current[index]?.close();
  };

  const handleDelete = (journalId) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this journal?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            swipeableRefs.current[openSwipeableIndex]?.close();
            setOpenSwipeableIndex(null);
          },
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.delete(`/api/journals/${journalId}`);
              if (response.status === 200) {
                fetchJournals();
                alert('Journal deleted successfully');
              }
            } catch (error) {
              console.error('Error deleting journal:', error.message);
              alert('Failed to delete journal');
            }
          },
        },
      ],
      { cancelable: false }
    );
  };

  const renderRightActions = (journal, index) => (
    <View style={styles.actionContainer}>
      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => handleUpdate(journal, index)}
      >
        <FontAwesome5 name="pencil-alt" size={16} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.iconButton, styles.deleteButton]}
        onPress={() => handleDelete(journal.journal_id)}
      >
        <FontAwesome5 name="trash-alt" size={16} color="#fff" />
      </TouchableOpacity>
    </View>
  );

  const handleSwipeOpen = (index) => {
    if (openSwipeableIndex !== null && openSwipeableIndex !== index) {
      swipeableRefs.current[openSwipeableIndex]?.close();
    }
    setOpenSwipeableIndex(index);
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const options = { month: 'long', day: 'numeric', year: 'numeric' };
    return date.toLocaleDateString(undefined, options);
  };

  const toggleTooltip = () => {
    setTooltipVisible((prev) => {
      if (!prev) {
        setTimeout(() => {
          setTooltipVisible(false);
        }, 5000);
      }
      return !prev;
    });
  };  

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Journals</Text>
          <TouchableOpacity onPress={toggleTooltip} style={styles.infoIcon}>
            <FontAwesome5 name="info-circle" size={20} color="#000" />
          </TouchableOpacity>
        </View>
        {isTooltipVisible && (
          <View style={styles.tooltip}>
            <Text style={styles.tooltipText}>Swipe left on a journal to edit</Text>
          </View>
        )}
      </View>

      {journals.length === 0 ? (
        <TouchableOpacity style={styles.fabCenter} onPress={openModal}>
          <FontAwesome5 name="plus" size={25} color="#fff" />
        </TouchableOpacity>
      ) : (
        <>
          <FlatList
            data={journals}
            keyExtractor={(item) => item.journal_id.toString()}
            renderItem={({ item, index }) => (
              <Swipeable
                ref={(ref) => (swipeableRefs.current[index] = ref)}
                renderRightActions={() => renderRightActions(item, index)}
                onSwipeableWillOpen={() => handleSwipeOpen(index)}
              >
                <View style={styles.journalItem}>
                  <TouchableOpacity
                    style={styles.journalContent}
                    onPress={() =>
                      navigation.navigate('MyEntry', { journalId: item.journal_id })
                    }
                  >
                    <View style={styles.journalTextContainer}>
                      <FontAwesome5
                        name="book"
                        size={30}
                        color="#fff"
                        style={styles.bookIcon}
                      />
                      <View>
                        <Text style={styles.journalTextOverlay}>
                          {item.journal_title}
                        </Text>
                        <Text style={styles.journalDateOverlay}>
                          {formatDate(item.journal_date)}
                        </Text>
                      </View>
                    </View>
                  </TouchableOpacity>
                </View>
              </Swipeable>
            )}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            }
          />
  
          <TouchableOpacity style={styles.fabRight} onPress={openModal}>
            <FontAwesome5 name="plus" size={25} color="#fff" />
          </TouchableOpacity>
        </>
      )}
  
      <AddJournal
        visible={isModalVisible}
        onClose={handleJournalSave}
        journal={journalToEdit}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
    padding: 15,
    paddingTop: 70,
  },
    headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  infoIcon: {
    marginRight: 10,
    marginBottom: 25,
  },
  tooltip: {
    position: 'absolute',
    top: 20, 
    right: 40,
    backgroundColor: '#f7f7f7',
    padding: 8,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 1,
  },
  tooltipText: {
    fontSize: 12,
    fontFamily: 'Poppins_400Regular',
    color: '#000',
  },  
  title: {
    fontSize: 32,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'left',
    marginBottom: 20,
    color: '#000',
    left: 5,
  },
  fabCenter: {
    position: 'absolute',
    bottom: '50%',
    alignSelf: 'center',
    backgroundColor: '#525fe1',
    width: 65,
    height: 65,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  fabRight: {
    position: 'absolute',
    bottom: 30,
    right: 25,
    backgroundColor: '#525fe1',
    width: 65,
    height: 65,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.8,
    shadowRadius: 2,
    elevation: 5,
  },
  journalItem: {
    marginBottom: 10,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    marginLeft: 5,
    marginRight: 5,
  },
  journalContent: {
    height: 100,
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 10,
    justifyContent: 'center',
    flex: 1,
    shadowColor: '#525fe1',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  journalTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  bookIcon: {
    marginRight: 25,
    backgroundColor: '#525fe1',
    padding: 25,
    borderRadius: 15,
  },
  journalTextOverlay: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000',
    textAlign: 'left',
  },
  journalDateOverlay: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    color: '#ccc',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    width: 120,
  },
  iconButton: {
    backgroundColor: '#525fe1',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#ff5252',
  },
});

export default MyJournal;
