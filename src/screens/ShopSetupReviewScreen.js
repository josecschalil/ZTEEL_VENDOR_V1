import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  ScrollView,
  ActivityIndicator
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { height } = Dimensions.get('window');

// Collapsible Accordion Component
const ReviewAccordion = ({ title, icon, subtitle, children, defaultOpen = false }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const animValue = useRef(new Animated.Value(defaultOpen ? 1 : 0)).current;

  const toggleOpen = () => {
    const toValue = isOpen ? 0 : 1;
    setIsOpen(!isOpen);
    Animated.timing(animValue, {
      toValue,
      duration: 300,
      useNativeDriver: false, // height animation doesn't support native driver
    }).start();
  };

  const bodyHeight = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200], // approximate max height, or handle dynamically
  });

  const arrowRotate = animValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '180deg'],
  });

  return (
    <View style={styles.accordionContainer}>
      <TouchableOpacity
        style={styles.accordionHeader}
        activeOpacity={0.7}
        onPress={toggleOpen}
      >
        <View style={styles.accordionHeaderLeft}>
          <View style={styles.accordionIconBg}>
            <MaterialIcons name={icon} size={24} color="#ff5722" />
          </View>
          <View>
            <Text style={styles.accordionTitle}>{title}</Text>
            <Text style={styles.accordionSubtitle}>{subtitle}</Text>
          </View>
        </View>
        <Animated.View style={{ transform: [{ rotate: arrowRotate }] }}>
          <MaterialIcons name="expand-more" size={24} color="#5c697a" />
        </Animated.View>
      </TouchableOpacity>

      {isOpen && (
        <View style={styles.accordionBody}>
          <View style={styles.accordionBodyContent}>
            <TouchableOpacity style={styles.editBtn}>
              <MaterialIcons name="edit" size={18} color="#ff5722" />
            </TouchableOpacity>
            {children}
          </View>
        </View>
      )}
    </View>
  );
};

export default function ShopSetupReviewScreen({ onNext, shopLocation }) {
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = () => {
    setIsSubmitting(true);
    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      onNext();
    }, 1500);
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
          <Text style={styles.stepText}>5</Text>
        </View>
        <Text style={styles.stepTitle}>Review & Finish</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Step 5 of 5</Text>
        </View>
        <View style={styles.progressBarTrack}>
          <View style={styles.progressBarFill} />
        </View>
      </View>

      {/* Header Text */}
      <View style={styles.headerTextContainer}>
        <Text style={styles.title}>Review & Finish</Text>
        <Text style={styles.subtitle}>
          Check your details before finalizing your shop setup
        </Text>
      </View>

      {/* Form Content */}
      <View style={styles.formContent}>
        {/* Basic Details Accordion */}
        <ReviewAccordion
          title="Basic Details"
          subtitle="NAME, DESCRIPTION"
          icon="storefront"
          defaultOpen={true}
        >
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>SHOP NAME</Text>
            <Text style={styles.detailValue}>The Fresh Grind Cafe</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>DESCRIPTION</Text>
            <Text style={styles.detailValueSub}>Artisanal coffee and locally sourced pastries in a cozy, welcoming environment.</Text>
          </View>
        </ReviewAccordion>

        {/* Location Accordion */}
        <ReviewAccordion
          title="Location"
          subtitle="ADDRESS & MAP"
          icon="location-on"
        >
          <Text style={[styles.detailValueSub, { marginBottom: 16 }]}>
            {shopLocation?.address || 'No shop location selected'}
          </Text>
          <View style={styles.mapPreviewBox}>
            <MaterialIcons name="map" size={16} color="#5c697a" style={{ marginRight: 6 }} />
            <Text style={styles.mapPreviewText}>
              {shopLocation
                ? `${shopLocation.latitude.toFixed(5)}, ${shopLocation.longitude.toFixed(5)}`
                : 'MAP PREVIEW'}
            </Text>
          </View>
        </ReviewAccordion>

        {/* Hours Accordion */}
        <ReviewAccordion
          title="Hours"
          subtitle="WEEKLY SCHEDULE"
          icon="schedule"
        >
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Mon - Fri</Text>
            <Text style={styles.timeValue}>7:00 AM - 6:00 PM</Text>
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Saturday</Text>
            <Text style={styles.timeValue}>8:00 AM - 4:00 PM</Text>
          </View>
          <View style={styles.timeRow}>
            <Text style={styles.timeLabel}>Sunday</Text>
            <Text style={styles.timeValueError}>Closed</Text>
          </View>
        </ReviewAccordion>

        {/* Images Accordion */}
        <ReviewAccordion
          title="Images"
          subtitle="3 PHOTOS UPLOADED"
          icon="image"
        >
          <View style={styles.imagesRow}>
            <View style={styles.imageThumb}><Text style={styles.imageThumbText}>IMG 1</Text></View>
            <View style={styles.imageThumb}><Text style={styles.imageThumbText}>IMG 2</Text></View>
            <View style={styles.imageThumb}><Text style={styles.imageThumbText}>IMG 3</Text></View>
          </View>
        </ReviewAccordion>

      </View>

      {/* Continue Button */}
      <Animated.View style={[{ transform: [{ scale: buttonScale }] }, styles.buttonWrapper]}>
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handleSubmit}
          style={[styles.continueButton, isSubmitting && styles.continueButtonSubmitting]}
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <ActivityIndicator color="#1e1b1b" size="small" />
          ) : (
            <>
              <Text style={styles.finishButtonText}>All Set!</Text>
              <MaterialIcons name="celebration" size={24} color="#1e1b1b" />
            </>
          )}
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
    width: '100%', // Step 5 of 5
    borderRadius: 3,
  },

  // Header
  headerTextContainer: {
    marginBottom: 24,
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
    gap: 16,
  },

  // Accordion Components
  accordionContainer: {
    backgroundColor: '#f6f3f2',
    borderWidth: 1.5,
    borderColor: '#eae7e7',
    borderRadius: 16,
    overflow: 'hidden',
  },
  accordionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
  },
  accordionHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  accordionIconBg: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ffeae3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  accordionTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
    color: '#1b1c1c',
    marginBottom: 2,
  },
  accordionSubtitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 10,
    color: '#5c697a',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  accordionBody: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  accordionBodyContent: {
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingTop: 16,
    position: 'relative',
  },
  editBtn: {
    position: 'absolute',
    top: 16,
    right: 0,
    padding: 4,
  },
  detailRow: {
    marginBottom: 16,
  },
  detailLabel: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 10,
    color: '#5c697a',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
  },
  detailValue: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: '#1b1c1c',
  },
  detailValueSub: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: '#5b4039',
    lineHeight: 20,
    paddingRight: 24, // space for edit icon
  },
  mapPreviewBox: {
    height: 100,
    backgroundColor: '#eae7e7',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapPreviewText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 10,
    color: '#5c697a',
    letterSpacing: 1,
  },
  timeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 10,
    paddingRight: 24,
  },
  timeLabel: {
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: '#5b4039',
  },
  timeValue: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#1b1c1c',
  },
  timeValueError: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 13,
    color: '#ba1a1a',
  },
  imagesRow: {
    flexDirection: 'row',
    gap: 12,
  },
  imageThumb: {
    width: 64,
    height: 64,
    borderRadius: 12,
    backgroundColor: '#eae7e7',
    borderWidth: 1,
    borderColor: '#e0e0e0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageThumbText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 10,
    color: '#5c697a',
    letterSpacing: 0.5,
  },

  // Button - Green Finish Button
  buttonWrapper: {
    marginTop: 12,
  },
  continueButton: {
    height: 56,
    backgroundColor: '#ffd600', // Green completion color
    borderRadius: 16,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#ffd600',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    borderWidth: 1,
    borderColor: 'rgba(0, 83, 19, 0.1)',
  },
  continueButtonSubmitting: {
    opacity: 0.8,
  },
  finishButtonText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
    color: '#1e1b1b',
    marginRight: 8,
  },
});
