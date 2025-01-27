import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createJournal, updateJournal } from '../api';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';

const AddJournal = ({ visible, onClose, journal }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    if (journal) {
      setTitle(journal.journal_title);
      setDate(new Date(journal.journal_date));
    } else {
      setTitle('');
      setDate(new Date());
    }
  }, [journal]);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  const handleSave = async () => {
    if (!title) {
      alert('Please enter a title');
      return;
    }

    try {
      if (journal) {
        await updateJournal(journal.journal_id, title, date.toISOString().split('T')[0]);
        alert('Journal updated successfully');
      } else {
        await createJournal(title, date.toISOString().split('T')[0]);
        alert('Journal saved successfully');
      }
      setTitle('');
      setDate(new Date());
      onClose();
    } catch (error) {
      alert(`Error saving journal: ${error.message}`);
      console.error('Error saving journal:', error);
    }
  };

  if (!fontsLoaded) {
    return null;
  }

  return (
    <Modal visible={visible} transparent={true} animationType="slide" onRequestClose={onClose}>
      <View style={styles.modalBackground}>
        <View style={styles.modalContainer}>
          <Text style={styles.modalTitle}>{journal ? 'Edit Journal' : 'Add Journal'}</Text>
      
          <TextInput
            style={styles.input}
            placeholder="Enter a journal name"
            value={title}
            onChangeText={setTitle}
          />
          <TouchableOpacity style={styles.dateButton} onPress={() => setShowDatePicker(true)}>
            <Text style={styles.dateButtonText}>Select Date: {date.toDateString()}</Text>
          </TouchableOpacity>
          {showDatePicker && (
            <DateTimePicker
              value={date}
              mode="date"
              display="default"
              onChange={(event, selectedDate) => {
                setShowDatePicker(false);
                if (selectedDate) setDate(selectedDate);
              }}
            />
          )}
          <View style={styles.buttonContainer}>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
              <Text style={styles.saveButtonText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );  
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContainer: {
    width: '90 %',
    padding: 20,
    backgroundColor: '#fff',
    borderRadius: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 8,
  },
  modalTitle: {
    fontSize: 20,
    color: '#333',
    marginBottom: 20,
    textAlign: 'center',
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'left',
  },
  input: {
    height: 50,
    borderColor: '#dcdcdc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 10,
    paddingHorizontal: 15,
    fontSize: 16,
    color: '#333',
    fontFamily: 'Poppins_400Regular',
  },
  dateButton: {
    paddingVertical: 11,
    borderColor: '#dcdcdc',
    borderWidth: 1,
    borderRadius: 8,
    marginBottom: 15,
    alignItems: 'center',
  },
  dateButtonText: {
    fontSize: 16,
    color: '#333',
    fontFamily: 'Poppins_400Regular',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#5a67d8',
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginLeft: 5,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
  },
  closeButton: {
    flex: 1,
    borderColor: '#dcdcdc',
    borderWidth: 1,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: 'center',
    marginRight: 10,
  },
  closeButtonText: {
    color: '#000',
    fontSize: 15,
    fontFamily: 'Poppins_400Regular',
  },
  buttonContainer: {
    flexDirection: 'row',
    marginTop: 20,
    marginBottom: 10,
    width: '100%', 
  },
});

export default AddJournal;