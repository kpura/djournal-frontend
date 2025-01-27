//AuthOptions.js
import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Image,
  Alert,
} from "react-native";
import {
  useFonts,
  Poppins_400Regular,
  Poppins_600SemiBold,
} from "@expo-google-fonts/poppins";
import { makeRedirectUri, useAuthRequest } from "expo-auth-session"; 
import axios from "axios";

const AuthOptions = ({ navigation }) => {
  const [fontsLoaded] = useFonts({
    Poppins_400Regular,
    Poppins_600SemiBold,
  });

  if (!fontsLoaded) {
    return null;
  }

  // Google Auth
  const googleAuth = async () => {
    const redirectUrl = makeRedirectUri({ useProxy: true });
    const authUrl = `http://localhost:3000/auth/google?redirect_uri=${redirectUrl}`;
    
    try {
      const response = await axios.get(authUrl);
      if (response.status === 200) {
        navigation.navigate("Main");
      } else {
        Alert.alert("Authentication failed", "Google Authentication failed.");
      }
    } catch (error) {
      Alert.alert("Authentication failed", error.message);
    }
  };

  // Facebook Auth
  const facebookAuth = async () => {
    const redirectUrl = makeRedirectUri({ useProxy: true });
    const authUrl = `https://localhost:3000/auth/facebook?redirect_uri=${redirectUrl}`;
    
    try {
      const response = await axios.get(authUrl);
      if (response.status === 200) {
        navigation.navigate("Main");
      } else {
        Alert.alert("Authentication failed", "Facebook Authentication failed.");
      }
    } catch (error) {
      Alert.alert("Authentication failed", error.message);
    }
  };

  const guestSignIn = () => {
    navigation.navigate("Main", { guest: true });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Let’s sign you in.</Text>
      <Text style={styles.paragraph}>You can sign in using your Google or Facebook account.</Text>

      <Image source={require("../../assets/login.png")} style={styles.logo} />

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={googleAuth}>
          <View style={styles.iconContainer}>
            <Image source={require("../../assets/google-logo.png")} style={styles.logoIcon} />
          </View>
          <Text style={styles.buttonText}>Sign in with Google</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button2} onPress={facebookAuth}>
          <View style={styles.iconContainer}>
            <Image source={require("../../assets/fb-logo.png")} style={styles.logoIcon} />
          </View>
          <Text style={styles.buttonText2}>Sign in with Facebook</Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.mainButton} onPress={guestSignIn}>
        <Text style={styles.mainButtonText}>Continue as Guest</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#fff",
    padding: 20,
  },
  mainButtonText: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#ddd",
  },
  title: {
    fontSize: 28,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
    marginRight: 160,
    marginTop: 50,
  },
  paragraph: {
    fontSize: 12,
    fontFamily: "Poppins_400Regular",
    color: "#333",
    marginBottom: 40,
    marginRight: 60,
  },
  logo: {
    width: 350,
    height: 350,
    resizeMode: "cover",
    borderRadius: 14,
    marginBottom: 50,
  },
  buttonContainer: {
    width: "100%",
    alignItems: "center",
  },
  button: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#525fe1",
    paddingVertical: 7,
    borderRadius: 14,
    marginBottom: 10,
    width: "95%",
    position: "relative",
    marginTop: 80,
  },
  button2: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    paddingVertical: 7,
    borderRadius: 14,
    marginBottom: 20,
    width: "95%",
    position: "relative",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  iconContainer: {
    backgroundColor: "#fff",
    padding: 5,
    borderRadius: 15,
    marginLeft: 10,
  },
  logoIcon: {
    width: 30,
    height: 30,
  },
  buttonText: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#fff",
    flex: 1,
    textAlign: "center",
  },
  buttonText2: {
    fontSize: 14,
    fontFamily: "Poppins_600SemiBold",
    color: "#525fe1",
    flex: 1,
    textAlign: "center",
  },
  profile: {
    marginTop: 20,
    alignItems: "center",
  },
  profileImage: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  profileName: {
    fontSize: 16,
    fontFamily: "Poppins_600SemiBold",
    color: "#333",
    marginTop: 10,
  },
});

export default AuthOptions;
