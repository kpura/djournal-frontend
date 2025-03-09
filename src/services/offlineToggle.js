import React, { useState } from 'react';
import { View, Button, Alert } from 'react-native';
import offlineManager from '../offlineManager';

const OfflineToggle = () => {
  const [forceOffline, setForceOffline] = useState(false);
  
  const toggleOffline = () => {
    const newStatus = !forceOffline;
    setForceOffline(newStatus);
    offlineManager.isOnline = !newStatus;
    Alert.alert('Status changed', `App is now ${newStatus ? 'OFFLINE' : 'ONLINE'}`);
  };
  
  return (
    <View style={{padding: 10}}>
      <Button 
        title={forceOffline ? "Simulating Offline (Tap to go online)" : "Simulating Online (Tap to go offline)"}
        onPress={toggleOffline}
      />
    </View>
  );
};

export default OfflineToggle;