import React, { useState, useEffect } from 'react';
import { Modal, View, Text, TextInput, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { createJournal, updateJournal } from '../api';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

const CustomAlert = ({ visible, message, type, onClose }) => {
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();

      const timer = setTimeout(() => {
        handleClose();
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [visible]);

  const handleClose = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  if (!visible) return null;

  return (
    <Modal transparent visible={visible} animationType="none" onRequestClose={handleClose}>
      <View style={styles.alertOverlay}>
        <Animated.View 
          style={[
            styles.alertContainer, 
            { opacity: fadeAnim },
            type === 'error' ? styles.errorAlert : styles.successAlert
          ]}
        >
          <View style={styles.alertIconContainer}>
            <FontAwesome5 
              name={type === 'error' ? "exclamation-circle" : "check-circle"} 
              size={24} 
              color={type === 'error' ? "#fff" : "#fff"} 
            />
          </View>
          <Text style={styles.alertText}>{message}</Text>
        </Animated.View>
      </View>
    </Modal>
  );
};

const AddJournal = ({ visible, onClose, journal }) => {
  const [title, setTitle] = useState('');
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  
  // Alert state
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [alertType, setAlertType] = useState('success');

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

  const showAlert = (message, type = 'success') => {
    setAlertMessage(message);
    setAlertType(type);
    setAlertVisible(true);
  };

  const hideAlert = () => {
    setAlertVisible(false);
  };

  const handleSave = async () => {
    if (!title) {
      showAlert('Oops! A title is required. Please enter one.', 'error');
      return;
    }
  
    try {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      
      if (journal) {
        await updateJournal(journal.journal_id, title, formattedDate);
        showAlert('Journal has been successfully updated!');
      } else {
        await createJournal(title, formattedDate);
        showAlert('Journal saved! Start adding your entries now.');
      }
      
      setTimeout(() => {
        setTitle('');
        setDate(new Date());
        onClose();
      }, 2500);
    } catch (error) {
      showAlert(`Error saving journal: ${error.message}`, 'error');
      console.error('Error saving journal:', error);
    }
  };  

  if (!fontsLoaded) {
    return null;
  }

  return (
    <>
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

      <CustomAlert 
        visible={alertVisible} 
        message={alertMessage} 
        type={alertType} 
        onClose={hideAlert} 
      />
    </>
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
    width: '90%',
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
    color: '#13547D',
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
    backgroundColor: '#237CA2',
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
  alertOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    alignItems: 'center',
    backgroundColor: 'transparent',
    zIndex: 1000,
    paddingBottom: 20,
  },
  alertContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    minWidth: '90%',
    maxWidth: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 6,
  },
  successAlert: {
    backgroundColor: '#4CAF50',
  },
  errorAlert: {
    backgroundColor: '#ff5252',
  },
  alertIconContainer: {
    marginRight: 12,
  },
  alertText: {
    color: '#fff',
    fontSize: 14,
    fontFamily: 'Poppins_400Regular',
    flexShrink: 1,
  },
});

export default AddJournal;