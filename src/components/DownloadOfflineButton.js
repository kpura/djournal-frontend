// src/components/DownloadOfflineButton.js
import React, { useState, useEffect } from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, View } from 'react-native';
import apiService from '../services/api';

const DownloadOfflineButton = () => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [isOfflineReady, setIsOfflineReady] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    // Check if data has already been downloaded
    checkOfflineStatus();
  }, []);

  const checkOfflineStatus = async () => {
    try {
      // Get all journals to check if they're in storage
      const journals = await apiService.getJournals();
      const hasOfflineData = journals.length > 0 && await apiService.hasPendingSyncData() === false;
      setIsOfflineReady(hasOfflineData);
    } catch (error) {
      console.error('Error checking offline status:', error);
    }
  };

  const downloadAllData = async () => {
    try {
      setIsDownloading(true);
      setDownloadProgress(0);
      
      // 1. Get all journals
      const journals = await apiService.getJournals();
      setDownloadProgress(20);
      
      // 2. Get entries for each journal
      let completedJournals = 0;
      const totalJournals = journals.length;
      
      for (const journal of journals) {
        await apiService.getEntries(journal.journal_id);
        completedJournals++;
        setDownloadProgress(20 + (completedJournals / totalJournals) * 70);
      }
      
      // 3. Update status flags
      setIsOfflineReady(true);
      setDownloadProgress(100);
      
      // Small delay to show 100% progress before completion
      setTimeout(() => {
        setIsDownloading(false);
      }, 500);
    } catch (error) {
      console.error('Error downloading data:', error);
      setIsDownloading(false);
    }
  };

  return (
    <View style={styles.container}>
      {isDownloading ? (
        <View style={styles.progressContainer}>
          <ActivityIndicator size="small" color="#13547D" />
          <Text style={styles.progressText}>{`Downloading... ${Math.round(downloadProgress)}%`}</Text>
          <View style={styles.progressBarContainer}>
            <View style={[styles.progressBar, { width: `${downloadProgress}%` }]} />
          </View>
        </View>
      ) : (
        <TouchableOpacity 
          style={[styles.button, isOfflineReady && styles.readyButton]} 
          onPress={downloadAllData}
          disabled={isDownloading}
        >
          <Text style={styles.buttonText}>
            {isOfflineReady ? 'Refresh Offline Data' : 'Download for Offline Use'}
          </Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginVertical: 10,
    padding: 10,
  },
  button: {
    backgroundColor: '#13547D',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: 'center',
  },
  readyButton: {
    backgroundColor: '#0A8754',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  progressContainer: {
    alignItems: 'center',
    padding: 10,
  },
  progressText: {
    marginTop: 8,
    marginBottom: 4,
    fontSize: 14,
    color: '#555',
  },
  progressBarContainer: {
    height: 8,
    width: '100%',
    backgroundColor: '#E3E3E3',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#13547D',
  },
});

export default DownloadOfflineButton;