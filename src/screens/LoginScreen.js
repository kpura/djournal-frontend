import React, { useState, useEffect } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Modal,
  SafeAreaView, StatusBar, Alert
} from 'react-native';
import { loginUser, checkSecurityAnswer, resetPassword } from '../api';
import { useFocusEffect } from '@react-navigation/native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';
import NetInfo from '@react-native-community/netinfo';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');
  const [forgotPasswordModal, setForgotPasswordModal] = useState(false);
  const [forgotPasswordEmail, setForgotPasswordEmail] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [resetStep, setResetStep] = useState(1); // 1: email, 2: security question, 3: new password
  const [newPassword, setNewPassword] = useState('');
  const [confirmNewPassword, setConfirmNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmNewPassword, setShowConfirmNewPassword] = useState(false);
  const [isConnected, setIsConnected] = useState(true);

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  // Check network connection status
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);

  useFocusEffect(
    React.useCallback(() => {
      setEmail('');
      setPassword('');
      setLoading(false);
      return () => {};
    }, [])
  );

  const showAlert = (message) => {
    setAlertMessage(message);
    setAlertVisible(true);
  };

  // Store user credentials securely
  const storeCredentials = async (userEmail, userPassword, userId) => {
    try {
      // Store credentials for offline login
      await AsyncStorage.setItem('userCredentials', JSON.stringify({
        email: userEmail,
        password: userPassword,
        userId: userId
      }));
    } catch (error) {
      console.error('Error storing credentials:', error);
    }
  };

  // Verify credentials against locally stored ones
  const verifyOfflineCredentials = async (userEmail, userPassword) => {
    try {
      const storedCredentialsJson = await AsyncStorage.getItem('userCredentials');
      if (storedCredentialsJson) {
        const storedCredentials = JSON.parse(storedCredentialsJson);
        if (storedCredentials.email === userEmail && storedCredentials.password === userPassword) {
          return { success: true, userId: storedCredentials.userId };
        }
      }
      return { success: false };
    } catch (error) {
      console.error('Error verifying offline credentials:', error);
      return { success: false };
    }
  };

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      
      if (isConnected) {
        // Online login
        const userData = await loginUser(email, password);

        console.log('Login Response:', userData);

        if (!userData || !userData.userId) {
          throw new Error('Invalid login response');
        }

        // Store credentials for offline login
        await storeCredentials(email, password, userData.userId.toString());
        await AsyncStorage.setItem('userId', userData.userId.toString());

        await AsyncStorage.setItem('userToken', userData.token || 'default-token-' + userData.userId);
        
        setLoading(false);
        navigation.navigate('Main');
      } else {
        // Offline login
        console.log('Attempting offline login...');
        const offlineAuth = await verifyOfflineCredentials(email, password);
        
        if (offlineAuth.success) {
          await AsyncStorage.setItem('userId', offlineAuth.userId);
          setLoading(false);
          navigation.navigate('Main');
        } else {
          throw new Error('Invalid credentials or no stored offline data');
        }
      }
    } catch (error) {
      setLoading(false);
      showAlert(`Login Failed: ${error.message}${!isConnected ? ' (Offline Mode)' : ''}`);
    }
  };

  const handleForgotPassword = () => {
    if (!isConnected) {
      showAlert('Cannot reset password in offline mode. Please connect to the internet and try again.');
      return;
    }
    
    setForgotPasswordEmail('');
    setSecurityAnswer('');
    setNewPassword('');
    setConfirmNewPassword('');
    setResetStep(1);
    setForgotPasswordModal(true);
  };

  const handleSubmitEmail = async () => {
    if (!forgotPasswordEmail) {
      showAlert('Please enter your email');
      return;
    }

    try {
      setLoading(true);
      setLoading(false);
      setResetStep(2);
    } catch (error) {
      setLoading(false);
      showAlert('Error: ' + error.message);
    }
  };

  const handleSubmitSecurityAnswer = async () => {
    if (!securityAnswer) {
      showAlert('Please enter your answer');
      return;
    }

    try {
      setLoading(true);
      // Check if security answer is correct
      const result = await checkSecurityAnswer(forgotPasswordEmail, securityAnswer);
      
      if (result.success) {
        setLoading(false);
        setResetStep(3);
      } else {
        throw new Error('Incorrect security answer');
      }
    } catch (error) {
      setLoading(false);
      showAlert('Error: ' + error.message);
    }
  };

  const handleSubmitNewPassword = async () => {
    if (!newPassword || !confirmNewPassword) {
      showAlert('Please fill in all fields');
      return;
    }

    if (newPassword.length < 8) {
      showAlert('Password must be at least 8 characters long');
      return;
    }

    if (newPassword !== confirmNewPassword) {
      showAlert('Passwords do not match');
      return;
    }

    try {
      setLoading(true);
      // Reset the password
      const result = await resetPassword(forgotPasswordEmail, newPassword);
      
      if (result.success) {
        // Update stored credentials with new password
        const userId = await AsyncStorage.getItem('userId');
        if (userId && forgotPasswordEmail === email) {
          await storeCredentials(forgotPasswordEmail, newPassword, userId);
        }
        
        setLoading(false);
        setForgotPasswordModal(false);
        showAlert('Password reset successfully. Please login with your new password.');
      } else {
        throw new Error('Failed to reset password');
      }
    } catch (error) {
      setLoading(false);
      showAlert('Error: ' + error.message);
    }
  };

  const cancelReset = () => {
    setForgotPasswordModal(false);
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4361ee" />
      </View>
    );
  }

  const renderForgotPasswordContent = () => {
    switch (resetStep) {
      case 1:
        return (
          <>
            <Text style={styles.modalTitle}>Forgot Password</Text>
            <Text style={styles.modalSubtitle}>Enter your email to reset your password</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Email"
              value={forgotPasswordEmail}
              onChangeText={setForgotPasswordEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.modalButtonCancel} onPress={cancelReset}>
                <Text style={styles.modalButtonCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalButtonPrimary} 
                onPress={handleSubmitEmail}
                disabled={loading}
              >
                <Text style={styles.modalButtonPrimaryText}>Next</Text>
              </TouchableOpacity>
            </View>
          </>
        );
      case 2:
        return (
          <>
            <Text style={styles.modalTitle}>Security Question</Text>
            <Text style={styles.modalSubtitle}>What is your dream travel destination?</Text>
            <TextInput
              style={styles.modalInput}
              placeholder="Your answer"
              value={securityAnswer}
              onChangeText={setSecurityAnswer}
            />
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.modalButtonCancel} onPress={() => setResetStep(1)}>
                <Text style={styles.modalButtonCancelText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalButtonPrimary} 
                onPress={handleSubmitSecurityAnswer}
                disabled={loading}
              >
                <Text style={styles.modalButtonPrimaryText}>Verify</Text>
              </TouchableOpacity>
            </View>
          </>
        );
      case 3:
        return (
          <>
            <Text style={styles.modalTitle}>Create New Password</Text>
            <Text style={styles.modalSubtitle}>Enter a new password</Text>
            
            <View style={styles.modalPasswordContainer}>
              <TextInput
                style={styles.modalPasswordInput}
                placeholder="New password"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry={!showNewPassword}
              />
              <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
                <Ionicons
                  name={showNewPassword ? 'eye' : 'eye-off'}
                  size={24}
                  color="#6c757d"
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalPasswordContainer}>
              <TextInput
                style={styles.modalPasswordInput}
                placeholder="Confirm new password"
                value={confirmNewPassword}
                onChangeText={setConfirmNewPassword}
                secureTextEntry={!showConfirmNewPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmNewPassword(!showConfirmNewPassword)}>
                <Ionicons
                  name={showConfirmNewPassword ? 'eye' : 'eye-off'}
                  size={24}
                  color="#6c757d"
                />
              </TouchableOpacity>
            </View>
            
            <View style={styles.modalButtonContainer}>
              <TouchableOpacity style={styles.modalButtonCancel} onPress={() => setResetStep(2)}>
                <Text style={styles.modalButtonCancelText}>Back</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={styles.modalButtonPrimary} 
                onPress={handleSubmitNewPassword}
                disabled={loading}
              >
                <Text style={styles.modalButtonPrimaryText}>Reset Password</Text>
              </TouchableOpacity>
            </View>
          </>
        );
      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar translucent backgroundColor="transparent" barStyle="dark-content" />
      <View style={styles.container}>
        <Text style={styles.title}>Welcome Back</Text>
        <Text style={styles.subtitle}>Login to continue</Text>
        
        {!isConnected && (
          <View style={styles.offlineBanner}>
            <Ionicons name="cloud-offline-outline" size={20} color="#fff" />
            <Text style={styles.offlineText}>Offline Mode</Text>
          </View>
        )}

        <View style={styles.form}>
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
                placeholder="Enter your password"
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Ionicons
                  name={showPassword ? 'eye' : 'eye-off'}
                  size={24}
                  color="#6c757d"
                />
              </TouchableOpacity>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.forgotPasswordButton} 
            onPress={handleForgotPassword}
          >
            <Text style={styles.forgotPasswordText}>Forgot Password?</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.buttonText}>
              {loading ? 'Logging in...' : 'Login'}
            </Text>
          </TouchableOpacity>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Don't have an account? </Text>
            <TouchableOpacity onPress={() => navigation.navigate('Register')} disabled={!isConnected}>
              <Text style={[styles.registerLink, !isConnected && styles.disabledLink]}>Register</Text>
            </TouchableOpacity>
          </View>
          
          {!isConnected && (
            <Text style={styles.offlineNote}>
              Note: Registration requires an internet connection
            </Text>
          )}
        </View>

        {/* Alert Modal */}
        <Modal
          visible={alertVisible}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setAlertVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.alertBox}>
              <Text style={styles.alertTitle}>Oops!</Text>
              <Text style={styles.alertMessage}>{alertMessage}</Text>
              <TouchableOpacity
                style={styles.alertButton}
                onPress={() => setAlertVisible(false)}
              >
                <Text style={styles.alertButtonText}>OK</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>

        {/* Forgot Password Modal */}
        <Modal
          visible={forgotPasswordModal}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setForgotPasswordModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.forgotPasswordBox}>
              {renderForgotPasswordContent()}
            </View>
          </View>
        </Modal>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f8f9fa',
    paddingTop: StatusBar.currentHeight || 0,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 32,
    marginTop: 10,
    color: '#13547D',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    color: '#6c757d',
    marginBottom: 40,
    letterSpacing: 0.3,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 24,
  },
  label: {
    fontFamily: 'Poppins_400Regular',
    fontSize: 16,
    marginBottom: 8,
    color: '#495057',
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
  forgotPasswordButton: {
    alignSelf: 'flex-end',
    marginBottom: 20,
  },
  forgotPasswordText: {
    fontFamily: 'Poppins_400Regular',
    color: '#13547D',
    fontSize: 15,
  },
  button: {
    backgroundColor: '#13547D',
    borderRadius: 12,
    padding: 18,
    alignItems: 'center',
    marginTop: 16,
    elevation: 4,
  },
  buttonText: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
    fontSize: 18,
  },
  registerContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 30,
  },
  registerText: {
    fontFamily: 'Poppins_400Regular',
    color: '#6c757d',
    fontSize: 16,
  },
  registerLink: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#13547D',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  alertBox: {
    width: 300,
    padding: 20,
    backgroundColor: 'white',
    borderRadius: 12,
    alignItems: 'center',
  },
  alertTitle: {
    fontSize: 20,
    fontFamily: 'Poppins_600SemiBold',
    color: '#13547D',
  },
  alertMessage: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#6c757d',
    marginVertical: 10,
    textAlign: 'center',
  },
  alertButton: {
    backgroundColor: '#13547D',
    borderRadius: 8,
    padding: 10,
    width: '80%',
    alignItems: 'center',
    marginTop: 10,
  },
  alertButtonText: {
    fontSize: 16,
    color: 'white',
    fontFamily: 'Poppins_600SemiBold',
  },
  forgotPasswordBox: {
    width: '85%',
    padding: 24,
    backgroundColor: 'white',
    borderRadius: 12,
    alignItems: 'center',
    elevation: 5,
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Poppins_600SemiBold',
    color: '#13547D',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 16,
    fontFamily: 'Poppins_400Regular',
    color: '#6c757d',
    marginBottom: 24,
    textAlign: 'center',
  },
  modalInput: {
    fontFamily: 'Poppins_400Regular',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
    width: '100%',
    marginBottom: 16,
  },
  modalPasswordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    marginBottom: 16,
    width: '100%',
  },
  modalPasswordInput: {
    flex: 1,
    fontFamily: 'Poppins_400Regular',
    paddingVertical: 16,
    fontSize: 16,
  },
  modalButtonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: 16,
  },
  modalButtonPrimary: {
    backgroundColor: '#13547D',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginLeft: 8,
  },
  modalButtonPrimaryText: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
    fontSize: 14,
  },
  modalButtonCancel: {
    backgroundColor: '#f8f9fa',
    borderWidth: 1,
    borderColor: '#ced4da',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  modalButtonCancelText: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#6c757d',
    fontSize: 16,
  },
  disabledLink: {
    color: '#a0a0a0',
  },
  offlineBanner: {
    backgroundColor: '#f39c12',
    padding: 10,
    borderRadius: 8,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  offlineText: {
    fontFamily: 'Poppins_600SemiBold',
    color: '#ffffff',
    marginLeft: 8,
    fontSize: 14,
  },
  offlineNote: {
    fontFamily: 'Poppins_400Regular',
    color: '#6c757d',
    fontSize: 12,
    textAlign: 'center',
    marginTop: 8,
  },
});

export default LoginScreen;