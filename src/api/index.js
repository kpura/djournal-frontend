import axios from 'axios';

const API_URL = 'http://192.168.137.221:3000/api';

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

  if (entryData.entry_image === null) {
    formData.append('clear_image', 'true');
  } else if (entryData.entry_image) {
    if (entryData.entry_image.startsWith('file://') || entryData.entry_image.startsWith('/')) {
      const imageFile = {
        uri: entryData.entry_image,
        type: 'image/jpeg',
        name: 'entry_image.jpg',
      };
      formData.append('entry_image', imageFile);
    } else if (entryData.entry_image.startsWith('http://192.168.137.221:3000/uploads/')) {
      formData.append('existing_image', entryData.entry_image.replace('http://192.168.137.221:3000', ''));
    } else {
      formData.append('existing_image', entryData.entry_image);
    }
  }

  return formData;
};

// Create a new journal
export const createJournal = async (title, date) => {
  try {
    const response = await axios.post(`${API_URL}/journals`, {
      journal_title: title,
      journal_date: date,
    });
    return response.data;
  } catch (error) {
    throw new Error(`Error creating journal: ${error.message}`);
  }
};

// Fetch all journals
export const fetchJournals = async () => {
  try {
    const response = await axios.get(`${API_URL}/journals`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching journals: ${error.message}`);
  }
};

// Create a new entry
export const createEntry = async (entryData) => {
  try {
    const formData = createEntryFormData(entryData);

    const response = await axios.post(`${API_URL}/entries`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    throw new Error(`Error creating entry: ${error.message}`);
  }
};

// Fetch all entries for a specific journal
export const fetchEntries = async (journalId) => {
  try {
    const response = await axios.get(`${API_URL}/entries/${journalId}`);
    return response.data;
  } catch (error) {
    throw new Error(`Error fetching entries: ${error.message}`);
  }
};

export const analyzeSentiment = async (entryDescription) => {
  try {
    const response = await axios.post(`${API_URL}/analyze-sentiment`, {
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
    const response = await axios.put(`${API_URL}/journals/${journalId}`, {
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
    const response = await axios.delete(`${API_URL}/journals/${journalId}`);
    return response.data;
  } catch (error) {
    throw new Error(`Error deleting journal: ${error.message}`);
  }
};

// Update an entry
export const updateEntry = async (entryId, data) => {
  try {
    const formData = createEntryFormData(data);

    const response = await axios.put(`${API_URL}/entries/${entryId}`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return response.data;
  } catch (error) {
    throw new Error(`Error updating entry: ${error.message}`);
  }
};

// Delete an entry
export const deleteEntry = async (entryId) => {
  try {
    const response = await axios.delete(`${API_URL}/entries/${entryId}`);
    return response.data;
  } catch (error) {
    throw new Error(`Error deleting entry: ${error.message}`);
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
};
