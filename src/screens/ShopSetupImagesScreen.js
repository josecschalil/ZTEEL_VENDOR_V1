import React, { useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  Animated, 
  Dimensions,
  ScrollView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

export default function ShopSetupImagesScreen({ onNext, onSkip }) {
  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height * 0.4)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

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
          <Text style={styles.stepText}>2</Text>
        </View>
        <Text style={styles.stepTitle}>Shop images</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Step 2 of 5</Text>
          <TouchableOpacity style={styles.skipRow} onPress={onSkip} activeOpacity={0.7}>
            <Text style={styles.skipText}>SKIP FOR NOW</Text>
            <MaterialIcons name="chevron-right" size={16} color="#5b4039" />
          </TouchableOpacity>
        </View>
        <View style={styles.progressBarTrack}>
          <View style={styles.progressBarFill} />
        </View>
      </View>

      {/* Header Text */}
      <View style={styles.headerTextContainer}>
        <Text style={styles.title}>Shop Images</Text>
        <Text style={styles.subtitle}>
          Upload clear, high-quality images to help customers recognize your store.
        </Text>
      </View>

      {/* Form Content */}
      <View style={styles.formContent}>
        {/* Shop Profile Image */}
        <View style={styles.uploadSection}>
          <Text style={styles.inputLabel}>
            Shop Profile Image <Text style={styles.requiredAsterisk}>*</Text>
          </Text>
          <Text style={styles.helperSubtext}>Recommended size: 500x500px.</Text>
          
          <TouchableOpacity activeOpacity={0.8} style={styles.uploadBox}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="add-a-photo" size={24} color="#ff5722" />
            </View>
            <Text style={styles.uploadTitle}>Tap to upload profile image</Text>
            <Text style={styles.uploadSubtitle}>Browse your gallery</Text>
          </TouchableOpacity>
        </View>

        {/* Shop Banner Image */}
        <View style={styles.uploadSection}>
          <Text style={styles.inputLabel}>Shop Banner Image</Text>
          <Text style={styles.helperSubtext}>Recommended size: 1200x400px. Max 5MB.</Text>
          
          <TouchableOpacity activeOpacity={0.8} style={[styles.uploadBox, styles.uploadBoxLarge]}>
            <View style={styles.iconCircle}>
              <MaterialIcons name="landscape" size={28} color="#ff5722" />
            </View>
            <Text style={styles.uploadTitle}>Tap to upload banner image</Text>
            <Text style={styles.uploadSubtitle}>Browse your gallery (Optional)</Text>
          </TouchableOpacity>
        </View>

      </View>

      {/* Continue Button */}
      <Animated.View style={[{ transform: [{ scale: buttonScale }] }, styles.buttonWrapper]}>
        <TouchableOpacity 
          activeOpacity={1}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={onNext}
          style={styles.continueButton}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
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
    paddingTop: 36,
    paddingHorizontal: 24,
    paddingBottom: 24,
    marginTop: -16,
    zIndex: 5,
  },

  // Step Indicator
  stepIndicatorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  stepCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
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
    fontSize: 11,
    color: '#ffffff',
  },
  stepTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 12,
    color: '#1e1b1b',
    textTransform: 'uppercase',
    letterSpacing: 1.5,
    marginLeft: 12,
  },

  // Progress section
  progressContainer: {
    marginBottom: 28,
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  progressLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#ff5722',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  skipRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skipText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 10,
    color: '#5b4039',
    letterSpacing: 0.5,
    marginRight: 2,
  },
  progressBarTrack: {
    height: 5,
    backgroundColor: '#eeeeee',
    borderRadius: 3,
    width: '100%',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#ff5722',
    width: '40%', // Step 2 of 5
    borderRadius: 3,
  },

  // Header
  headerTextContainer: {
    marginBottom: 28,
  },
  title: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 20,
    color: '#1b1c1c',
    marginBottom: 6,
  },
  subtitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: '#5b4039',
    lineHeight: 20,
  },

  // Form Content
  formContent: {
    flex: 1,
    paddingBottom: 16,
  },
  uploadSection: {
    marginBottom: 24,
  },
  inputLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#1b1c1c',
    marginBottom: 2,
    paddingLeft: 4,
  },
  requiredAsterisk: {
    color: '#ff5722',
  },
  helperSubtext: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: '#5c697a',
    marginBottom: 12,
    paddingLeft: 4,
  },
  
  // Upload Box
  uploadBox: {
    width: '100%',
    height: 160,
    backgroundColor: '#fcf9f8',
    borderWidth: 2,
    borderColor: '#eae7e7',
    borderStyle: 'dashed',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  uploadBoxLarge: {
    height: 200,
  },
  iconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ffeae3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  uploadTitle: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 14,
    color: '#1b1c1c',
    marginBottom: 4,
    textAlign: 'center',
  },
  uploadSubtitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#907067',
    textAlign: 'center',
  },

  // Button
  buttonWrapper: {
    marginTop: 12,
  },
  continueButton: {
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
  continueButtonText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
    color: '#1e1b1b',
    marginRight: 8,
  },
});
