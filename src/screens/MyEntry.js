import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, RefreshControl, Alert, TextInput, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import AddEntry from '../components/AddEntry';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import DateTimePicker from '@react-native-community/datetimepicker';
import { fetchEntries as apiFetchEntries, deleteEntry } from '../api';

const MyEntry = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { journalId, journalTitle } = route.params;
  const [entries, setEntries] = useState([]);
  const [filteredEntries, setFilteredEntries] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isModalVisible, setModalVisible] = useState(false);
  const [searchLocation, setSearchLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedEntryId, setSelectedEntryId] = useState(null);
  const [entryToEdit, setEntryToEdit] = useState(null);
  const [openedEntryId, setOpenedEntryId] = useState(null);
  const [deletedEntry, setDeletedEntry] = useState(null);
  const [showUndoMessage, setShowUndoMessage] = useState(false);
  const [undoTimer, setUndoTimer] = useState(null);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  const closeDropdown = () => {
    setOpenedEntryId(null);
  };

  const fetchEntries = async () => {
    try {
      console.log('Fetching entries for journalId:', journalId);
      const response = await apiFetchEntries(journalId);
      console.log('API response:', response);
      setEntries(response.data);
      setFilteredEntries(response.data);
      setIsRefreshing(false);
    } catch (error) {
      console.error('Error fetching entries:', error);
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchEntries();
  }, [journalId]);

  useEffect(() => {
    filterEntries();
  }, [searchLocation, selectedDate]);

  const filterEntries = () => {
    let updatedEntries = [...entries];

    if (searchLocation) {
      updatedEntries = updatedEntries.filter((entry) =>
        entry.entry_location_name?.toLowerCase().includes(searchLocation.toLowerCase())
      );
    }

    if (selectedDate) {
      updatedEntries = updatedEntries.filter((entry) => {
        const entryDate = new Date(entry.entry_datetime);
        return (
          entryDate.getFullYear() === selectedDate.getFullYear() &&
          entryDate.getMonth() === selectedDate.getMonth() &&
          entryDate.getDate() === selectedDate.getDate()
        );
      });
    }

    setFilteredEntries(updatedEntries);
  };

  const clearFilters = () => {
    setSearchLocation('');
    setSelectedDate(null);
    setFilteredEntries(entries);
  };

  const formatDateTime = (dateTime) => {
    const dateObj = new Date(dateTime);
    const localDateTime = new Date(dateObj.getTime() - dateObj.getTimezoneOffset() * 60000);

    const options = { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' };
    const formattedDate = new Intl.DateTimeFormat('en-GB', options).format(localDateTime);

    const formattedTime = localDateTime.toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });

    return { formattedDate, formattedTime };
  };

  const handleDatePickerChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  };

  const openModal = () => {
    setModalVisible(true);
  };

  const handleEntrySave = () => {
    setModalVisible(false);
    setEntryToEdit(null);
    fetchEntries();
  };

  const handleUpdate = (entry) => {
    setSelectedEntryId(null);
    openModal();
    setEntryToEdit(entry);
  };

  const performDelete = async (entryId) => {
    try {
      await deleteEntry(entryId);
      fetchEntries();
    } catch (error) {
      console.error('Error deleting entry:', error.message);
      alert('Failed to delete entry');
    }
  };  

  const handleDelete = (entryId) => {
    Alert.alert(
      'Delete Entry',
      'Are you sure you want to delete this journal entry?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            const entryToDelete = entries.find(entry => entry.entry_id === entryId);
            
            setDeletedEntry(entryToDelete);
            
            const updatedEntries = entries.filter(entry => entry.entry_id !== entryId);
            setEntries(updatedEntries);
            setFilteredEntries(updatedEntries);
            
            setShowUndoMessage(true);
            
            if (undoTimer) {
              clearTimeout(undoTimer);
            }
            
            const timer = setTimeout(() => {
              performDelete(entryId);
              setShowUndoMessage(false);
              setDeletedEntry(null);
            }, 3000);
            
            setUndoTimer(timer);
          },
        },
      ]
    );
  };

  const handleUndo = () => {
    if (deletedEntry) {
      if (undoTimer) {
        clearTimeout(undoTimer);
      }
      
      const restoredEntries = [...entries, deletedEntry];
      setEntries(restoredEntries);
      setFilteredEntries(restoredEntries);
      
      setShowUndoMessage(false);
      setDeletedEntry(null);
    }
  };

  const EntryOptionsDropdown = ({ entry, onClose }) => {
    return (
      <View style={styles.dropdownContainer}>
        <TouchableOpacity 
          style={styles.dropdownOption} 
          onPress={() => {
            handleUpdate(entry);
            onClose();
          }}
        >
          <FontAwesome5 name="pencil-alt" size={16} color="#4CAF50" />
          <Text style={styles.dropdownOptionText}>Edit</Text>
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.dropdownOption} 
          onPress={() => {
            handleDelete(entry.entry_id);
            onClose();
          }}
        >
          <FontAwesome5 name="trash-alt" size={16} color="red" />
          <Text style={styles.dropdownOptionText}>Delete</Text>
        </TouchableOpacity>
      </View>
    );  
  };

  const SentimentBar = ({ percentage, color, label }) => {
    return (
      <View style={styles.sentimentBarContainer}>
        <Text style={styles.sentimentLabel}>{label}:</Text>
        <View style={styles.sentimentBarBackground}>
          <View 
            style={[
              styles.sentimentBarFill, 
              { width: `${percentage}%`, backgroundColor: color }
            ]} 
          />
        </View>
        <Text style={styles.sentimentPercentage}>{percentage.toFixed(1)}%</Text>
      </View>
    );
  };

  const renderEntry = ({ item }) => {
    const { formattedDate, formattedTime } = formatDateTime(item.entry_datetime);
    const MAX_DESCRIPTION_LENGTH = 100;
  
    const truncatedDescription = item.entry_description.length > MAX_DESCRIPTION_LENGTH
      ? item.entry_description.substring(0, MAX_DESCRIPTION_LENGTH) + '...'
      : item.entry_description;
  
    const renderSentiment = () => {
      if (item.sentiment) {
        return (
          <View style={styles.sentimentContainer}>
            <SentimentBar 
              percentage={parseFloat(item.positive_percentage)} 
              color="#4CAF50" 
              label="Joyful"
            />
            <SentimentBar 
              percentage={parseFloat(item.neutral_percentage)} 
              color="#FFC107" 
              label="Content"
            />
            <SentimentBar 
              percentage={parseFloat(item.negative_percentage)} 
              color="#FF5252" 
              label="Uncertain"
            />
          </View>
        );
      }
      return null;
    };
  
    return (
      <TouchableWithoutFeedback onPress={closeDropdown}>
        <View style={styles.entryItem}>
          <View style={styles.entryHeader}>
            <View style={styles.dateContainer}>
              <Text style={styles.entryDate}>{formattedDate}</Text>
              <TouchableOpacity
                style={styles.ellipsisButton}
                onPress={() => setOpenedEntryId(openedEntryId === item.entry_id ? null : item.entry_id)}
              >
                <FontAwesome5 name="ellipsis-h" size={20} color="#666" />
              </TouchableOpacity>
            </View>

            {openedEntryId === item.entry_id && (
              <EntryOptionsDropdown
                entry={item}
                onClose={closeDropdown}
              />
            )}

            {item.entry_location_name && (
              <Text style={styles.entryLocation}> 
                at {item.entry_location_name}
              </Text>
            )}
          </View>

          <Text style={styles.entryDescription}>{truncatedDescription}</Text>

          {renderSentiment()}

          <View style={styles.entryFooter}>
            <Text style={styles.entryTime}>{formattedTime}</Text>
            <TouchableOpacity
              onPress={() => navigation.navigate('FullEntryView', { entry: item })}
              style={styles.readMoreButton}
            >
              <Text style={styles.readMoreText}>View All</Text>
            </TouchableOpacity>
          </View>
        </View>
      </TouchableWithoutFeedback>
    );
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <FontAwesome5 name="arrow-left" size={18} color="#333" />
        </TouchableOpacity>

        <Text style={styles.title} 
          numberOfLines={2} 
          ellipsizeMode="tail"
          >
          {journalTitle}
        </Text>
        <TouchableOpacity style={styles.fab} onPress={openModal}>
          <FontAwesome5 name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <View style={styles.searchWrapper}>
          <FontAwesome5 name="search" size={16} color="#888" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search by location"
            placeholderTextColor="#888"
            value={searchLocation}
            onChangeText={setSearchLocation}
          />
        </View>
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.datePickerText}>
            {selectedDate ? selectedDate.toDateString() : 'Date'}
          </Text>
        </TouchableOpacity>
        {showDatePicker && (
          <DateTimePicker
            value={selectedDate || new Date()}
            mode="date"
            display="default"
            onChange={handleDatePickerChange}
          />
        )}

        <TouchableOpacity onPress={clearFilters} style={styles.clearFilterButton}>
          <FontAwesome5 name="eraser" size={15} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={filteredEntries}
        keyExtractor={(item) => item.entry_id.toString()}
        renderItem={renderEntry}
        contentContainerStyle={styles.flatList}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={() => {
              setIsRefreshing(true);
              fetchEntries();
            }}
          />
        }
        ListEmptyComponent={
          <Text style={styles.emptyText}>No entries found. Tap  '+'  to add an entry.</Text>
        }
      />

      {showUndoMessage && (
        <View style={styles.undoContainer}>
          <Text style={styles.undoText}>Journal entry deleted.</Text>
          <TouchableOpacity onPress={handleUndo} style={styles.undoButton}>
            <Text style={styles.undoButtonText}>Undo</Text>
          </TouchableOpacity>
        </View>
      )}

      <AddEntry
        visible={isModalVisible}
        onClose={handleEntrySave}
        journalId={journalId}
        entry={entryToEdit}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  flatList: {
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    paddingTop: 50,
    paddingHorizontal: 20,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  backButton: {
    paddingRight: 20,
  },
  title: {
    flex: 1,
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 20,
    color: '#333',
    marginTop: 5,
  },
  fab: {
    width: 35,
    height: 35,
    borderRadius: 20,
    backgroundColor: '#13547D',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    alignItems: 'center',
  },
  searchWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f2f2f2',
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 40,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#444',
  },
  datePickerButton: {
    marginLeft: 10,
    backgroundColor: '#f2f2f2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    height: 40,
    justifyContent: 'center',
  },
  datePickerText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    color: '#444',
  },
  clearFilterButton: {
    marginLeft: 10,
    backgroundColor: '#aaa',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  entryItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    marginHorizontal: 15,
    marginTop: 15,
    padding: 15,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  entryHeader: {
    marginBottom: 20,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryDate: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#333',
  },
  ellipsisButton: {
    padding: 5,
  },
  entryLocation: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#333',
  },
  entryDescription: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: '#444',
    lineHeight: 22,
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 15,
    paddingTop: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  entryTime: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#888',
  },
  readMoreButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 15,
  },
  readMoreText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#13547D',
  },
  dropdownContainer: {
    position: 'absolute',
    right: 0,
    top: 30,
    backgroundColor: 'white',
    borderRadius: 8,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    zIndex: 1000,
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 15,
  },
  dropdownOptionText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 14,
    marginLeft: 15,
  },
  emptyText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#888',
    textAlign: 'center',
    marginTop: 50,
  },
  sentimentContainer: {
    marginTop: 15,
    backgroundColor: '#f9f9f9',
    padding: 10,
    borderRadius: 8,
  },
  sentimentBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 4,
  },
  sentimentLabel: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 13,
    color: '#555',
    width: 70,
  },
  sentimentBarBackground: {
    flex: 1,
    height: 8,
    backgroundColor: '#eee',
    borderRadius: 4,
    overflow: 'hidden',
  },
  sentimentBarFill: {
    height: '100%',
    borderRadius: 4,
  },
  sentimentPercentage: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#555',
    width: 50,
    textAlign: 'right',
    marginLeft: 8,
  },
  undoContainer: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: 'rgba(50, 50, 50, 0.9)',
    borderRadius: 8,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  undoText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 15,
    color: '#fff',
  },
  undoButton: {
    backgroundColor: '#525fe1',
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  undoButtonText: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 14,
    color: '#fff',
  },
});

export default MyEntry;