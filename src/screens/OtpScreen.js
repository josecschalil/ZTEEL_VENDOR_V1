import React, { useState, useEffect, useRef } from 'react';
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

export default function OtpScreen({ phoneNumber, onVerify, onBack }) {
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [timer, setTimer] = useState(45);
  const [isResendActive, setIsResendActive] = useState(false);
  const [activeInputIndex, setActiveInputIndex] = useState(0);

  // Anim values
  const slideAnim = useState(new Animated.Value(height * 0.4))[0];
  const fadeAnim = useState(new Animated.Value(0))[0];
  const buttonScale = useState(new Animated.Value(1))[0];

  // References to the 6 inputs for focus shifting
  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null)
  ];

  // Page animation on mount
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

    // Auto-focus first input on load
    setTimeout(() => {
      if (inputRefs[0] && inputRefs[0].current) {
        inputRefs[0].current.focus();
      }
    }, 400);
  }, []);

  // Countdown timer logic
  useEffect(() => {
    if (timer > 0) {
      const interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
      return () => clearInterval(interval);
    } else {
      setIsResendActive(true);
    }
  }, [timer]);

  // Handle inputs typing and auto-advance
  const handleInputChange = (text, index) => {
    // Only permit digits
    const cleanedText = text.replace(/[^0-9]/g, '');
    if (!cleanedText) {
      // Emptying input
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    const singleDigit = cleanedText[cleanedText.length - 1];
    const newOtp = [...otp];
    newOtp[index] = singleDigit;
    setOtp(newOtp);

    // Auto advance
    if (index < 5) {
      inputRefs[index + 1].current.focus();
    }
  };

  // Handle backspace auto-previous key
  const handleKeyPress = (e, index) => {
    if (e.nativeEvent.key === 'Backspace') {
      if (otp[index] === '') {
        // Box is already empty, focus previous box and clear it
        if (index > 0) {
          inputRefs[index - 1].current.focus();
          const newOtp = [...otp];
          newOtp[index - 1] = '';
          setOtp(newOtp);
        }
      } else {
        // Clear current box
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  // Resend OTP action
  const handleResend = () => {
    if (isResendActive) {
      setTimer(45);
      setIsResendActive(false);
      setOtp(['', '', '', '', '', '']);
      inputRefs[0].current.focus();
      // Trigger API / mock log here
      console.log("OTP Resent successfully!");
    }
  };

  // Action button animations
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

  const handleVerify = () => {
    const otpCode = otp.join('');
    if (otpCode.length === 6) {
      onVerify(otpCode);
    }
  };

  // Format seconds to mm:ss
  const formatTime = (secs) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `0${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  return (
    <Animated.View style={[
      styles.formContainer, 
      { 
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }] 
      }
    ]}>
      {/* Card Icon & Title */}
      <View style={styles.cardHeader}>
        <View style={styles.lockIconBg}>
          <MaterialIcons name="lock-open" size={28} color="#b02f00" />
        </View>
        <Text style={styles.cardTitle}>Verify OTP</Text>
        <Text style={styles.cardSubtitle}>
          Enter the 6-digit code sent to {'\n'}
          <Text style={styles.phoneNumberBold}>{phoneNumber}</Text>
        </Text>
      </View>

      {/* OTP Code Input Boxes */}
      <View style={styles.otpInputContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={inputRefs[index]}
            style={[
              styles.otpInput,
              digit !== '' && styles.otpInputFilled,
              activeInputIndex === index && styles.otpInputFocused
            ]}
            placeholder=""
            maxLength={1}
            keyboardType="number-pad"
            value={digit}
            onChangeText={(text) => handleInputChange(text, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            onFocus={() => setActiveInputIndex(index)}
            selectTextOnFocus={true}
          />
        ))}
      </View>

      {/* Action Row */}
      <View style={styles.actionSection}>
        <Animated.View style={{ transform: [{ scale: buttonScale }] }}>
          <TouchableOpacity 
            activeOpacity={1}
            onPressIn={handlePressIn}
            onPressOut={handlePressOut}
            onPress={handleVerify}
            style={[
              styles.verifyButton,
              otp.join('').length < 6 && styles.verifyButtonDisabled
            ]}
            disabled={otp.join('').length < 6}
          >
            <Text style={styles.verifyButtonText}>Verify & Proceed</Text>
            <MaterialIcons name="arrow-forward" size={20} color="#1e1b1b" />
          </TouchableOpacity>
        </Animated.View>

        {/* Countdown timer & Resend */}
        <View style={styles.timerContainer}>
          <Text style={styles.timerDescription}>
            Didn't receive code?{' '}
            <Text 
              onPress={handleResend} 
              style={[
                styles.resendText, 
                !isResendActive && styles.resendTextDisabled
              ]}
            >
              Resend OTP
            </Text>
          </Text>
          
          {!isResendActive && (
            <Text style={styles.countdownText}>{formatTime(timer)}</Text>
          )}
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  formContainer: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 36,
    paddingHorizontal: 24,
    paddingBottom: 48,
    marginTop: 16,
    zIndex: 5,
  },
  cardHeader: {
    alignItems: 'center',
    marginBottom: 32,
  },
  lockIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffdbd1',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 24,
    color: '#1b1c1c',
    marginBottom: 8,
  },
  cardSubtitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#5b4039',
    textAlign: 'center',
    lineHeight: 20,
  },
  phoneNumberBold: {
    fontFamily: 'Inter-SemiBold',
    color: '#1b1c1c',
  },
  otpInputContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 32,
  },
  otpInput: {
    width: 46,
    height: 56,
    borderWidth: 2,
    borderColor: '#e4e2e1',
    borderRadius: 16,
    backgroundColor: '#fcf9f8',
    textAlign: 'center',
    fontFamily: 'Montserrat-Bold',
    fontSize: 22,
    color: '#1b1c1c',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.02,
    shadowRadius: 2,
    elevation: 1,
  },
  otpInputFilled: {
    backgroundColor: '#ffffff',
    borderColor: '#e4e2e1',
  },
  otpInputFocused: {
    borderColor: '#ff5722',
    backgroundColor: '#ffffff',
    shadowColor: '#ff5722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
  },

  actionSection: {
    width: '100%',
  },
  verifyButton: {
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
  verifyButtonDisabled: {
    backgroundColor: '#ffea79',
    opacity: 0.6,
    shadowOpacity: 0.1,
    elevation: 2,
  },
  verifyButtonText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#1e1b1b',
    marginRight: 8,
  },
  timerContainer: {
    alignItems: 'center',
    marginTop: 20,
  },
  timerDescription: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: '#5b4039',
  },
  resendText: {
    fontFamily: 'Inter-SemiBold',
    color: '#ff5722',
    textDecorationLine: 'underline',
  },
  resendTextDisabled: {
    color: '#a0a0a0',
    textDecorationLine: 'none',
  },
  countdownText: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: '#5b4039',
    opacity: 0.6,
    marginTop: 6,
  },
});
