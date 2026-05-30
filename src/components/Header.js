import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function Header({ showBackButton, onBackPress, title = "Zteeel", showHeroText = false }) {
  // Pulsing animation for the "Deals Live" green dot
  const pulseAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.4,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  return (
    <View style={styles.outerContainer}>
      <LinearGradient
        colors={['#ff6b35', '#ff5722']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.gradient, showHeroText && styles.gradientLarge]}
      >
        {/* Floating Decorative Circles matching Web Mockup */}
        <View style={[styles.circleOne, showHeroText && styles.circleOneLarge]} pointerEvents="none" />
        <View style={[styles.circleTwo, showHeroText && styles.circleTwoLarge]} pointerEvents="none" />

        {/* Top Header Row */}
        <View style={styles.navigationRow}>
          {showBackButton ? (
            <TouchableOpacity 
              onPress={onBackPress} 
              style={styles.backButton}
              activeOpacity={0.7}
              accessibilityLabel="Go back"
            >
              <MaterialIcons name="arrow-back" size={24} color="#ffffff" />
            </TouchableOpacity>
          ) : (
            // Spacer to keep layout balanced
            <View style={styles.backButtonSpacer} />
          )}

          <Text style={styles.logoText}>{title}</Text>
          
          <View style={styles.rightSpacer} />
        </View>

        {/* Live Deals Badge Container */}
        <View style={styles.badgeContainer}>
          <View style={styles.badge}>
            <Animated.View style={[styles.greenDot, { opacity: pulseAnim }]} />
            <Text style={styles.badgeText}>Deals live</Text>
          </View>
        </View>

        {/* Dynamic Hero Brand Text to extend the orange portion (for Login page) */}
        {showHeroText && (
          <View style={styles.heroTextContainer}>
            <Text style={styles.heroTitle}>
              Grab deals{'\n'}
              while they're <Text style={styles.heroHighlight}>hot.</Text>
            </Text>
            <Text style={styles.heroSubtitle}>
              Hyperlocal offers around SRMIST — updated live.
            </Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  outerContainer: {
    width: '100%',
    backgroundColor: '#ffffff',
    borderBottomLeftRadius: 40,
    borderBottomRightRadius: 40,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#ff5722',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    zIndex: 10,
  },
  gradient: {
    paddingTop: 54,
    paddingBottom: 28,
    paddingHorizontal: 24,
    position: 'relative',
  },
  gradientLarge: {
    paddingBottom: 48,
  },
  circleOne: {
    position: 'absolute',
    top: -60,
    right: -40,
    width: 200,
    height: 200,
    borderRadius: 100,
    backgroundColor: 'rgba(255, 255, 255, 0.14)',
  },
  circleOneLarge: {
    width: 260,
    height: 260,
    borderRadius: 130,
    top: -40,
    right: -60,
  },
  circleTwo: {
    position: 'absolute',
    bottom: -60,
    right: 40,
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
  },
  circleTwoLarge: {
    width: 160,
    height: 160,
    borderRadius: 80,
    bottom: -40,
    right: 20,
  },
  navigationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonSpacer: {
    width: 40,
  },
  logoText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 26,
    color: '#ffffff',
    letterSpacing: -0.5,
    textAlign: 'center',
  },
  rightSpacer: {
    width: 40,
  },
  badgeContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingVertical: 6,
    paddingHorizontal: 14,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.15)',
  },
  greenDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#4ade80',
    marginRight: 8,
    shadowColor: '#4ade80',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 4,
  },
  badgeText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#ffffff',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  heroTextContainer: {
    marginTop: 28,
    paddingHorizontal: 4,
  },
  heroTitle: {
    fontFamily: 'Montserrat-ExtraBold',
    fontSize: 34,
    lineHeight: 38,
    color: '#ffffff',
    marginBottom: 12,
    letterSpacing: -0.5,
  },
  heroHighlight: {
    color: '#ffd600',
  },
  heroSubtitle: {
    fontFamily: 'Inter-Medium',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.9)',
    lineHeight: 20,
    paddingRight: 16,
  },
});
