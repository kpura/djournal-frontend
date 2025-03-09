import AsyncStorage from '@react-native-async-storage/async-storage';
import offlineManager from '../offlineManager';

const API_URL = 'http://192.168.1.11:3000';

class ApiService {
  constructor() {
    this.token = null;
    this.loadToken();
  }

  async loadToken() {
    try {
      const userData = await AsyncStorage.getItem('user_data');
      if (userData) {
        const { token } = JSON.parse(userData);
        this.token = token;
      }
    } catch (error) {
      console.error('Error loading token:', error);
    }
  }

  setToken(token) {
    this.token = token;
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      'Authorization': this.token ? `Bearer ${this.token}` : ''
    };
  }

  async login(email, password) {
    try {
      const isOnline = await offlineManager.checkConnection();
      
      if (!isOnline) {
        throw new Error('Cannot login while offline');
      }
      
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email, password })
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Login failed');
      }
      
      await AsyncStorage.setItem('user_data', JSON.stringify(data));
      this.token = data.token;
      
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      this.token = null;
      await AsyncStorage.removeItem('user_data');
      
      return { success: true };
    } catch (error) {
      console.error('Logout error:', error);
      throw error;
    }
  }

  async createJournal(journalData) {
    try {
      const isOnline = await offlineManager.checkConnection();
      
      if (!isOnline) {
        return offlineManager.saveJournalOffline(journalData);
      }
      
      const response = await fetch(`${API_URL}/api/journals`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(journalData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create journal');
      }
      
      await this.updateLocalJournals();
      
      return data;
    } catch (error) {
      console.error('Create journal error:', error);
      
      if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
        return offlineManager.saveJournalOffline(journalData);
      }
      
      throw error;
    }
  }

  async getJournals() {
    try {
      const isOnline = await offlineManager.checkConnection();
      
      if (!isOnline) {
        return offlineManager.getJournalsOffline();
      }
      
      const response = await fetch(`${API_URL}/api/journals`, {
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch journals');
      }
      
      await AsyncStorage.setItem('offline_journals', JSON.stringify(data));
      
      return data;
    } catch (error) {
      console.error('Get journals error:', error);
      
      if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
        return offlineManager.getJournalsOffline();
      }
      
      throw error;
    }
  }

  async updateJournal(journalId, journalData) {
    try {
      const isOnline = await offlineManager.checkConnection();
      
      if (!isOnline) {
        return offlineManager.updateJournalOffline(journalId, journalData);
      }
      
      const response = await fetch(`${API_URL}/api/journals/${journalId}`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(journalData)
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update journal');
      }
      
      await this.updateLocalJournals();
      
      return data;
    } catch (error) {
      console.error('Update journal error:', error);
      
      if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
        return offlineManager.updateJournalOffline(journalId, journalData);
      }
      
      throw error;
    }
  }

  async deleteJournal(journalId) {
    try {
      const isOnline = await offlineManager.checkConnection();
      
      if (!isOnline) {
        return offlineManager.deleteJournalOffline(journalId);
      }
      
      const response = await fetch(`${API_URL}/api/journals/${journalId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete journal');
      }
      
      await this.updateLocalJournals();
      
      return data;
    } catch (error) {
      console.error('Delete journal error:', error);
      
      if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
        return offlineManager.deleteJournalOffline(journalId);
      }
      
      throw error;
    }
  }

  async createEntry(entryData, files = []) {
    try {
      const isOnline = await offlineManager.checkConnection();
      
      if (!isOnline) {
        return offlineManager.saveEntryOffline(entryData, files);
      }
      
      const formData = new FormData();
      
      Object.keys(entryData).forEach(key => {
        formData.append(key, entryData[key]);
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
      
      const response = await fetch(`${API_URL}/api/entries`, {
        method: 'POST',
        headers: {
          'Authorization': this.token ? `Bearer ${this.token}` : ''
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to create entry');
      }
      
      await this.updateLocalEntriesForJournal(entryData.journal_id);
      
      return data;
    } catch (error) {
      console.error('Create entry error:', error);
      
      if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
        return offlineManager.saveEntryOffline(entryData, files);
      }
      
      throw error;
    }
  }

  async getEntries(journalId) {
    try {
      const isOnline = await offlineManager.checkConnection();
      
      if (!isOnline) {
        return offlineManager.getEntriesOffline(journalId);
      }
      
      const response = await fetch(`${API_URL}/api/entries/${journalId}`, {
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch entries');
      }
      
      await this.updateLocalEntriesForJournal(journalId, data.data);
      
      return data;
    } catch (error) {
      console.error('Get entries error:', error);
      
      if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
        return { data: await offlineManager.getEntriesOffline(journalId) };
      }
      
      throw error;
    }
  }

  async getEntry(entryId) {
    try {
      const isOnline = await offlineManager.checkConnection();
      
      if (!isOnline) {
        const offlineEntry = await offlineManager.getEntryOffline(entryId);
        if (offlineEntry) {
          return offlineEntry;
        }
        throw new Error('Entry not found offline');
      }
      
      const response = await fetch(`${API_URL}/api/entries/single/${entryId}`, {
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch entry');
      }
      
      return data;
    } catch (error) {
      console.error('Get entry error:', error);
      
      if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
        const offlineEntry = await offlineManager.getEntryOffline(entryId);
        if (offlineEntry) {
          return offlineEntry;
        }
      }
      
      throw error;
    }
  }

  async updateEntry(entryId, entryData, files = []) {
    try {
      const isOnline = await offlineManager.checkConnection();
      
      if (!isOnline) {
        return offlineManager.updateEntryOffline(entryId, entryData, files);
      }
      
      const formData = new FormData();
      
      Object.keys(entryData).forEach(key => {
        formData.append(key, entryData[key]);
      });
      
      if (files && files.length > 0) {
        files.forEach((file, index) => {
          if (file.uri) {
            const fileObj = {
              uri: file.uri,
              type: 'image/jpeg',
              name: `image_${index}.jpg`
            };
            formData.append('entry_images', fileObj);
          }
        });
      }
      
      const response = await fetch(`${API_URL}/api/entries/${entryId}`, {
        method: 'PUT',
        headers: {
          'Authorization': this.token ? `Bearer ${this.token}` : ''
        },
        body: formData
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to update entry');
      }
      
      const journalId = entryData.journal_id;
      if (journalId) {
        await this.updateLocalEntriesForJournal(journalId);
      }
      
      return data;
    } catch (error) {
      console.error('Update entry error:', error);
      
      if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
        return offlineManager.updateEntryOffline(entryId, entryData, files);
      }
      
      throw error;
    }
  }

  async deleteEntry(entryId, journalId) {
    try {
      const isOnline = await offlineManager.checkConnection();
      
      if (!isOnline) {
        return offlineManager.deleteEntryOffline(entryId);
      }
      
      const response = await fetch(`${API_URL}/api/entries/${entryId}`, {
        method: 'DELETE',
        headers: this.getHeaders()
      });
      
      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete entry');
      }
      
      if (journalId) {
        await this.updateLocalEntriesForJournal(journalId);
      }
      
      return data;
    } catch (error) {
      console.error('Delete entry error:', error);
      
      if (error.message.includes('Network') || error.message.includes('Failed to fetch')) {
        return offlineManager.deleteEntryOffline(entryId);
      }
      
      throw error;
    }
  }

  async updateLocalJournals() {
    try {
      const response = await fetch(`${API_URL}/api/journals`, {
        headers: this.getHeaders()
      });
      
      if (!response.ok) {
        return;
      }
      
      const journals = await response.json();
      
      const offlineJournalsJson = await AsyncStorage.getItem('offline_journals');
      let offlineJournals = offlineJournalsJson ? JSON.parse(offlineJournalsJson) : [];
      
      offlineJournals = offlineJournals.filter(journal => 
        journal.journal_id.startsWith('temp_') && journal.pendingSync
      );
      
      const mergedJournals = [...journals, ...offlineJournals];
      
      await AsyncStorage.setItem('offline_journals', JSON.stringify(mergedJournals));
    } catch (error) {
      console.error('Error updating local journals:', error);
    }
  }

  async updateLocalEntriesForJournal(journalId, entries = null) {
    try {
      if (!entries) {
        const response = await fetch(`${API_URL}/api/entries/${journalId}`, {
          headers: this.getHeaders()
        });
        
        if (!response.ok) {
          return;
        }
        
        const data = await response.json();
        entries = data.data;
      }
      
      const offlineEntriesJson = await AsyncStorage.getItem('offline_entries');
      let offlineEntries = offlineEntriesJson ? JSON.parse(offlineEntriesJson) : [];
      
      offlineEntries = offlineEntries.filter(entry => 
        entry.journal_id !== journalId || 
        (entry.journal_id === journalId && entry.entry_id.startsWith('temp_') && entry.pendingSync)
      );
      
      const mergedEntries = [...offlineEntries, ...entries];
      
      await AsyncStorage.setItem('offline_entries', JSON.stringify(mergedEntries));
    } catch (error) {
      console.error(`Error updating local entries for journal ${journalId}:`, error);
    }
  }

  async syncOfflineData() {
    return offlineManager.syncOfflineData();
  }

  async hasPendingSyncData() {
    try {
      const queueJSON = await AsyncStorage.getItem('sync_queue');
      if (!queueJSON) return false;
      
      const queue = JSON.parse(queueJSON);
      return queue.length > 0;
    } catch (error) {
      console.error('Error checking pending sync data:', error);
      return false;
    }
  }

  async isOnline() {
    return offlineManager.checkConnection();
  }
}

export default new ApiService();