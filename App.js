import React, { useEffect, useState } from 'react';
import { StyleSheet, View, ActivityIndicator, TouchableWithoutFeedback, Keyboard, Platform } from 'react-native';
import { KeyboardAwareScrollView } from 'react-native-keyboard-aware-scroll-view';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import {
  Montserrat_700Bold,
  Montserrat_800ExtraBold
} from '@expo-google-fonts/montserrat';
import {
  Inter_500Medium,
  Inter_600SemiBold
} from '@expo-google-fonts/inter';

import Header from './src/components/Header';
import LoginScreen from './src/screens/LoginScreen';
import OtpScreen from './src/screens/OtpScreen';
import SuccessScreen from './src/screens/SuccessScreen';
import ShopSetupBasicScreen from './src/screens/ShopSetupBasicScreen';
import ShopSetupImagesScreen from './src/screens/ShopSetupImagesScreen';
import ShopSetupTimingsScreen from './src/screens/ShopSetupTimingsScreen';
import ShopSetupLocationScreen from './src/screens/ShopSetupLocationScreen';
import ShopSetupReviewScreen from './src/screens/ShopSetupReviewScreen';

export default function App() {
  // Load custom premium Montserrat and Inter Google Fonts
  let [fontsLoaded] = useFonts({
    'Montserrat-Bold': Montserrat_700Bold,
    'Montserrat-ExtraBold': Montserrat_800ExtraBold,
    'Inter-Medium': Inter_500Medium,
    'Inter-SemiBold': Inter_600SemiBold,
  });

  const [currentScreen, setCurrentScreen] = useState('login'); // 'login' | 'otp' | 'success'
  const [phoneNumber, setPhoneNumber] = useState('');
  const [shopLocation, setShopLocation] = useState(null);
  const [isLocationMapInteracting, setIsLocationMapInteracting] = useState(false);

  useEffect(() => {
    if (currentScreen !== 'shop-setup-4') {
      setIsLocationMapInteracting(false);
    }
  }, [currentScreen]);

  if (!fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff5722" />
      </View>
    );
  }

  // Navigation handlers
  const handleSendOtp = (phone) => {
    setPhoneNumber(phone);
    setCurrentScreen('otp');
  };

  const handleVerifyOtp = (code) => {
    // Reaching verified, transition to success screen
    setCurrentScreen('success');
  };

  const handleBackToLogin = () => {
    setCurrentScreen('login');
  };

  const handleResetFlow = () => {
    setPhoneNumber('');
    setCurrentScreen('login');
  };

  const handleBackPress = () => {
    switch (currentScreen) {
      case 'otp': return handleBackToLogin();
      case 'shop-setup': return setCurrentScreen('success');
      case 'shop-setup-2': return setCurrentScreen('shop-setup');
      case 'shop-setup-3': return setCurrentScreen('shop-setup-2');
      case 'shop-setup-4': return setCurrentScreen('shop-setup-3');
      case 'shop-setup-5': return setCurrentScreen('shop-setup-4');
      default: return handleBackToLogin();
    }
  };

  return (
    <KeyboardAwareScrollView
      style={styles.container}
      contentContainerStyle={{ flexGrow: 1 }}
      keyboardShouldPersistTaps="handled"
      bounces={false}
      showsVerticalScrollIndicator={false}
      enableOnAndroid={true}
      nestedScrollEnabled={true}
      extraScrollHeight={20}
      scrollEnabled={!(currentScreen === 'shop-setup-4' && isLocationMapInteracting)}
    >
      <View style={{ flex: 1 }}>
        {/* Light content status bar matching the orange hero layout */}
        <StatusBar style="light" backgroundColor="#ff6b35" />

        {/* Reusable Brand Gradient Header */}
        <Header
          showBackButton={['otp', 'shop-setup', 'shop-setup-2', 'shop-setup-3', 'shop-setup-4', 'shop-setup-5'].includes(currentScreen)}
          onBackPress={handleBackPress}
          title="Zteeel"
          showHeroText={currentScreen === 'login'}
        />

        {/* Screen Render Controller */}
        <View style={styles.screenArea}>
          {currentScreen === 'login' && (
            <LoginScreen
              onSendOtp={handleSendOtp}
              initialPhone={phoneNumber || "98765 43210"}
            />
          )}

          {currentScreen === 'otp' && (
            <OtpScreen
              phoneNumber={phoneNumber}
              onVerify={handleVerifyOtp}
              onBack={handleBackToLogin}
            />
          )}

          {currentScreen === 'success' && (
            <SuccessScreen
              onReset={() => setCurrentScreen('shop-setup')}
            />
          )}

          {currentScreen === 'shop-setup' && (
            <ShopSetupBasicScreen
              onNext={() => setCurrentScreen('shop-setup-2')}
              onSkip={() => console.log('Skip setup')}
            />
          )}

          {currentScreen === 'shop-setup-2' && (
            <ShopSetupImagesScreen
              onNext={() => setCurrentScreen('shop-setup-3')}
              onSkip={() => console.log('Skip setup')}
            />
          )}

          {currentScreen === 'shop-setup-3' && (
            <ShopSetupTimingsScreen
              onNext={() => setCurrentScreen('shop-setup-4')}
              onSkip={() => console.log('Skip setup')}
            />
          )}

          {currentScreen === 'shop-setup-4' && (
            <ShopSetupLocationScreen
              onNext={(locationData) => {
                setShopLocation(locationData);
                setCurrentScreen('shop-setup-5');
              }}
              onSkip={() => console.log('Skip setup')}
              onMapTouchChange={setIsLocationMapInteracting}
            />
          )}

          {currentScreen === 'shop-setup-5' && (
            <ShopSetupReviewScreen
              shopLocation={shopLocation}
              onNext={() => console.log('Setup Complete')}
            />
          )}
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#fcf9f8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  screenArea: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
