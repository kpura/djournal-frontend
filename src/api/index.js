import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { v4 as uuidv4 } from 'uuid';

const api = axios.create({
  baseURL: 'http://192.168.1.3:3000/api',
});

const API_URL = api.defaults.baseURL;

api.interceptors.request.use(
  async (config) => {
    const token = await AsyncStorage.getItem('userToken');
    console.log('Token from storage:', token);
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('Authorization header set:', config.headers.Authorization);
    } else {
      console.log('No token found in storage');
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response && error.response.status === 401) {
      console.log('Authentication error: Token may be invalid or expired');
    }
    return Promise.reject(error);
  }
);

// Offline helper function for queueing operations
const addPendingOperation = async (type, operationType, data) => {
  try {
    const key = `pending${type}Ops`;
    const pendingOps = await AsyncStorage.getItem(key);
    const operations = pendingOps ? JSON.parse(pendingOps) : [];
    
    operations.push({
      id: uuidv4(),
      type: operationType,
      data,
      timestamp: new Date().toISOString()
    });
    
    await AsyncStorage.setItem(key, JSON.stringify(operations));
  } catch (error) {
    console.error(`Error adding pending ${type} operation:`, error);
  }
};

// Offline Journal Methods
const offlineCreateJournal = async (title, date) => {
  try {
    const tempId = `temp_${uuidv4()}`;
    const newJournal = {
      journal_id: tempId,
      journal_title: title,
      journal_date: date,
      is_temp: true,
      created_at: new Date().toISOString()
    };
    const journalsStr = await AsyncStorage.getItem('journals');
    const journals = journalsStr ? JSON.parse(journalsStr) : [];
    journals.push(newJournal);
    await AsyncStorage.setItem('journals', JSON.stringify(journals));
    await addPendingOperation('Journal', 'create', {
      journal_title: title,
      journal_date: date
    });
    return newJournal;
  } catch (error) {
    console.error('Error creating journal offline:', error);
    throw new Error(`Offline error creating journal: ${error.message}`);
  }
};

const offlineFetchJournals = async () => {
  try {
    const journalsStr = await AsyncStorage.getItem('journals');
    return journalsStr ? JSON.parse(journalsStr) : [];
  } catch (error) {
    console.error('Error fetching journals offline:', error);
    return [];
  }
};

const offlineUpdateJournal = async (journalId, title, date) => {
  try {
    const journalsStr = await AsyncStorage.getItem('journals');
    const journals = journalsStr ? JSON.parse(journalsStr) : [];
    const updatedJournals = journals.map(journal => {
      if (journal.journal_id === journalId) {
        return {
          ...journal,
          journal_title: title,
          journal_date: date,
          updated_at: new Date().toISOString()
        };
      }
      return journal;
    });
    await AsyncStorage.setItem('journals', JSON.stringify(updatedJournals));
    await addPendingOperation('Journal', 'update', {
      journal_id: journalId,
      journal_title: title,
      journal_date: date
    });
    return { journal_id: journalId, journal_title: title, journal_date: date };
  } catch (error) {
    console.error('Error updating journal offline:', error);
    throw new Error(`Offline error updating journal: ${error.message}`);
  }
};

const offlineDeleteJournal = async (journalId) => {
  try {
    const journalsStr = await AsyncStorage.getItem('journals');
    const journals = journalsStr ? JSON.parse(journalsStr) : [];
    const updatedJournals = journals.filter(journal => journal.journal_id !== journalId);
    await AsyncStorage.setItem('journals', JSON.stringify(updatedJournals));
    await addPendingOperation('Journal', 'delete', {
      journal_id: journalId
    });
    return { success: true };
  } catch (error) {
    console.error('Error deleting journal offline:', error);
    throw new Error(`Offline error deleting journal: ${error.message}`);
  }
};

// Offline Entry Methods
const offlineCreateEntry = async (entryData) => {
  try {
    const tempId = `temp_${uuidv4()}`;
    const newEntry = {
      entry_id: tempId,
      ...entryData,
      is_temp: true,
      created_at: new Date().toISOString()
    };
    if (newEntry.entry_images && newEntry.entry_images.length > 0) {
      newEntry.pending_images = newEntry.entry_images;
      newEntry.entry_images = [];
    }
    const entriesKey = `entries_${entryData.journal_id}`;
    const entriesStr = await AsyncStorage.getItem(entriesKey);
    let entries = [];
    if (entriesStr) {
      const parsed = JSON.parse(entriesStr);
      // Ensure that the parsed value is an array
      if (Array.isArray(parsed)) {
        entries = parsed;
      } else {
        console.warn("Stored entries is not an array. Resetting to empty array.");
      }
    }
    entries.push(newEntry);
    await AsyncStorage.setItem(entriesKey, JSON.stringify(entries));
    await addPendingOperation('Entry', 'create', newEntry);
    return newEntry;
  } catch (error) {
    console.error('Error creating entry offline:', error);
    throw new Error(`Offline error creating entry: ${error.message}`);
  }
};

const offlineFetchEntries = async (journalId) => {
  try {
    const entriesKey = `entries_${journalId}`;
    const entriesStr = await AsyncStorage.getItem(entriesKey);
    const entries = entriesStr ? JSON.parse(entriesStr) : [];
    return { data: entries };
  } catch (error) {
    console.error('Error fetching entries offline:', error);
    return { data: [] };
  }
};

const offlineUpdateEntry = async (entryId, entryData) => {
  try {
    const entriesKey = `entries_${entryData.journal_id}`;
    const entriesStr = await AsyncStorage.getItem(entriesKey);
    const entries = entriesStr ? JSON.parse(entriesStr) : [];
    const updatedEntries = entries.map(entry => {
      if (entry.entry_id === entryId) {
        const updatedEntry = {
          ...entry,
          ...entryData,
          updated_at: new Date().toISOString(),
        };
        if (entryData.entry_images && entryData.entry_images.length > 0) {
          updatedEntry.pending_images = [
            ...(entry.pending_images || []),
            ...entryData.entry_images,
          ];
          updatedEntry.entry_images = entry.entry_images || [];
        }
        return updatedEntry;
      }
      return entry;
    });
    await AsyncStorage.setItem(entriesKey, JSON.stringify(updatedEntries));
    await addPendingOperation('Entry', 'update', {
      ...entryData,
      entry_id: entryId,
    });
    return { entry_id: entryId, ...entryData };
  } catch (error) {
    console.error('Error updating entry offline:', error);
    throw new Error(`Offline error updating entry: ${error.message}`);
  }
};

const offlineDeleteEntry = async (entryId, journalId) => {
  try {
    if (!journalId) {
      const allJournalsStr = await AsyncStorage.getItem('journals');
      const allJournals = allJournalsStr ? JSON.parse(allJournalsStr) : [];
      for (const journal of allJournals) {
        const entriesKey = `entries_${journal.journal_id}`;
        const entriesStr = await AsyncStorage.getItem(entriesKey);
        const entries = entriesStr ? JSON.parse(entriesStr) : [];
        const foundEntry = entries.find(entry => entry.entry_id === entryId);
        if (foundEntry) {
          journalId = journal.journal_id;
          break;
        }
      }
      if (!journalId) {
        throw new Error('Could not find journal for entry');
      }
    }
    const entriesKey = `entries_${journalId}`;
    const entriesStr = await AsyncStorage.getItem(entriesKey);
    const entries = entriesStr ? JSON.parse(entriesStr) : [];
    const entryToDelete = entries.find(entry => entry.entry_id === entryId);
    const updatedEntries = entries.filter(entry => entry.entry_id !== entryId);
    await AsyncStorage.setItem(entriesKey, JSON.stringify(updatedEntries));
    if (entryToDelete) {
      await addPendingOperation('Entry', 'delete', {
        entry_id: entryId,
        journal_id: journalId,
      });
    }
    return { success: true };
  } catch (error) {
    console.error('Error deleting entry offline:', error);
    throw new Error(`Offline error deleting entry: ${error.message}`);
  }
};

// Form Data creation for Entry
const createEntryFormData = (entryData) => {
  const formData = new FormData();
  formData.append('journal_id', entryData.journal_id);
  formData.append('entry_description', entryData.entry_description);
  formData.append('entry_datetime', entryData.entry_datetime);
  if (entryData.entry_location) {
    formData.append('entry_location', JSON.stringify(entryData.entry_location));
  }
  if (entryData.entry_location_name) {
    formData.append('entry_location_name', entryData.entry_location_name);
  }
  if (entryData.location_id) {
    formData.append('location_id', entryData.location_id);
  }
  if (entryData.display_images_in_recommendation !== undefined) {
    formData.append('display_images_in_recommendation', entryData.display_images_in_recommendation);
  }
  if (entryData.entry_images && entryData.entry_images.length > 0) {
    const localImages = entryData.entry_images.filter(img =>
      img.startsWith('file://') || (img.startsWith('/') && !img.startsWith('/uploads/'))
    );
    for (let i = 0; i < localImages.length; i++) {
      const image = localImages[i];
      const filename = image.split('/').pop();
      const fileExtension = filename.split('.').pop().toLowerCase();
      const mimeType = fileExtension === 'png' ? 'image/png' : 'image/jpeg';
      formData.append('entry_images', {
        uri: image,
        type: mimeType,
        name: filename || `image_${i}.${fileExtension || 'jpg'}`,
      });
    }
    const existingImages = entryData.entry_images.filter(img =>
      img.startsWith(`${API_URL}/uploads/`) ||
      img.startsWith('/uploads/')
    );
    if (existingImages.length > 0) {
      formData.append('existing_images', JSON.stringify(existingImages));
    }
  }
  return formData;
};

// Online Journal Functions
export const createJournal = async (title, date) => {
  try {
    const response = await api.post(
      '/journals',
      {
        journal_title: title,
        journal_date: date,
      }
    );
    return response.data;
  } catch (error) {
    // If there is no server response, assume offline
    if (!error.response) {
      console.log('Offline mode detected: creating journal offline');
      return await offlineCreateJournal(title, date);
    }
    console.error("Error saving journal:", error.response?.data || error.message);
    throw new Error(`Error creating journal: ${error.response?.data?.message || error.message}`);
  }
};

export const fetchJournals = async () => {
  try {
    const response = await api.get('/journals');
    return response.data || [];
  } catch (error) {
    if (!error.response) {
      console.log('Offline mode detected: fetching journals offline');
      return await offlineFetchJournals();
    }
    console.error('Error in fetchJournals:', error);
    return [];
  }
};

export const updateJournal = async (journalId, title, date) => {
  try {
    const response = await api.put(`/journals/${journalId}`, {
      journal_title: title,
      journal_date: date,
    });
    return response.data;
  } catch (error) {
    if (!error.response) {
      console.log('Offline mode detected: updating journal offline');
      return await offlineUpdateJournal(journalId, title, date);
    }
    throw new Error(`Error updating journal: ${error.response?.data?.message || error.message}`);
  }
};

export const deleteJournal = async (journalId) => {
  try {
    const response = await api.delete(`/journals/${journalId}`);
    return response.data;
  } catch (error) {
    if (!error.response) {
      console.log('Offline mode detected: deleting journal offline');
      return await offlineDeleteJournal(journalId);
    }
    throw new Error(`Error deleting journal: ${error.response?.data?.message || error.message}`);
  }
};

// Online Entry Functions
export const createEntry = async (entryData) => {
  try {
    const formData = createEntryFormData(entryData);
    if (entryData.entry_images && entryData.entry_images.length > 0) {
      console.log(`Uploading ${entryData.entry_images.length} images`);
    }
    const response = await api.post('/entries', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json',
      },
      transformRequest: (data, headers) => {
        return data;
      },
      timeout: 60000,
      onUploadProgress: (progressEvent) => {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        console.log(`Upload progress: ${percentCompleted}%`);
      },
    });
    return response.data;
  } catch (error) {
    if (!error.response) {
      console.log('Offline mode detected: creating entry offline');
      return await offlineCreateEntry(entryData);
    }
    if (error.response) {
      console.error('Server error response:', error.response.status, error.response.data);
      if (error.response.status === 413) {
        throw new Error('Files are too large. Please use smaller images (under 20MB total).');
      } else {
        throw new Error(`Server error: ${error.response.data.message || error.message}`);
      }
    } else if (error.request) {
      console.error('No response received:', error.request);
      throw new Error('No response from server. Check your network connection.');
    } else {
      console.error('Error creating entry:', error.message);
      throw new Error(`Error creating entry: ${error.message}`);
    }
  }
};

export const fetchEntries = async (journalId) => {
  try {
    const response = await api.get(`/entries/${journalId}`);
    return response.data;
  } catch (error) {
    if (!error.response) {
      console.log('Offline mode detected: fetching entries offline');
      return await offlineFetchEntries(journalId);
    }
    console.error('🚨 Error fetching entries:', error);
    throw new Error(`Error fetching entries: ${error.message}`);
  }
};

export const updateEntry = async (entryId, entryData) => {
  try {
    const formData = createEntryFormData(entryData);
    const response = await api.put(`/entries/${entryId}`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
      transformRequest: (data, headers) => {
        return data;
      },
    });
    return response.data;
  } catch (error) {
    if (!error.response) {
      console.log('Offline mode detected: updating entry offline');
      return await offlineUpdateEntry(entryId, entryData);
    }
    console.error('Error updating entry:', error);
    throw new Error(`Error updating entry: ${error.message}`);
  }
};

export const deleteEntry = async (entryId) => {
  try {
    const response = await api.delete(`/entries/${entryId}`);
    return response.data;
  } catch (error) {
    if (!error.response) {
      console.log('Offline mode detected: deleting entry offline');
      return await offlineDeleteEntry(entryId);
    }
    throw new Error(`Error deleting entry: ${error.response?.data?.message || error.message}`);
  }
};

export const analyzeSentiment = async (entryDescription) => {
  try {
    const response = await api.post('/analyze-sentiment', {
      entry_description: entryDescription,
    });
    return response.data;
  } catch (error) {
    throw new Error(`Error analyzing sentiment: ${error.message}`);
  }
};

export const fetchRecommendations = async () => {
  try {
    const response = await api.get('/recommendations');
    return response.data;
  } catch (error) {
    console.error('Error fetching recommendations:', error);
    throw new Error(`Error fetching recommendations: ${error.message}`);
  }
};

export const fetchLocations = async () => {
  try {
    const response = await api.get('/locations');
    return response.data;
  } catch (error) {
    console.error('Error fetching locations:', error);
    throw new Error(`Error fetching locations: ${error.message}`);
  }
};

export const registerUser = async (name, email, password, securityAnswer) => {
  try {
    const response = await api.post('/auth/register', {
      name,
      email,
      password,
      securityAnswer,
    });
    if (response.data.token) {
      await AsyncStorage.setItem('userToken', response.data.token);
    }
    return response.data;
  } catch (error) {
    console.error("Error registering user:", error.response?.data || error.message);
    throw new Error(`Error registering user: ${error.response?.data?.message || error.message}`);
  }
};

export const loginUser = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password });
    console.log('Full API Response:', response.data);
    if (!response.data) {
      throw new Error('Invalid server response');
    }
    const { user_id, token } = response.data;
    if (!user_id || !token) {
      console.error('Incomplete response:', response.data);
      throw new Error('Missing user data in response');
    }
    await AsyncStorage.setItem('userToken', token);
    await AsyncStorage.setItem('userId', user_id.toString());
    return { userId: user_id, token };
  } catch (error) {
    console.error("Error logging in:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Login failed. Please try again.");
  }
};

export const logoutUser = async () => {
  try {
    await AsyncStorage.removeItem('userToken');
    return true;
  } catch (error) {
    console.error("Error logging out:", error.message);
    return false;
  }
};

export const getCurrentUser = async () => {
  try {
    const response = await api.get('/user/profile');
    return response.data;
  } catch (error) {
    console.error("Error fetching user profile:", error.response?.data || error.message);
    throw new Error(`Error fetching user profile: ${error.response?.data?.message || error.message}`);
  }
};

export const setAuthToken = async (token) => {
  if (token) {
    await AsyncStorage.setItem('userToken', token);
  } else {
    await AsyncStorage.removeItem('userToken');
  }
};

export const fetchUserHistory = async (month, year) => {
  try {
    const userId = await AsyncStorage.getItem('userId');
    if (!userId) {
      throw new Error('User ID not found in storage');
    }
    console.log('Sending request with userId:', userId);
    const response = await api.get('/user/history', {
      params: {
        userId: userId,
        month: month,
        year: year
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching user history:', error);
    throw error;
  }
};

export const uploadProfilePicture = async (formData) => {
  try {
    const token = await AsyncStorage.getItem('userToken');
    const response = await fetch(`${API_URL}/user/upload-profile-picture`, {
      method: 'POST',
      headers: {
        'Content-Type': 'multipart/form-data',
        Authorization: `Bearer ${token}`,
      },
      body: formData,
    });
    if (!response.ok) throw new Error(await response.text());
    return await response.json();
  } catch (error) {
    console.error('Upload profile picture error:', error);
    throw error;
  }
};

export const checkSecurityAnswer = async (email, securityAnswer) => {
  try {
    const response = await api.post('/auth/check-security-answer', {
      email,
      securityAnswer
    });
    return response.data;
  } catch (error) {
    console.error("Error checking security answer:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Verification failed. Please try again.");
  }
};

export const resetPassword = async (email, newPassword) => {
  try {
    const response = await api.post('/auth/reset-password', {
      email,
      newPassword
    });
    return response.data;
  } catch (error) {
    console.error("Error resetting password:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Password reset failed. Please try again.");
  }
};

export default {
  offlineCreateJournal,
  offlineFetchJournals,
  offlineUpdateJournal,
  offlineDeleteJournal,
  offlineCreateEntry,
  offlineFetchEntries,
  offlineUpdateEntry,
  offlineDeleteEntry,
  createJournal,
  fetchJournals,
  createEntry,
  fetchEntries,
  analyzeSentiment,
  updateJournal,
  deleteJournal,
  updateEntry,
  deleteEntry,
  fetchRecommendations,
  fetchLocations,
  registerUser,
  loginUser,
  logoutUser,
  getCurrentUser,
  setAuthToken,
  fetchUserHistory,
  uploadProfilePicture,
  checkSecurityAnswer,
  resetPassword,
};