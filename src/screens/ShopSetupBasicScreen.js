import React, { useState, useRef, useEffect } from 'react';
import { Platform, ScrollView, KeyboardAvoidingView, View, Text, TextInput, TouchableOpacity, Modal, FlatList, Animated, StyleSheet, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

const { width, height } = Dimensions.get('window');

const CATEGORIES = [
  { id: 'electronics', label: 'Electronics & Tech' },
  { id: 'clothing', label: 'Fashion & Apparel' },
  { id: 'food', label: 'Food & Beverage' },
  { id: 'services', label: 'Local Services' },
];

export default function ShopSetupBasicScreen({ onNext, onSkip }) {
  // Form State
  const [shopName, setShopName] = useState('');
  const [shopCategory, setShopCategory] = useState(null);
  const [shopDescription, setShopDescription] = useState('');

  // UI State
  const [isCategoryModalVisible, setCategoryModalVisible] = useState(false);
  const [isNameFocused, setIsNameFocused] = useState(false);
  const [isDescFocused, setIsDescFocused] = useState(false);

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

  const isFormValid = shopName.trim().length > 0 && shopCategory !== null;

  console.log('--- ShopSetupBasicScreen rendered ---');
  console.log('shopName:', shopName);
  console.log('isNameFocused:', isNameFocused);

  return (
    <Animated.View style={[
      styles.formContainer,
      {
        opacity: fadeAnim,
        transform: [{ translateY: slideAnim }]
      }
    ]}>
      {/* Step Indicator - matching LoginScreen pattern */}
      <View style={styles.stepIndicatorRow}>
        <View style={styles.stepCircle}>
          <Text style={styles.stepText}>1</Text>
        </View>
        <Text style={styles.stepTitle}>Shop basics</Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressContainer}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Step 1 of 5</Text>
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
        <Text style={styles.title}>Shop Setup</Text>
        <Text style={styles.subtitle}>
          Let's get started with your basic shop details to build your storefront.
        </Text>
      </View>

      {/* Form Area */}
      <View style={styles.formContent}>
        {/* Shop Name Input */}
        <Text style={styles.inputLabel}>Shop Name</Text>
        <View style={[
          styles.inputGroup,
          isNameFocused && styles.inputGroupFocused
        ]}>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. The Fresh Grind Cafe"
            placeholderTextColor="#9ca3af"
            value={shopName}
            onChangeText={(text) => {
              console.log('onChangeText fired:', text);
              setShopName(text);
            }}
            onFocus={() => {
              console.log('TextInput onFocus fired');
              setIsNameFocused(true);
            }}
            onBlur={(e) => {
              console.log('TextInput onBlur fired! Event:', e.nativeEvent);
              setIsNameFocused(false);
            }}
          />
        </View>

        {/* Shop Category Selector */}
        <Text style={[styles.inputLabel, { marginTop: 20 }]}>Shop Category</Text>
        <TouchableOpacity
          style={[
            styles.inputGroup,
            styles.categorySelector,
          ]}
          activeOpacity={0.8}
          onPress={() => setCategoryModalVisible(true)}
        >
          <Text style={[styles.categoryText, !shopCategory && styles.categoryPlaceholder]}>
            {shopCategory ? shopCategory.label : 'Select a category'}
          </Text>
          <View style={styles.dropdownIcon}>
            <MaterialIcons name="unfold-more" size={20} color="#5b4039" />
          </View>
        </TouchableOpacity>

        {/* Shop Description */}
        <Text style={[styles.inputLabel, { marginTop: 20 }]}>Shop Description</Text>
        <View style={[
          styles.inputGroup,
          styles.textAreaGroup,
          isDescFocused && styles.inputGroupFocused
        ]}>
          <TextInput
            style={[styles.textInput, styles.textAreaInput]}
            placeholder="Briefly describe what you sell or offer to your customers..."
            placeholderTextColor="#9ca3af"
            value={shopDescription}
            onChangeText={setShopDescription}
            onFocus={() => setIsDescFocused(true)}
            onBlur={() => setIsDescFocused(false)}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />
        </View>

        {/* Helper text */}
        <Text style={styles.helperText}>
          You can always update these details later from settings
        </Text>
      </View>

      {/* Continue Button - matching Login/OTP button style */}
      <Animated.View style={[{ transform: [{ scale: buttonScale }] }, styles.buttonWrapper]}>
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={isFormValid ? onNext : null}
          style={[
            styles.continueButton,
            !isFormValid && styles.continueButtonDisabled
          ]}
          disabled={!isFormValid}
        >
          <Text style={styles.continueButtonText}>Continue</Text>
          <MaterialIcons name="arrow-forward" size={20} color="#1e1b1b" />
        </TouchableOpacity>
      </Animated.View>

      {/* Category Selection Modal */}
      <Modal
        visible={isCategoryModalVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setCategoryModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setCategoryModalVisible(false)}
        >
          <View style={styles.modalContent}>
            {/* Drag Handle */}
            <View style={styles.modalHandle} />

            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Category</Text>
              <TouchableOpacity
                onPress={() => setCategoryModalVisible(false)}
                style={styles.modalCloseBtn}
              >
                <MaterialIcons name="close" size={22} color="#1b1c1c" />
              </TouchableOpacity>
            </View>
            <FlatList
              data={CATEGORIES}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <TouchableOpacity
                  style={[
                    styles.categoryOption,
                    shopCategory?.id === item.id && styles.categoryOptionSelected
                  ]}
                  onPress={() => {
                    setShopCategory(item);
                    setCategoryModalVisible(false);
                  }}
                >
                  <Text style={[
                    styles.categoryOptionText,
                    shopCategory?.id === item.id && styles.categoryOptionTextSelected
                  ]}>
                    {item.label}
                  </Text>
                  {shopCategory?.id === item.id && (
                    <MaterialIcons name="check-circle" size={22} color="#ff5722" />
                  )}
                </TouchableOpacity>
              )}
            />
          </View>
        </TouchableOpacity>
      </Modal>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  // Container — matches LoginScreen/OtpScreen card pattern
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

  // Step Indicator — same pattern as LoginScreen
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
    width: '20%', // 1 of 5 steps
    borderRadius: 3,
  },

  // Header — matching OtpScreen style
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

  // Form
  formContent: {
    flex: 1,
    paddingBottom: 16,
  },
  inputLabel: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 11,
    color: '#5c697a',
    marginBottom: 6,
    paddingLeft: 4,
  },

  // Input Group — aesthetic redesign
  inputGroup: {
    height: 56,
    borderWidth: 1.5,
    borderColor: '#eae7e7',
    borderRadius: 16,
    backgroundColor: '#f6f3f2',
    paddingHorizontal: 4,
    justifyContent: 'center',
    // Base shadow added to prevent Android native remount bug on focus
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  inputGroupFocused: {
    borderColor: '#ff5722',
    backgroundColor: '#ffffff',
    shadowColor: '#ff5722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  textAreaGroup: {
    height: 100,
  },
  textInput: {
    flex: 1,
    height: '100%',
    paddingHorizontal: 16,
    fontSize: 14,
    fontFamily: 'Inter-Medium',
    color: '#1b1c1c',
  },
  textAreaInput: {
    paddingTop: 16,
    paddingBottom: 16,
    textAlignVertical: 'top',
  },

  // Category selector specific
  categorySelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
  },
  categoryText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#1b1c1c',
  },
  categoryPlaceholder: {
    color: '#9ca3af',
  },
  dropdownIcon: {
    backgroundColor: '#eeeeee',
    borderRadius: 12,
    padding: 4,
  },

  // Helper text — matching LoginScreen style
  helperText: {
    fontFamily: 'Inter-Medium',
    fontSize: 11,
    color: '#7f8c8d',
    textAlign: 'center',
    marginTop: 16,
  },

  // Button — matching LoginScreen/OtpScreen button exactly
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
  continueButtonDisabled: {
    backgroundColor: '#ffea79',
    opacity: 0.6,
    shadowOpacity: 0.1,
    elevation: 2,
  },
  continueButtonText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
    color: '#1e1b1b',
    marginRight: 8,
  },

  // Modal — refined to match app design language
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: height * 0.6,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  modalTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 18,
    color: '#1b1c1c',
  },
  modalCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  categoryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  categoryOptionSelected: {
    backgroundColor: '#fff3e0',
  },
  categoryOptionText: {
    fontFamily: 'Inter-Medium',
    fontSize: 16,
    color: '#1b1c1c',
  },
  categoryOptionTextSelected: {
    color: '#ff5722',
    fontFamily: 'Inter-SemiBold',
  },
});
