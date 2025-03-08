import React, { useState, useEffect, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity, FlatList, Text, RefreshControl, Alert, Modal } from 'react-native';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import AddJournal from '../components/AddJournal';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import { Swipeable } from 'react-native-gesture-handler';
import { fetchJournals as apiFetchJournals, deleteJournal } from '../api';

//import NetInfo from "@react-native-community/netinfo";
//import { useEffect, useState } from "react";
//import { getOfflineJournals } from "../api/database";
//import { fetchJournalsOnline } from "../api/api"; 

//useEffect(() => {
  //const fetchJournals = async () => {
    //const isConnected = await NetInfo.fetch().then(state => state.isConnected);

    //if (isConnected) {
      //const onlineJournals = await fetchJournalsOnline();
      //setJournals(onlineJournals);
    //} else {
      //const offlineJournals = await getOfflineJournals();
      //setJournals(offlineJournals);
    //}
  //};

  //fetchJournals();
//}, []);

const MyJournal = () => {
  const [journals, setJournals] = useState([]);
  const [isModalVisible, setModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const navigation = useNavigation();
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedJournal, setSelectedJournal] = useState(null);
  const [selectedIndex, setSelectedIndex] = useState(null);
  const [deletedJournal, setDeletedJournal] = useState(null);
  const [showUndoMessage, setShowUndoMessage] = useState(false);
  const [undoTimer, setUndoTimer] = useState(null);
  const [deleteConfirmVisible, setDeleteConfirmVisible] = useState(false);
  const [editConfirmVisible, setEditConfirmVisible] = useState(false);
  const [journalToEdit, setJournalToEdit] = useState(null);
  const [openSwipeableIndex, setOpenSwipeableIndex] = useState(null);
  const swipeableRefs = useRef([]);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  const fetchJournals = async () => {
    setRefreshing(true);
    try {
      const data = await apiFetchJournals();
      setJournals(data || []);
    } catch (error) {
      console.error('Error fetching journals:', error);
      Alert.alert('Error', 'Unable to fetch journals. Please try again.');
      setJournals([]);
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

  const showEditConfirm = (journal, index) => {
    setSelectedJournal(journal);
    setSelectedIndex(index);
    setEditConfirmVisible(true);
    swipeableRefs.current[index]?.close();
  };
  
  const handleUpdate = () => {
    setEditConfirmVisible(false);
    openModal();
    setJournalToEdit(selectedJournal);
  };

  const performDelete = async (journalId) => {
    try {
      await deleteJournal(journalId);
      apiFetchJournals();
    } catch (error) {
      console.error('Error deleting journal:', error.message);
      alert('Failed to delete journal');
    }
  };

  const handleDelete = () => {
    setDeleteConfirmVisible(false);
    
    const journalToDelete = selectedJournal;
    
    setDeletedJournal(journalToDelete);
    
    const updatedJournals = journals.filter(journal => journal.journal_id !== journalToDelete.journal_id);
    setJournals(updatedJournals);
    
    setShowUndoMessage(true);
    
    if (undoTimer) {
      clearTimeout(undoTimer);
    }
    
    const timer = setTimeout(() => {
      performDelete(journalToDelete.journal_id);
      setShowUndoMessage(false);
      setDeletedJournal(null);
    }, 3000);
    
    setUndoTimer(timer);
  };

  const handleUndo = () => {
    if (deletedJournal) {
      if (undoTimer) {
        clearTimeout(undoTimer);
      }
      
      const restoredJournals = [...journals, deletedJournal];
      setJournals(restoredJournals);
      
      setShowUndoMessage(false);
      setDeletedJournal(null);
    }
  };

  const showDeleteConfirm = (journal, index) => {
    setSelectedJournal(journal);
    setSelectedIndex(index);
    setOpenSwipeableIndex(index);
    setDeleteConfirmVisible(true);
  };

  const renderRightActions = (journal, index) => (
    <View style={styles.actionContainer}>
      <TouchableOpacity
        style={styles.iconButton}
        onPress={() => showEditConfirm(journal, index)}
      >
        <FontAwesome5 name="pencil-alt" size={16} color="#fff" />
      </TouchableOpacity>
      <TouchableOpacity
        style={[
          styles.iconButton, 
          styles.deleteButton,
          isDeleting && openSwipeableIndex === index ? styles.loadingButton : null
        ]}
        onPress={() => showDeleteConfirm(journal, index)}
        disabled={isDeleting}
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

  if (!fontsLoaded) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.title}>Journals</Text>
        </View>
      </View>

      {(!journals || journals.length === 0) ? (
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
                      navigation.navigate('MyEntry', { 
                        journalId: item.journal_id,
                        journalTitle: item.journal_title 
                      })
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
                        <Text 
                          style={styles.journalTextOverlay}
                          numberOfLines={2}
                          ellipsizeMode="tail"
                        >
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
            contentContainerStyle={{ paddingBottom: 100 }}
            ListEmptyComponent={() => (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>No journals yet</Text>
                <Text style={styles.emptySubtext}>Tap '+' to create your first journal</Text>
              </View>
            )}
            ListFooterComponent={() => (
              <Text style={styles.swipeInstructionText}>
                Swipe left to edit or delete journal
              </Text>
            )}
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

      {/* Delete Confirmation Modal */}
      <Modal
        transparent={true}
        visible={deleteConfirmVisible}
        animationType="fade"
        onRequestClose={() => setDeleteConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationModal}>
            <Text style={styles.confirmDelete}>Delete Journal</Text>
            <Text style={styles.confirmText}>
              This journal and all its entries will be permanently deleted and cannot be recovered.
            </Text>
            <View style={styles.confirmButtonContainer}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.cancelButton]}
                onPress={() => {
                  setDeleteConfirmVisible(false);
                  swipeableRefs.current[selectedIndex]?.close();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.deleteConfirmButton]}
                onPress={handleDelete}
              >
                <Text style={styles.deleteButtonText}>Delete</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Edit Confirmation Modal */}
      <Modal
        transparent={true}
        visible={editConfirmVisible}
        animationType="fade"
        onRequestClose={() => setEditConfirmVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.confirmationModal}>
            <Text style={styles.confirmTitle}>Edit Journal</Text>
            <Text style={styles.confirmText}>
              Do you want to edit "{selectedJournal?.journal_title}"?
            </Text>
            <View style={styles.confirmButtonContainer}>
              <TouchableOpacity
                style={[styles.confirmButton, styles.cancelButton]}
                onPress={() => {
                  setEditConfirmVisible(false);
                  swipeableRefs.current[selectedIndex]?.close();
                }}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.confirmButton, styles.editConfirmButton]}
                onPress={handleUpdate}
              >
                <Text style={styles.editButtonText}>Edit</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {showUndoMessage && (
        <View style={styles.undoContainer}>
          <Text style={styles.undoText}>Journal deleted.</Text>
          <TouchableOpacity onPress={handleUndo} style={styles.undoButton}>
            <Text style={styles.undoButtonText}>Undo</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
    padding: 15,
    paddingTop: 50,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  swipeInstructionText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 12,
    color: '#13547D',
    textAlign: 'center',
    marginTop: 20,
    fontStyle: 'italic',
  },
  title: {
    fontSize: 35,
    fontFamily: 'Poppins_600SemiBold',
    textAlign: 'left',
    marginBottom: 5,
    color: '#13547D',
    left: 5,
  },
  fabCenter: {
    position: 'absolute',
    bottom: '50%',
    alignSelf: 'center',
    backgroundColor: '#237CA2',
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
    backgroundColor: '#237CA2',
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
    marginBottom: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5,
    marginLeft: 5,
    marginRight: 5,
  },
  journalContent: {
    height: 110,
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 15,
    justifyContent: 'center',
    flex: 1,
    shadowColor: '#13547D',
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
    backgroundColor: '#237CA2',
    padding: 25,
    borderRadius: 18,
  },
  journalTextOverlay: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#13547D',
    textAlign: 'left',
    maxWidth: 200,
  },
  journalDateOverlay: {
    fontSize: 10,
    fontFamily: 'Poppins_400Regular',
    color: '#13547D',
    left: 2,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-evenly',
    width: 120,
  },
  iconButton: {
    backgroundColor: '#4CAF50',
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  deleteButton: {
    backgroundColor: '#ff5252',
  },
  loadingButton: {
    backgroundColor: '#999',
  },
  successButton: {
    backgroundColor: '#ff5252',
  },
  errorButton: {
    backgroundColor: '#F44336',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  confirmationModal: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 5,
  },
  confirmTitle: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#4CAF50',
    marginBottom: 10,
  },
  confirmDelete: {
    fontSize: 18,
    fontFamily: 'Poppins_600SemiBold',
    color: '#ff5252',
    marginBottom: 10,
  },
  confirmText: {
    fontFamily: 'Poppins_400Regular',
    textAlign: 'center',
    marginBottom: 20,
    color: '#666',
    fontSize: 14,
  },
  confirmButtonContainer: {
    flexDirection: 'row',
    width: '100%',
    justifyContent: 'space-between',
  },
  confirmButton: {
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 8,
    minWidth: '45%',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#f5f5f5',
  },
  deleteConfirmButton: {
    backgroundColor: '#ff5252',
  },
  editConfirmButton: {
    backgroundColor: '#4CAF50',
  },
  cancelButtonText: {
    color: '#666',
    fontFamily: 'Poppins_400Regular',
  },
  deleteButtonText: {
    color: 'white',
    fontFamily: 'Poppins_600SemiBold',
  },
  editButtonText: {
    color: 'white',
    fontFamily: 'Poppins_600SemiBold',
  },
  undoContainer: {
    position: 'absolute',
    bottom: 10,
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

export default MyJournal;