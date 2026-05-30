import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TextInput, 
  TouchableOpacity, 
  Animated, 
  KeyboardAvoidingView, 
  Platform,
  TouchableWithoutFeedback,
  Keyboard,
  Dimensions,
  ScrollView
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

export default function LoginScreen({ onSendOtp, initialPhone = "98765 43210" }) {
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);
  const [isFocused, setIsFocused] = useState(false);
  
  // Animated values for entrance and press effects
  const slideAnim = useState(new Animated.Value(height * 0.4))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];
  const buttonScale = useState(new Animated.Value(1))[0];

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 8,
        useNativeDriver: true,
      })
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(buttonScale, {
      toValue: 0.96,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(buttonScale, {
      toValue: 1,
      tension: 40,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handleSend = () => {
    // Basic verification, then trigger the callback
    const rawPhone = phoneNumber.replace(/\s+/g, '');
    if (rawPhone.length >= 10) {
      onSendOtp(phoneNumber);
    }
  };

  return (
    <Animated.View style={[
      styles.formContainer, 
      { 
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }] 
      }
    ]}>
      {/* Step Indicator */}
      <View style={styles.stepIndicatorRow}>
        <View style={styles.stepCircle}>
          <Text style={styles.stepText}>1</Text>
        </View>
        <Text style={styles.stepTitle}>Enter your mobile</Text>
      </View>

      {/* Input Label */}
      <Text style={styles.inputLabel}>Mobile number</Text>

      {/* Styled Mobile Input Group */}
      <View style={[
        styles.inputGroup, 
        isFocused && styles.inputGroupFocused
      ]}>
        {/* Country Selector Dropdown (Mocked) */}
        <TouchableOpacity style={styles.countryDropdown} activeOpacity={0.8}>
          <Text style={styles.flagIcon}>🇮🇳</Text>
          <Text style={styles.countryCode}>+91</Text>
          <MaterialIcons name="arrow-drop-down" size={18} color="#1b1c1c" style={styles.dropdownArrow} />
        </TouchableOpacity>

        {/* Separator line */}
        <View style={styles.separator} />

        {/* Phone Input */}
        <TextInput
          style={styles.phoneInput}
          placeholder="98765 43210"
          placeholderTextColor="#9ca3af"
          keyboardType="phone-pad"
          value={phoneNumber}
          onChangeText={setPhoneNumber}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          maxLength={15}
        />
      </View>

      {/* Description Subtext */}
      <Text style={styles.helperText}>
        We'll send a 6-digit OTP — no password needed
      </Text>

      {/* Send OTP Button with Animated Scale Effect */}
      <Animated.View style={[{ transform: [{ scale: buttonScale }] }, styles.buttonWrapper]}>
        <TouchableOpacity 
          activeOpacity={1}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handleSend}
          style={styles.sendButton}
        >
          <Text style={styles.sendButtonText}>Send OTP</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#1e1b1b" />
        </TouchableOpacity>
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 40,
    paddingHorizontal: 24,
    paddingBottom: 48,
    marginTop: 16,
    zIndex: 5,
  },
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 32,
  },
  stepCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#ff5722',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ff5722',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  stepText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
    color: '#ffffff',
  },
  stepTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
    color: '#1e1b1b',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginLeft: 12,
  },
  inputLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#5c697a',
    marginBottom: 8,
    paddingLeft: 4,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 56,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    borderRadius: 16,
    backgroundColor: '#ffffff',
    paddingHorizontal: 4,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  inputGroupFocused: {
    borderColor: '#ff5722',
    shadowColor: '#ff5722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  countryDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    height: '100%',
  },
  flagIcon: {
    fontSize: 18,
    marginRight: 6,
  },
  countryCode: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#1b1c1c',
  },
  dropdownArrow: {
    marginLeft: 2,
  },
  separator: {
    width: 1,
    height: 24,
    backgroundColor: '#eeeeee',
  },
  phoneInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 17,
    fontFamily: 'Montserrat-Bold',
    color: '#1b1c1c',
  },
  helperText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 12,
    marginBottom: 32,
  },
  buttonWrapper: {
    marginTop: 24,
  },
  sendButton: {
    height: 56,
    backgroundColor: '#ffd600',
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ffd600',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
  },
  sendButtonText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#1e1b1b',
    marginRight: 8,
  },
});
