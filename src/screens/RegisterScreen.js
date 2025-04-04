import React, { useState, useEffect, useCallback } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, 
  Modal, ScrollView, KeyboardAvoidingView, Platform, StatusBar, SafeAreaView
} from 'react-native';
import { registerUser } from '../api';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

const RegisterScreen = ({ navigation }) => {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  useFocusEffect(
    useCallback(() => {
      setName('');
      setEmail('');
      setPassword('');
      setConfirmPassword('');
      setSecurityAnswer('');
      setShowPassword(false);
      setShowConfirmPassword(false);
    }, [])
  );

  const showAlert = (message) => {
    setAlertMessage(message);
    setAlertVisible(true);
    
    // Auto-dismiss the modal after 2 seconds
    setTimeout(() => {
      setAlertVisible(false);
    }, 2000);
  };

  const handleRegister = async () => {
    if (!name || !email || !password || !confirmPassword || !securityAnswer) {
      showAlert('Please fill in all fields');
      return;
    }
  
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      showAlert('Please enter a valid email address');
      return;
    }
  
    if (password.length < 8) {
      showAlert('Password must be at least 8 characters long');
      return;
    }
  
    if (password !== confirmPassword) {
      showAlert('Passwords do not match');
      return;
    }
  
    try {
      setLoading(true);
      const userData = await registerUser(name, email, password, securityAnswer);
  
      if (!userData || !userData.user_id) {
        throw new Error('Invalid registration response');
      }
  
      if (userData.user_id) {
        await AsyncStorage.setItem('userId', userData.user_id.toString());
      }
      
      setLoading(false);
      showAlert('Account created successfully!');
      setTimeout(() => navigation.navigate('Login'), 2000);
    } catch (error) {
      setLoading(false);
      showAlert(error.message || 'Something went wrong');
    }
  };  

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#4361ee" />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar backgroundColor="#f8f9fa" barStyle="dark-content" />
      <KeyboardAvoidingView 
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardAvoidingView}
      >
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.scrollContentContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.container}>
            <Text style={styles.title}>Create Account</Text>
            <Text style={styles.subtitle}>Sign up to get started</Text>

            <View style={styles.form}>
              <View style={styles.inputContainer}>
                <Text style={styles.label}>Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your name"
                  value={name}
                  onChangeText={setName}
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Email</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Enter your email"
                  value={email}
                  onChangeText={setEmail}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Create a password"
                    value={password}
                    onChangeText={setPassword}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? 'eye' : 'eye-off'} size={24} color="#6c757d" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.label}>Confirm Password</Text>
                <View style={styles.passwordContainer}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChangeText={setConfirmPassword}
                    secureTextEntry={!showConfirmPassword}
                  />
                  <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                    <Ionicons name={showConfirmPassword ? 'eye' : 'eye-off'} size={24} color="#6c757d" />
                  </TouchableOpacity>
                </View>
              </View>

              <View style={styles.inputContainer}>
                <Text style={styles.securityQuestion}>What is your dream travel destination?</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Your answer"
                  value={securityAnswer}
                  onChangeText={setSecurityAnswer}
                />
              </View>

              <TouchableOpacity 
                style={[styles.button, loading ? styles.buttonDisabled : null]} 
                onPress={handleRegister} 
                disabled={loading}
              >
                {loading ? (
                  <ActivityIndicator size="small" color="#ffffff" />
                ) : (
                  <Text style={styles.buttonText}>Register</Text>
                )}
              </TouchableOpacity>

              <View style={styles.loginContainer}>
                <Text style={styles.loginText}>Already have an account? </Text>
                <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                  <Text style={styles.loginLink}>Login</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Modal transparent={true} visible={alertVisible} animationType="fade">
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Ionicons 
              name={alertMessage.includes('success') ? 'checkmark-circle' : 'close-circle'} 
              size={40} 
              color={alertMessage.includes('success') ? '#28a745' : '#dc3545'} 
              style={styles.modalIcon} 
            />
            <Text style={styles.modalText}>{alertMessage}</Text>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContentContainer: {
    flexGrow: 1,
    paddingBottom: 30,
  },
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f8f9fa',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 32,
    marginTop: 10, // Reduced from 30 to fix spacing in APK
    color: '#13547D',
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 30, // Reduced from 40 to make more compact in APK
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20, // Reduced from 24 to make more compact in APK
  },
  label: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    marginBottom: 8,
    color: '#495057',
  },
  securityQuestion: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 16,
    marginBottom: 8,
    color: '#13547D',
  },
  input: {
    fontFamily: 'Poppins_400Regular',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
    elevation: 2,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    elevation: 2,
  },
  passwordInput: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    paddingVertical: 16,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#13547D',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 16,
    shadowColor: '#4361ee',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonDisabled: {
    backgroundColor: '#88a9be',
  },
  buttonText: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
    fontSize: 18,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e9ecef',
  },
  loginText: {
    fontFamily: 'Poppins_400Regular',
    color: '#6c757d',
    fontSize: 16,
  },
  loginLink: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#13547D',
    fontSize: 16,
  },
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    padding: 24,
    borderRadius: 12,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  modalText: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    textAlign: 'center',
    color: '#495057',
  },
  modalIcon: {
    marginBottom: 10,
  },  
});

export default RegisterScreen;