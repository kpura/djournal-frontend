import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, TouchableOpacity, Image, RefreshControl, Alert, TextInput, Modal, TouchableWithoutFeedback, Keyboard } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import AddEntry from '../components/AddEntry';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import api from '../../network/api';
import DateTimePicker from '@react-native-community/datetimepicker';

const MyEntry = () => {
  const route = useRoute();
  const navigation = useNavigation();
  const { journalId } = route.params;
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

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  const closeDropdown = () => {
    setOpenedEntryId(null);
  };

  const fetchEntries = async () => {
    try {
      const response = await api.get(`/api/entries/${journalId}`);
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

  const handleDelete = (entryId) => {
    Alert.alert(
      'Confirm Deletion',
      'Are you sure you want to delete this entry?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await api.delete(`/api/entries/${entryId}`);
              if (response.status === 200) {
                fetchEntries();
                alert('Entry deleted successfully');
              }
            } catch (error) {
              console.error('Error deleting entry:', error.message);
              alert('Failed to delete entry');
            }
          },
        },
      ],
      { cancelable: false }
    );
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
          <FontAwesome5 name="pencil-alt" size={16} color="#525fe1" />
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
            <View style={styles.sentimentPercentages}>
              <Text style={styles.percentageText}>
                {'Positive: ' + item.positive_percentage + '%'}
              </Text>
              <Text style={styles.percentageText}>
                {'Negative: ' + item.negative_percentage + '%'}
              </Text>
              <Text style={styles.percentageText}>
                {'Neutral: ' + item.neutral_percentage + '%'}
              </Text>
            </View>
          </View>
        );
      }
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
                <FontAwesome5 name="ellipsis-h" size={18} color="#666" />
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
              <FontAwesome5 name="arrow-right" size={16} color="#666" />
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
          <FontAwesome5 name="arrow-left" size={18} color="#525fe1" />
        </TouchableOpacity>

        <Text style={styles.title}>Entries</Text>

        <TouchableOpacity style={styles.fab} onPress={openModal}>
          <FontAwesome5 name="plus" size={15} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.filterContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by location"
          value={searchLocation}
          onChangeText={setSearchLocation}
        />
        <TouchableOpacity
          style={styles.datePickerButton}
          onPress={() => setShowDatePicker(true)}
        >
          <Text style={styles.datePickerText}>
            {selectedDate ? selectedDate.toDateString() : 'Select Date'}
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
          <Text style={styles.emptyText}>No entries found. Add your first entry!</Text>
        }
      />
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
    backgroundColor: '#fff',
    paddingTop: 50,
  },
  filterContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    padding: 10,

  },
  clearFilterButton: {
    backgroundColor: '#ff5252',
    borderRadius: 5,
    paddingVertical: 8,
    paddingHorizontal: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginRight: 10,
    backgroundColor: '#fff',
  },
  datePickerButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    backgroundColor: '#ddd',
    borderRadius: 5,
    marginRight: 5,
  },
  datePickerText: {
    color: '#333',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    position: 'relative',
    padding: 20,

  },
  backButton: {
    width: 35,
    height: 35,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#000',
    textAlign: 'center',
  },
  fab: {
    backgroundColor: '#525fe1',
    width: 35,
    height: 35,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 14,
    color: '#666',
    marginTop: 300,
    textAlign: 'center',
    fontFamily: 'Poppins_400Regular',
  },
  entryHeader: {
    flexDirection: 'column', 
    alignItems: 'flex-start', 
    marginBottom: 20,
  },
  entryDate: {
    fontSize: 12,
    color: '#666',
    fontFamily: 'Poppins_400Regular',
  },
  entryLocation: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'Poppins_400Regular',
   },
  entryDescription: {
    fontSize: 15,
    marginBottom: 15,
    color: '#333',
    fontFamily: 'Poppins_400Regular',
  },
  entryItem: {
    backgroundColor: '#fff',
    padding: 20,
    marginBottom: 5,
    borderTopWidth: 1, 
    borderBottomWidth: 1, 
    borderColor: '#e0e0e0', 
  },  
  sentimentContainer: {
    marginVertical: 10,
    borderRadius: 8,
    marginBottom: 30,
  },
  percentageText: {
    fontSize: 14,
    color: '#555',
    fontFamily: 'Poppins_400Regular',
  },
  entryFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  entryTime: {
    fontSize: 12,
    color: '#888',
    fontFamily: 'Poppins_400Regular',
  },
  readMoreButton: {
    padding: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  dateContainer: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    width: '100%',
  },
  dropdownContainer: {
    position: 'absolute',
    top: 35,
    right: 1,
    backgroundColor: 'white', 
    borderRadius: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    zIndex: 1000,
  },
  dropdownOption: {
    flexDirection: 'row', 
    alignItems: 'center', 
    paddingVertical: 10, 
    paddingHorizontal: 30,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  dropdownOptionLast: {
    borderBottomWidth: 0,
  },
  dropdownOptionText: {
    marginLeft: 20, 
    fontFamily: 'Poppins_400Regular', 
    color: '#333',
    fontSize: 14,
  },
});

export default MyEntry;
