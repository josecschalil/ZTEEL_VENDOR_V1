import React, { useEffect, useRef } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  Animated, 
  TouchableOpacity, 
  Dimensions 
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function SuccessScreen({ onReset }) {
  const scaleAnim = useRef(new Animated.Value(0.3)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;
  const textOpacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Spring pop checkmark and fade in screen
    Animated.parallel([
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 40,
        friction: 5,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      })
    ]).start();

    // Stagger text fade in
    Animated.timing(textOpacityAnim, {
      toValue: 1,
      duration: 600,
      delay: 300,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <Animated.View style={[styles.container, { opacity: opacityAnim }]}>
      <View style={styles.card}>
        {/* Success Animated Circle Icon */}
        <Animated.View style={[styles.successCircle, { transform: [{ scale: scaleAnim }] }]}>
          <MaterialIcons name="check" size={56} color="#ffffff" />
        </Animated.View>

        {/* Celebrating Messages */}
        <Animated.View style={[styles.messageContainer, { opacity: textOpacityAnim }]}>
          <Text style={styles.title}>Verification Successful</Text>
          <Text style={styles.subtitle}>
            Welcome to <Text style={styles.brandText}>Zteeel</Text>! Your mobile number is verified, and you can now explore exclusive live deals near SRMIST.
          </Text>

          <View style={styles.spacer} />

          {/* Continue button */}
          <TouchableOpacity 
            style={styles.continueButton}
            onPress={onReset}
            activeOpacity={0.8}
          >
            <Text style={styles.continueButtonText}>Start Exploring</Text>
            <MaterialIcons name="local-fire-department" size={20} color="#1e1b1b" />
          </TouchableOpacity>
        </Animated.View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 40,
    borderTopRightRadius: 40,
    paddingTop: 48,
    paddingHorizontal: 24,
    paddingBottom: 48,
    marginTop: -16,
    zIndex: 5,
  },
  card: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'flex-start',
    paddingTop: 32,
  },
  messageContainer: {
    alignItems: 'center',
    flex: 1,
    width: '100%',
  },
  spacer: {
    flex: 1,
  },
  successCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#4ade80',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#4ade80',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.35,
    shadowRadius: 16,
    elevation: 8,
  },
  title: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 24,
    color: '#1b1c1c',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#5b4039',
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: 16,
    marginBottom: 40,
  },
  brandText: {
    color: '#ff5722',
    fontFamily: 'Montserrat-Bold',
  },
  continueButton: {
    height: 56,
    width: width - 80,
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
  continueButtonText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 16,
    color: '#1e1b1b',
    marginRight: 8,
  },
});
