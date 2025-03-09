import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import { v4 as uuidv4 } from 'uuid';

class OfflineManager {
  constructor() {
    this.isOnline = true;
    this.syncQueue = [];
    this.setupNetworkListener();
  }

  setupNetworkListener() {
    NetInfo.addEventListener(state => {
      const wasOffline = !this.isOnline;
      this.isOnline = state.isConnected && state.isInternetReachable;
      
      if (wasOffline && this.isOnline) {
        this.syncOfflineData();
      }
    });
  }

  async checkConnection() {
    const networkState = await NetInfo.fetch();
    this.isOnline = networkState.isConnected && networkState.isInternetReachable;
    return this.isOnline;
  }

  async saveJournalOffline(journalData) {
    try {
      const tempId = `temp_${uuidv4()}`;
      const journalWithId = { ...journalData, journal_id: tempId, pendingSync: true };
      
      const journalsJSON = await AsyncStorage.getItem('offline_journals');
      const journals = journalsJSON ? JSON.parse(journalsJSON) : [];
      
      journals.push(journalWithId);
      
      await AsyncStorage.setItem('offline_journals', JSON.stringify(journals));
      
      this.addToSyncQueue('journal', 'create', journalWithId);
      
      return { ...journalWithId, offline: true };
    } catch (error) {
      console.error('Error saving journal offline:', error);
      throw error;
    }
  }

  async saveEntryOffline(entryData, files = []) {
    try {
      const tempId = `temp_${uuidv4()}`;
      
      let entry_images = [];
      if (files && files.length > 0) {
        entry_images = files.map(file => ({ uri: file.uri, pendingUpload: true }));
      }
      
      const entryWithId = { 
        ...entryData, 
        entry_id: tempId, 
        entry_images: JSON.stringify(entry_images),
        pendingSync: true,
        sentiment: 'neutral',
        positive_percentage: 0,
        negative_percentage: 0,
        neutral_percentage: 100
      };
      
      const entriesJSON = await AsyncStorage.getItem('offline_entries');
      const entries = entriesJSON ? JSON.parse(entriesJSON) : [];
      
      entries.push(entryWithId);
      
      await AsyncStorage.setItem('offline_entries', JSON.stringify(entries));
      
      this.addToSyncQueue('entry', 'create', { ...entryWithId, files });
      
      return { ...entryWithId, offline: true };
    } catch (error) {
      console.error('Error saving entry offline:', error);
      throw error;
    }
  }

  async updateJournalOffline(journalId, journalData) {
    try {
      const journalsJSON = await AsyncStorage.getItem('offline_journals');
      const journals = journalsJSON ? JSON.parse(journalsJSON) : [];
      
      const updatedJournals = journals.map(journal => {
        if (journal.journal_id === journalId) {
          const updatedJournal = { ...journal, ...journalData, pendingSync: true };
          
          if (!journalId.startsWith('temp_')) {
            this.addToSyncQueue('journal', 'update', updatedJournal);
          }
          
          return updatedJournal;
        }
        return journal;
      });
      
      await AsyncStorage.setItem('offline_journals', JSON.stringify(updatedJournals));
      
      return { success: true, offline: true };
    } catch (error) {
      console.error('Error updating journal offline:', error);
      throw error;
    }
  }

  async updateEntryOffline(entryId, entryData, files = []) {
    try {
      const entriesJSON = await AsyncStorage.getItem('offline_entries');
      const entries = entriesJSON ? JSON.parse(entriesJSON) : [];
      
      let entry_images = [];
      if (entryData.existing_images) {
        try {
          entry_images = JSON.parse(entryData.existing_images);
        } catch (error) {
          console.error('Error parsing existing images:', error);
        }
      }
      
      if (files && files.length > 0) {
        const newImages = files.map(file => ({ uri: file.uri, pendingUpload: true }));
        entry_images = [...entry_images, ...newImages];
      }
      
      const updatedEntries = entries.map(entry => {
        if (entry.entry_id === entryId) {
          const updatedEntry = { 
            ...entry, 
            ...entryData, 
            entry_images: JSON.stringify(entry_images),
            pendingSync: true 
          };
          
          if (!entryId.startsWith('temp_')) {
            this.addToSyncQueue('entry', 'update', { ...updatedEntry, files });
          }
          
          return updatedEntry;
        }
        return entry;
      });
      
      await AsyncStorage.setItem('offline_entries', JSON.stringify(updatedEntries));
      
      return { 
        success: true, 
        offline: true,
        entry_images
      };
    } catch (error) {
      console.error('Error updating entry offline:', error);
      throw error;
    }
  }

  async deleteJournalOffline(journalId) {
    try {
      const journalsJSON = await AsyncStorage.getItem('offline_journals');
      const journals = journalsJSON ? JSON.parse(journalsJSON) : [];
      
      const entriesJSON = await AsyncStorage.getItem('offline_entries');
      const entries = entriesJSON ? JSON.parse(entriesJSON) : [];
      
      const updatedJournals = journals.filter(journal => journal.journal_id !== journalId);
      
      const updatedEntries = entries.filter(entry => entry.journal_id !== journalId);
      
      await AsyncStorage.setItem('offline_journals', JSON.stringify(updatedJournals));
      await AsyncStorage.setItem('offline_entries', JSON.stringify(updatedEntries));
      
      if (!journalId.startsWith('temp_')) {
        this.addToSyncQueue('journal', 'delete', { journal_id: journalId });
      }
      
      return { success: true, offline: true };
    } catch (error) {
      console.error('Error deleting journal offline:', error);
      throw error;
    }
  }

  async deleteEntryOffline(entryId) {
    try {
      const entriesJSON = await AsyncStorage.getItem('offline_entries');
      const entries = entriesJSON ? JSON.parse(entriesJSON) : [];
      
      const updatedEntries = entries.filter(entry => entry.entry_id !== entryId);
      
      await AsyncStorage.setItem('offline_entries', JSON.stringify(updatedEntries));
      
      if (!entryId.startsWith('temp_')) {
        this.addToSyncQueue('entry', 'delete', { entry_id: entryId });
      }
      
      return { success: true, offline: true };
    } catch (error) {
      console.error('Error deleting entry offline:', error);
      throw error;
    }
  }

  async getJournalsOffline() {
    try {
      const journalsJSON = await AsyncStorage.getItem('offline_journals');
      return journalsJSON ? JSON.parse(journalsJSON) : [];
    } catch (error) {
      console.error('Error getting journals offline:', error);
      return [];
    }
  }

  async getEntriesOffline(journalId) {
    try {
      const entriesJSON = await AsyncStorage.getItem('offline_entries');
      const entries = entriesJSON ? JSON.parse(entriesJSON) : [];
      
      return entries.filter(entry => entry.journal_id === journalId);
    } catch (error) {
      console.error('Error getting entries offline:', error);
      return [];
    }
  }

  async getEntryOffline(entryId) {
    try {
      const entriesJSON = await AsyncStorage.getItem('offline_entries');
      const entries = entriesJSON ? JSON.parse(entriesJSON) : [];
      
      return entries.find(entry => entry.entry_id === entryId) || null;
    } catch (error) {
      console.error('Error getting entry offline:', error);
      return null;
    }
  }

  async addToSyncQueue(type, operation, data) {
    try {
      const queueJSON = await AsyncStorage.getItem('sync_queue');
      const queue = queueJSON ? JSON.parse(queueJSON) : [];
      
      queue.push({
        type,
        operation,
        data,
        timestamp: new Date().toISOString()
      });
      
      await AsyncStorage.setItem('sync_queue', JSON.stringify(queue));
      this.syncQueue = queue;
    } catch (error) {
      console.error('Error adding to sync queue:', error);
    }
  }

  async syncOfflineData() {
    if (!this.isOnline) return;
    
    try {
      const queueJSON = await AsyncStorage.getItem('sync_queue');
      if (!queueJSON) return;
      
      const queue = JSON.parse(queueJSON);
      if (queue.length === 0) return;
      
      console.log(`Starting sync of ${queue.length} pending operations`);
      
      for (const item of queue) {
        await this.processSyncItem(item);
      }
      
      await AsyncStorage.setItem('sync_queue', JSON.stringify([]));
      this.syncQueue = [];
      
      await this.refreshLocalStorage();
      
      console.log('Sync completed successfully');
    } catch (error) {
      console.error('Error during sync:', error);
    }
  }

  async processSyncItem(item) {
    const { type, operation, data } = item;
    
    try {
      if (type === 'journal') {
        if (operation === 'create') {
          const result = await this.createJournalOnServer(data);
          await this.updateLocalJournalId(data.journal_id, result.journal_id);
        } else if (operation === 'update') {
          await this.updateJournalOnServer(data);
        } else if (operation === 'delete') {
          await this.deleteJournalOnServer(data.journal_id);
        }
      } else if (type === 'entry') {
        if (operation === 'create') {
          const result = await this.createEntryOnServer(data);
          await this.updateLocalEntryId(data.entry_id, result.entry_id);
        } else if (operation === 'update') {
          await this.updateEntryOnServer(data);
        } else if (operation === 'delete') {
          await this.deleteEntryOnServer(data.entry_id);
        }
      }
    } catch (error) {
      console.error(`Error processing sync item (${type}, ${operation}):`, error);
      throw error;
    }
  }

  async createJournalOnServer(journalData) {
    const { pendingSync, ...cleanData } = journalData;
    
    const response = await fetch('/api/journals', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this.getToken()}`
      },
      body: JSON.stringify(cleanData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to create journal on server');
    }
    
    return await response.json();
  }

  async updateJournalOnServer(journalData) {
    const { pendingSync, ...cleanData } = journalData;
    
    const response = await fetch(`/api/journals/${journalData.journal_id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${await this.getToken()}`
      },
      body: JSON.stringify(cleanData)
    });
    
    if (!response.ok) {
      throw new Error('Failed to update journal on server');
    }
    
    return await response.json();
  }

  async deleteJournalOnServer(journalId) {
    const response = await fetch(`/api/journals/${journalId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${await this.getToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete journal on server');
    }
    
    return await response.json();
  }

  async createEntryOnServer(entryData) {
    const formData = new FormData();
    
    const { pendingSync, files, ...cleanData } = entryData;
    
    Object.keys(cleanData).forEach(key => {
      formData.append(key, cleanData[key]);
    });
    
    if (files && files.length > 0) {
      files.forEach((file, index) => {
        const fileObj = {
          uri: file.uri,
          type: 'image/jpeg',
          name: `image_${index}.jpg`
        };
        formData.append('entry_images', fileObj);
      });
    }
    
    const response = await fetch('/api/entries', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await this.getToken()}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Failed to create entry on server');
    }
    
    return await response.json();
  }

  async updateEntryOnServer(entryData) {
    const formData = new FormData();
    
    const { pendingSync, files, ...cleanData } = entryData;
    
    Object.keys(cleanData).forEach(key => {
      formData.append(key, cleanData[key]);
    });
    
    if (files && files.length > 0) {
      files.forEach((file, index) => {
        if (file.pendingUpload) {
          const fileObj = {
            uri: file.uri,
            type: 'image/jpeg',
            name: `image_${index}.jpg`
          };
          formData.append('entry_images', fileObj);
        }
      });
    }
    
    const response = await fetch(`/api/entries/${entryData.entry_id}`, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${await this.getToken()}`
      },
      body: formData
    });
    
    if (!response.ok) {
      throw new Error('Failed to update entry on server');
    }
    
    return await response.json();
  }

  async deleteEntryOnServer(entryId) {
    const response = await fetch(`/api/entries/${entryId}`, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${await this.getToken()}`
      }
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete entry on server');
    }
    
    return await response.json();
  }

  async updateLocalJournalId(tempId, serverId) {
    try {
      const journalsJSON = await AsyncStorage.getItem('offline_journals');
      if (!journalsJSON) return;
      
      let journals = JSON.parse(journalsJSON);
      journals = journals.map(journal => {
        if (journal.journal_id === tempId) {
          return { ...journal, journal_id: serverId, pendingSync: false };
        }
        return journal;
      });
      
      await AsyncStorage.setItem('offline_journals', JSON.stringify(journals));
      
      const entriesJSON = await AsyncStorage.getItem('offline_entries');
      if (!entriesJSON) return;
      
      let entries = JSON.parse(entriesJSON);
      entries = entries.map(entry => {
        if (entry.journal_id === tempId) {
          return { ...entry, journal_id: serverId };
        }
        return entry;
      });
      
      await AsyncStorage.setItem('offline_entries', JSON.stringify(entries));
    } catch (error) {
      console.error('Error updating local journal ID:', error);
    }
  }

  async updateLocalEntryId(tempId, serverId) {
    try {
      const entriesJSON = await AsyncStorage.getItem('offline_entries');
      if (!entriesJSON) return;
      
      let entries = JSON.parse(entriesJSON);
      entries = entries.map(entry => {
        if (entry.entry_id === tempId) {
          return { ...entry, entry_id: serverId, pendingSync: false };
        }
        return entry;
      });
      
      await AsyncStorage.setItem('offline_entries', JSON.stringify(entries));
    } catch (error) {
      console.error('Error updating local entry ID:', error);
    }
  }

  async refreshLocalStorage() {
    try {
      const journalsResponse = await fetch('/api/journals', {
        headers: {
          'Authorization': `Bearer ${await this.getToken()}`
        }
      });
      
      if (!journalsResponse.ok) {
        throw new Error('Failed to fetch journals from server');
      }
      
      const serverJournals = await journalsResponse.json();
      
      const journalsJSON = await AsyncStorage.getItem('offline_journals');
      let localJournals = journalsJSON ? JSON.parse(journalsJSON) : [];
      
      localJournals = localJournals.filter(journal => 
        !journal.journal_id.startsWith('temp_') || journal.pendingSync
      );
      
      const mergedJournals = [...serverJournals];
      
      localJournals.forEach(localJournal => {
        if (localJournal.journal_id.startsWith('temp_') && localJournal.pendingSync) {
          mergedJournals.push(localJournal);
        }
      });
      
      await AsyncStorage.setItem('offline_journals', JSON.stringify(mergedJournals));
      
      for (const journal of serverJournals) {
        await this.refreshEntriesForJournal(journal.journal_id);
      }
    } catch (error) {
      console.error('Error refreshing local storage:', error);
    }
  }

  async refreshEntriesForJournal(journalId) {
    try {
      const entriesResponse = await fetch(`/api/entries/${journalId}`, {
        headers: {
          'Authorization': `Bearer ${await this.getToken()}`
        }
      });
      
      if (!entriesResponse.ok) {
        throw new Error(`Failed to fetch entries for journal ${journalId}`);
      }
      
      const serverEntries = await entriesResponse.json();
      
      const entriesJSON = await AsyncStorage.getItem('offline_entries');
      let localEntries = entriesJSON ? JSON.parse(entriesJSON) : [];
      
      const journalLocalEntries = localEntries.filter(entry => 
        entry.journal_id === journalId
      );
      
      localEntries = localEntries.filter(entry => 
        entry.journal_id !== journalId || 
        (entry.journal_id === journalId && entry.entry_id.startsWith('temp_') && entry.pendingSync)
      );
      
      const allEntries = [...localEntries, ...serverEntries.data];
      
      await AsyncStorage.setItem('offline_entries', JSON.stringify(allEntries));
    } catch (error) {
      console.error(`Error refreshing entries for journal ${journalId}:`, error);
    }
  }

  async getToken() {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      if (!userData) {
        throw new Error('No user data found');
      }
      
      const { token } = JSON.parse(userData);
      return token;
    } catch (error) {
      console.error('Error getting token:', error);
      throw error;
    }
  }
}

export default new OfflineManager();