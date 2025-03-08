//index.js
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

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

  if (entryData.entry_images) {
    entryData.entry_images.forEach((image, index) => {
      if (image.startsWith('file://') || image.startsWith('/')) {
        const filename = image.split('/').pop();
        formData.append('entry_images', {
          uri: image,
          type: 'image/jpeg',
          name: filename || `image_${index}.jpg`,
        });
      }
    });

    // Handle existing images
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

// Create a new journal
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
    console.error("Error saving journal:", error.response?.data || error.message);
    throw new Error(`Error creating journal: ${error.response?.data?.message || error.message}`);
  }
};

// Fetch all journals
export const fetchJournals = async () => {
  try {
    const response = await api.get('/journals');
    return response.data || []; // Return empty array if no data
  } catch (error) {
    console.error('Error in fetchJournals:', error);
    return []; // Return empty array on error instead of throwing
  }
};

// Create a new entry
export const createEntry = async (entryData) => {
  try {
    const formData = createEntryFormData(entryData);
    
    const response = await api.post('/entries', formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
        'Accept': 'application/json',
      },
      transformRequest: (data, headers) => {
        return data; // Don't transform the data
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error creating entry:', error);
    throw new Error(`Error creating entry: ${error.message}`);
  }
};

// Fetch entries
export const fetchEntries = async (journalId) => {
  try {
    const response = await api.get(`/entries/${journalId}`);
    return response.data;
  } catch (error) {
    console.error('🚨 Error fetching entries:', error);
    throw new Error(`Error fetching entries: ${error.message}`);
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

// Update a journal
export const updateJournal = async (journalId, title, date) => {
  try {
    const response = await api.put(`/journals/${journalId}`,
      {
        journal_title: title,
        journal_date: date,
      });
    return response.data;
  } catch (error) {
    throw new Error(`Error updating journal: ${error.message}`);
  }
};

// Delete a journal
export const deleteJournal = async (journalId) => {
  try {
    const response = await api.delete(`/journals/${journalId}`);
    return response.data;
  } catch (error) {
    throw new Error(`Error deleting journal: ${error.message}`);
  }
};

// Update an entry
export const updateEntry = async (entryId, entryData) => {
  try {
    const formData = createEntryFormData(entryData);
    
    const response = await api.put(`/entries/${entryId}`, formData, {
      headers: { 
        'Content-Type': 'multipart/form-data',
      },
      transformRequest: (data, headers) => {
        return data; // Don't transform the data
      },
    });
    
    return response.data;
  } catch (error) {
    console.error('Error updating entry:', error);
    throw new Error(`Error updating entry: ${error.message}`);
  }
};

// Delete an entry
export const deleteEntry = async (entryId) => {
  try {
    const response = await api.delete(`/entries/${entryId}`);
    return response.data;
  } catch (error) {
    throw new Error(`Error deleting entry: ${error.message}`);
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

export const registerUser = async (name, email, password) => {
  try {
    const response = await api.post(
      '/auth/register',
      {
        name,
        email,
        password,
      }
    );
    
    // Store token if available
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

    console.log('Full API Response:', response.data); // Debugging API response

    if (!response.data) {
      throw new Error('Invalid server response');
    }

    // Fix naming mismatch (API returns `user_id`, not `userId`)
    const { user_id, token } = response.data;

    if (!user_id || !token) {
      console.error('Incomplete response:', response.data);
      throw new Error('Missing user data in response');
    }

    // Store token securely
    await AsyncStorage.setItem('userToken', token);
    await AsyncStorage.setItem('userId', user_id.toString()); // Updated to `user_id`

    return { userId: user_id, token }; // Return correctly formatted object
  } catch (error) {
    console.error("Error logging in:", error.response?.data || error.message);
    throw new Error(error.response?.data?.message || "Login failed. Please try again.");
  }
};

// Logout a user
export const logoutUser = async () => {
  try {
    // Remove token from AsyncStorage
    await AsyncStorage.removeItem('userToken');
    return true;
  } catch (error) {
    console.error("Error logging out:", error.message);
    return false;
  }
};

// Get current user profile
export const getCurrentUser = async () => {
  try {
    const response = await api.get('/user/profile');
    return response.data;
  } catch (error) {
    console.error("Error fetching user profile:", error.response?.data || error.message);
    throw new Error(`Error fetching user profile: ${error.response?.data?.message || error.message}`);
  }
};

// Helper function to set auth token for all requests
export const setAuthToken = async (token) => {
  if (token) {
    await AsyncStorage.setItem('userToken', token);
  } else {
    await AsyncStorage.removeItem('userToken');
  }
};

export const fetchUserHistory = async (month, year) => {
  try {
    // Get userId from AsyncStorage
    const userId = await AsyncStorage.getItem('userId');
    
    // Check if userId exists
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

// Add this function export
export const associateEntryImagesWithLocation = async (entryId) => {
  try {
    const response = await api.post('/entries/associate-images', { entryId });
    return response.data;
  } catch (error) {
    console.error('Error associating images with location:', error);
    throw new Error(`Error associating images with location: ${error.message}`);
  }
};

export default {
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
  associateEntryImagesWithLocation, // Add this line
};