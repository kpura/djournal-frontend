import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, StyleSheet, ActivityIndicator, Modal 
} from 'react-native';
import { loginUser } from '../api';
import { useFocusEffect } from '@react-navigation/native';
import { useFonts, Poppins_400Regular, Poppins_600SemiBold } from '@expo-google-fonts/poppins';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Ionicons } from '@expo/vector-icons';

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [alertVisible, setAlertVisible] = useState(false);
  const [alertMessage, setAlertMessage] = useState('');

  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

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

  const handleLogin = async () => {
    if (!email || !password) {
      showAlert('Please fill in all fields');
      return;
    }

    try {
      setLoading(true);
      const userData = await loginUser(email, password);

      console.log('Login Response:', userData);

      if (!userData || !userData.userId) {
        throw new Error('Invalid login response');
      }

      await AsyncStorage.setItem('userId', userData.userId.toString());

      setLoading(false);
      navigation.navigate('Main');
    } catch (error) {
      setLoading(false);
      showAlert('Login Failed: ' + error.message);
    }
  };

  if (!fontsLoaded) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#4361ee" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Welcome Back</Text>
      <Text style={styles.subtitle}>Login to continue</Text>

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
          <TouchableOpacity onPress={() => navigation.navigate('Register')}>
            <Text style={styles.registerLink}>Register</Text>
          </TouchableOpacity>
        </View>
      </View>

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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    backgroundColor: '#f8f9fa',
    fontFamily: 'Poppins_400Regular',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontFamily: 'Poppins_600SemiBold',
    fontSize: 32,
    marginTop: 30,
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
});

export default LoginScreen;
