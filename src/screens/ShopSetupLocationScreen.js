import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Animated,
  Dimensions,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';

const { height } = Dimensions.get('window');

const DEFAULT_REGION = {
  latitude: 12.8231,
  longitude: 80.0444,
  latitudeDelta: 0.005,
  longitudeDelta: 0.005,
};

const ADDRESS_DELTA = {
  latitudeDelta: 0.004,
  longitudeDelta: 0.004,
};

const HAS_NATIVE_MAP_KEY = true;
const GOOGLE_MAPS_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY
  || 'AIzaSyCzqYmBxIvt3b3TXi4L3rdjylCmfxSmSyE';

function uniqueParts(parts) {
  const seen = new Set();
  return parts
    .map((part) => String(part || '').trim())
    .filter(Boolean)
    .filter((part) => {
      const key = part.toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

function formatExpoAddress(address) {
  if (!address) return '';

  return uniqueParts([
    address.streetNumber && address.street
      ? `${address.streetNumber} ${address.street}`
      : address.street,
    address.district,
    address.subregion,
    address.city,
    address.region,
    address.postalCode,
    address.country,
  ]).join(', ');
}

function buildSharpAddress(baseAddress, landmark) {
  const cleanBase = String(baseAddress || '').trim();
  const cleanLandmark = String(landmark || '').trim();

  if (!cleanLandmark) return cleanBase;
  if (!cleanBase) return cleanLandmark;
  return `${cleanLandmark}, ${cleanBase}`;
}

function getGoogleAddressComponent(components, type, useShortName = false) {
  const component = components.find((item) => item.types?.includes(type));
  return component ? component[useShortName ? 'short_name' : 'long_name'] : '';
}

function formatGoogleAddress(result) {
  const components = result?.address_components || [];
  const streetNumber = getGoogleAddressComponent(components, 'street_number');
  const route = getGoogleAddressComponent(components, 'route');
  const premise = getGoogleAddressComponent(components, 'premise');
  const subpremise = getGoogleAddressComponent(components, 'subpremise');
  const neighborhood = getGoogleAddressComponent(components, 'neighborhood')
    || getGoogleAddressComponent(components, 'sublocality_level_2');
  const sublocality = getGoogleAddressComponent(components, 'sublocality_level_1')
    || getGoogleAddressComponent(components, 'sublocality');
  const city = getGoogleAddressComponent(components, 'locality')
    || getGoogleAddressComponent(components, 'administrative_area_level_3');
  const state = getGoogleAddressComponent(components, 'administrative_area_level_1');
  const postalCode = getGoogleAddressComponent(components, 'postal_code');
  const country = getGoogleAddressComponent(components, 'country');
  const streetLine = uniqueParts([
    subpremise,
    premise,
    streetNumber && route ? `${streetNumber} ${route}` : route,
  ]).join(', ');

  return uniqueParts([
    streetLine,
    neighborhood,
    sublocality,
    city,
    state,
    postalCode,
    country,
  ]).join(', ');
}

function formatNominatimAddress(data) {
  const address = data?.address || {};
  const streetLine = uniqueParts([
    address.house_number,
    address.road || address.pedestrian || address.footway,
  ]).join(' ');

  return uniqueParts([
    streetLine,
    address.neighbourhood,
    address.suburb,
    address.city_district,
    address.city || address.town || address.village,
    address.state_district,
    address.state,
    address.postcode,
    address.country,
  ]).join(', ');
}

function chooseBestGoogleResult(results) {
  const preferredTypes = ['street_address', 'premise', 'subpremise', 'route'];

  return preferredTypes
    .map((type) => results.find((result) => result.types?.includes(type)))
    .find(Boolean) || results[0];
}

async function fetchNominatim(path) {
  const response = await fetch(`https://nominatim.openstreetmap.org/${path}`, {
    headers: {
      Accept: 'application/json',
      'Accept-Language': 'en',
      'User-Agent': 'ZteeelVendorApp/1.0 (contact@zteeel.com)',
    },
  });

  if (!response.ok) {
    throw new Error(`Nominatim request failed with ${response.status}`);
  }

  return response.json();
}

async function searchAddress(query) {
  const trimmed = query.trim();
  if (trimmed.length < 3) return [];

  try {
    const data = await fetchNominatim(
      `search?format=jsonv2&addressdetails=1&limit=6&countrycodes=in&q=${encodeURIComponent(trimmed)}`
    );

    return data
      .map((item) => ({
        id: String(item.place_id || `${item.lat}-${item.lon}`),
        displayName: item.display_name,
        latitude: Number(item.lat),
        longitude: Number(item.lon),
        source: 'search',
      }))
      .filter((item) => Number.isFinite(item.latitude) && Number.isFinite(item.longitude));
  } catch (error) {
    console.warn('Nominatim search failed, falling back to Expo geocoding:', error);
  }

  try {
    const geocoded = await Location.geocodeAsync(trimmed);
    return geocoded.slice(0, 5).map((item, index) => ({
      id: `expo-${index}-${item.latitude}-${item.longitude}`,
      displayName: `${trimmed} (${item.latitude.toFixed(5)}, ${item.longitude.toFixed(5)})`,
      latitude: item.latitude,
      longitude: item.longitude,
      source: 'geocode',
    }));
  } catch (error) {
    console.warn('Expo geocode failed:', error);
    return [];
  }
}

async function reverseGeocodeAddress(coordinate) {
  if (GOOGLE_MAPS_API_KEY) {
    try {
      const response = await fetch(
        `https://maps.googleapis.com/maps/api/geocode/json?latlng=${coordinate.latitude},${coordinate.longitude}&result_type=street_address|premise|subpremise|route&key=${encodeURIComponent(GOOGLE_MAPS_API_KEY)}`
      );
      const data = await response.json();

      if (data.status === 'OK' && Array.isArray(data.results) && data.results.length > 0) {
        const formattedGoogleAddress = formatGoogleAddress(chooseBestGoogleResult(data.results));
        if (formattedGoogleAddress) return formattedGoogleAddress;
      } else if (data.status && data.status !== 'ZERO_RESULTS') {
        console.warn('Google reverse geocode status:', data.status, data.error_message || '');
      }
    } catch (error) {
      console.warn('Google reverse geocode failed, trying local geocoders:', error);
    }
  }

  try {
    const data = await fetchNominatim(
      `reverse?format=jsonv2&addressdetails=1&zoom=18&lat=${coordinate.latitude}&lon=${coordinate.longitude}`
    );
    const formattedNominatimAddress = formatNominatimAddress(data);

    if (formattedNominatimAddress) return formattedNominatimAddress;
  } catch (error) {
    console.warn('Nominatim reverse geocode failed, using Expo address:', error);
  }

  const expoAddress = await Location.reverseGeocodeAsync(coordinate);
  const formattedExpoAddress = formatExpoAddress(expoAddress[0]);

  return formattedExpoAddress;
}

function SuggestionItem({ item, onPress }) {
  return (
    <TouchableOpacity style={sg.row} activeOpacity={0.7} onPress={() => onPress(item)}>
      <MaterialIcons name="location-on" size={18} color="#ff5722" style={sg.icon} />
      <Text style={sg.text} numberOfLines={2}>{item.displayName}</Text>
    </TouchableOpacity>
  );
}

const sg = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f6f3f2',
  },
  icon: { marginRight: 10 },
  text: {
    flex: 1,
    fontFamily: 'Inter-Medium',
    fontSize: 13,
    color: '#1b1c1c',
    lineHeight: 19,
  },
});

export default function ShopSetupLocationScreen({ onNext, onSkip, onMapTouchChange }) {
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isFocused, setIsFocused] = useState(false);
  const [locationNote, setLocationNote] = useState('');

  const [region, setRegion] = useState(DEFAULT_REGION);
  const [markerCoord, setMarkerCoord] = useState({
    latitude: DEFAULT_REGION.latitude,
    longitude: DEFAULT_REGION.longitude,
  });
  const [confirmedAddress, setConfirmedAddress] = useState('');
  const [isLoadingAddress, setIsLoadingAddress] = useState(false);
  const [isLoadingLocation, setIsLoadingLocation] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState(null);

  const mapRef = useRef(null);
  const searchTimeout = useRef(null);
  const mapAddressTimeout = useRef(null);
  const programmaticMapMove = useRef(false);
  const latestMapCenter = useRef({
    latitude: DEFAULT_REGION.latitude,
    longitude: DEFAULT_REGION.longitude,
  });
  const searchRequestId = useRef(0);
  const reverseRequestId = useRef(0);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height * 0.4)).current;
  const buttonScale = useRef(new Animated.Value(1)).current;

  const finalAddress = useMemo(
    () => buildSharpAddress(confirmedAddress, locationNote),
    [confirmedAddress, locationNote]
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 50, friction: 8, useNativeDriver: true }),
    ]).start();

    const mapReadyFallback = setTimeout(() => {
      setIsMapReady(true);
    }, 2500);

    return () => {
      clearTimeout(mapReadyFallback);
      if (searchTimeout.current) clearTimeout(searchTimeout.current);
      if (mapAddressTimeout.current) clearTimeout(mapAddressTimeout.current);
      searchRequestId.current += 1;
      reverseRequestId.current += 1;
    };
  }, [fadeAnim, slideAnim]);

  const handlePressIn = () => Animated.spring(buttonScale, { toValue: 0.96, useNativeDriver: true }).start();
  const handlePressOut = () => Animated.spring(buttonScale, { toValue: 1, tension: 40, friction: 3, useNativeDriver: true }).start();

  const ensureForegroundPermission = useCallback(async () => {
    const current = await Location.getForegroundPermissionsAsync();
    if (current.status === 'granted') {
      setPermissionStatus(current.status);
      return true;
    }

    const requested = await Location.requestForegroundPermissionsAsync();
    setPermissionStatus(requested.status);
    return requested.status === 'granted';
  }, []);

  const moveMapTo = useCallback((coordinate) => {
    const nextRegion = { ...coordinate, ...ADDRESS_DELTA };
    setRegion(nextRegion);
    programmaticMapMove.current = true;

    if (mapRef.current) {
      mapRef.current.animateToRegion(nextRegion, 550);
    }

    setTimeout(() => {
      programmaticMapMove.current = false;
    }, 700);
  }, []);

  const updateAddressFromCoords = useCallback(async (coordinate) => {
    const requestId = reverseRequestId.current + 1;
    reverseRequestId.current = requestId;
    setIsLoadingAddress(true);

    try {
      const canGeocode = Platform.OS === 'android'
        ? await ensureForegroundPermission()
        : true;

      if (!canGeocode) {
        setConfirmedAddress(`${coordinate.latitude.toFixed(6)}, ${coordinate.longitude.toFixed(6)}`);
        return;
      }

      const address = await reverseGeocodeAddress(coordinate);

      if (reverseRequestId.current === requestId) {
        setConfirmedAddress(
          address || `${coordinate.latitude.toFixed(6)}, ${coordinate.longitude.toFixed(6)}`
        );
      }
    } catch (error) {
      console.warn('Reverse geocode failed:', error);
      if (reverseRequestId.current === requestId) {
        setConfirmedAddress(`${coordinate.latitude.toFixed(6)}, ${coordinate.longitude.toFixed(6)}`);
      }
    } finally {
      if (reverseRequestId.current === requestId) {
        setIsLoadingAddress(false);
      }
    }
  }, [ensureForegroundPermission]);

  const setPickedCoordinate = useCallback((coordinate, address = '') => {
    latestMapCenter.current = coordinate;
    setMarkerCoord(coordinate);
    moveMapTo(coordinate);

    if (address) {
      reverseRequestId.current += 1;
      setConfirmedAddress(address);
      setIsLoadingAddress(false);
    } else {
      updateAddressFromCoords(coordinate);
    }
  }, [moveMapTo, updateAddressFromCoords]);

  const handleSearchChange = useCallback((text) => {
    setSearchQuery(text);
    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    const trimmed = text.trim();
    if (trimmed.length < 3) {
      searchRequestId.current += 1;
      setSuggestions([]);
      setIsSearching(false);
      return;
    }

    const requestId = searchRequestId.current + 1;
    searchRequestId.current = requestId;
    setIsSearching(true);

    searchTimeout.current = setTimeout(async () => {
      const results = await searchAddress(trimmed);

      if (searchRequestId.current === requestId) {
        setSuggestions(results);
        setIsSearching(false);
      }
    }, 450);
  }, []);

  const handleSubmitSearch = useCallback(async () => {
    const trimmed = searchQuery.trim();
    if (trimmed.length < 3) return;

    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    const requestId = searchRequestId.current + 1;
    searchRequestId.current = requestId;
    setIsSearching(true);

    const results = await searchAddress(trimmed);
    if (searchRequestId.current !== requestId) return;

    setSuggestions(results);
    setIsSearching(false);

    if (results.length === 1) {
      const [result] = results;
      setPickedCoordinate(
        { latitude: result.latitude, longitude: result.longitude },
        result.displayName
      );
      setSearchQuery(result.displayName);
      setSuggestions([]);
      setIsFocused(false);
    }
  }, [searchQuery, setPickedCoordinate]);

  const handleSelectSuggestion = useCallback((item) => {
    const coordinate = { latitude: item.latitude, longitude: item.longitude };
    setPickedCoordinate(coordinate);
    setSearchQuery(item.displayName);
    setSuggestions([]);
    setIsFocused(false);
  }, [setPickedCoordinate]);

  const handleMapPress = useCallback((event) => {
    const { latitude, longitude } = event.nativeEvent.coordinate;
    setPickedCoordinate({ latitude, longitude });
  }, [setPickedCoordinate]);

  const handleRegionChange = useCallback((nextRegion) => {
    latestMapCenter.current = {
      latitude: nextRegion.latitude,
      longitude: nextRegion.longitude,
    };
  }, []);

  const handleRegionChangeComplete = useCallback((nextRegion, details) => {
    onMapTouchChange?.(false);

    latestMapCenter.current = {
      latitude: nextRegion.latitude,
      longitude: nextRegion.longitude,
    };

    if (programmaticMapMove.current) {
      programmaticMapMove.current = false;
      return;
    }

    if (details?.isGesture === false) return;

    const coordinate = {
      latitude: nextRegion.latitude,
      longitude: nextRegion.longitude,
    };

    setRegion(nextRegion);
    setMarkerCoord(coordinate);

    if (mapAddressTimeout.current) clearTimeout(mapAddressTimeout.current);
    mapAddressTimeout.current = setTimeout(() => {
      updateAddressFromCoords(coordinate);
    }, 650);
  }, [onMapTouchChange, updateAddressFromCoords]);

  const handleMapTouchStart = useCallback(() => {
    onMapTouchChange?.(true);
  }, [onMapTouchChange]);

  const handleMapTouchEnd = useCallback(() => {
    onMapTouchChange?.(false);
  }, [onMapTouchChange]);

  const handleUseMapCenter = useCallback(async () => {
    let coordinate = latestMapCenter.current;

    try {
      const camera = await mapRef.current?.getCamera?.();
      if (camera?.center) {
        coordinate = {
          latitude: camera.center.latitude,
          longitude: camera.center.longitude,
        };
      }
    } catch (error) {
      console.warn('Unable to read map camera, using last map center:', error);
    }

    onMapTouchChange?.(false);
    setPickedCoordinate(coordinate);
  }, [onMapTouchChange, setPickedCoordinate]);

  const handleUseCurrentLocation = useCallback(async () => {
    setIsLoadingLocation(true);

    try {
      const hasPermission = await ensureForegroundPermission();
      if (!hasPermission) {
        Alert.alert('Permission Denied', 'Please enable location permissions to use your current shop location.');
        return;
      }

      if (Platform.OS === 'android') {
        try {
          await Location.enableNetworkProviderAsync();
        } catch (error) {
          console.warn('High accuracy provider prompt was dismissed:', error);
        }
      }

      const lastKnown = await Location.getLastKnownPositionAsync({
        maxAge: 120000,
        requiredAccuracy: 150,
      });

      if (lastKnown?.coords) {
        setPickedCoordinate({
          latitude: lastKnown.coords.latitude,
          longitude: lastKnown.coords.longitude,
        });
      }

      const current = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      const coordinate = {
        latitude: current.coords.latitude,
        longitude: current.coords.longitude,
      };

      setPickedCoordinate(coordinate);
    } catch (error) {
      console.warn('Location error:', error);
      Alert.alert('Location Error', 'Unable to get your current location. Search for your address or tap the map instead.');
    } finally {
      setIsLoadingLocation(false);
    }
  }, [ensureForegroundPermission, setPickedCoordinate]);

  const handleContinue = () => {
    const locationData = {
      latitude: markerCoord.latitude,
      longitude: markerCoord.longitude,
      address: finalAddress,
      detectedAddress: confirmedAddress,
      landmark: locationNote.trim(),
      permissionStatus,
    };

    console.log('=== SHOP LOCATION DATA ===');
    console.log(JSON.stringify(locationData, null, 2));
    onNext(locationData);
  };

  const showSuggestions = isFocused && suggestions.length > 0;
  const canContinue = finalAddress.length > 0 && !isLoadingAddress;

  return (
    <Animated.View style={[styles.formContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>

      <View style={styles.stepIndicatorRow}>
        <View style={styles.stepCircle}>
          <Text style={styles.stepText}>4</Text>
        </View>
        <Text style={styles.stepTitle}>Shop location</Text>
      </View>

      <View style={styles.progressContainer}>
        <View style={styles.progressRow}>
          <Text style={styles.progressLabel}>Step 4 of 5</Text>
          <TouchableOpacity style={styles.skipRow} onPress={onSkip} activeOpacity={0.7}>
            <Text style={styles.skipText}>SKIP FOR NOW</Text>
            <MaterialIcons name="chevron-right" size={16} color="#5b4039" />
          </TouchableOpacity>
        </View>
        <View style={styles.progressBarTrack}>
          <View style={styles.progressBarFill} />
        </View>
      </View>

      <View style={styles.headerTextContainer}>
        <Text style={styles.title}>Shop Location</Text>
        <Text style={styles.subtitle}>
          Pin your exact location so customers can find your shop.
        </Text>
      </View>

      <View style={styles.formContent}>
        <Text style={styles.inputLabel}>Search Address</Text>
        <View style={[styles.inputGroup, isFocused && styles.inputGroupFocused]}>
          <MaterialIcons name="search" size={20} color="#5b4039" style={styles.searchIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="Enter shop, street, area, or pincode"
            placeholderTextColor="#9ca3af"
            value={searchQuery}
            onChangeText={handleSearchChange}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 200)}
            onSubmitEditing={handleSubmitSearch}
            returnKeyType="search"
          />
          {isSearching ? (
            <ActivityIndicator size="small" color="#ff5722" style={styles.searchSpinner} />
          ) : (
            <TouchableOpacity
              style={styles.myLocationBtn}
              onPress={handleUseCurrentLocation}
              disabled={isLoadingLocation}
              activeOpacity={0.7}
            >
              {isLoadingLocation ? (
                <ActivityIndicator size="small" color="#ff5722" />
              ) : (
                <MaterialIcons name="my-location" size={20} color="#ff5722" />
              )}
            </TouchableOpacity>
          )}
        </View>

        {showSuggestions && (
          <View style={styles.suggestionsBox}>
            {suggestions.map((item) => (
              <SuggestionItem key={item.id} item={item} onPress={handleSelectSuggestion} />
            ))}
          </View>
        )}

        <View style={styles.mapContainer}>
          {HAS_NATIVE_MAP_KEY ? (
            <>
              <MapView
                ref={mapRef}
                provider={PROVIDER_GOOGLE}
                style={styles.mapView}
                initialRegion={region}
                onPress={handleMapPress}
                onPanDrag={handleMapTouchStart}
                onRegionChange={handleRegionChange}
                onRegionChangeComplete={handleRegionChangeComplete}
                onMapReady={() => setIsMapReady(true)}
                onTouchStart={handleMapTouchStart}
                onTouchEnd={handleMapTouchEnd}
                onTouchCancel={handleMapTouchEnd}
                loadingEnabled={true}
                loadingIndicatorColor="#ff5722"
                loadingBackgroundColor="#fcf9f8"
                mapType="standard"
                scrollEnabled={true}
                zoomEnabled={true}
                rotateEnabled={false}
                pitchEnabled={false}
                showsUserLocation={permissionStatus === 'granted'}
                showsMyLocationButton={false}
              />

              {!isMapReady && (
                <View style={styles.mapLoadingOverlay} pointerEvents="none">
                  <ActivityIndicator size="small" color="#ff5722" />
                  <Text style={styles.mapLoadingText}>Loading map...</Text>
                </View>
              )}

              <View style={styles.centerPinContainer} pointerEvents="none">
                <View style={styles.customMarker}>
                  <MaterialIcons name="storefront" size={20} color="#ffffff" />
                </View>
                <View style={styles.markerTail} />
              </View>

              <View style={styles.dragLegendBox} pointerEvents="none">
                <MaterialIcons name="touch-app" size={16} color="#ff5722" />
                <Text style={styles.dragLegendText}>Move map</Text>
              </View>

              <TouchableOpacity
                style={styles.useMapCenterButton}
                activeOpacity={0.85}
                onPress={handleUseMapCenter}
              >
                <MaterialIcons name="check" size={16} color="#1e1b1b" />
                <Text style={styles.useMapCenterText}>Use this spot</Text>
              </TouchableOpacity>
            </>
          ) : (
            <View style={styles.mapKeyMissingBox}>
              <MaterialIcons name="map" size={30} color="#ff5722" />
              <Text style={styles.mapKeyMissingTitle}>Map key required</Text>
              <Text style={styles.mapKeyMissingText}>
                Add EXPO_PUBLIC_GOOGLE_MAPS_API_KEY and rebuild Android. Search and current location still work.
              </Text>
            </View>
          )}
        </View>

        <Text style={styles.inputLabel}>Building / Shop No / Landmark</Text>
        <View style={styles.noteInputGroup}>
          <MaterialIcons name="add-location-alt" size={19} color="#5b4039" style={styles.searchIcon} />
          <TextInput
            style={styles.textInput}
            placeholder="e.g. Shop 12, 2nd floor, near main gate"
            placeholderTextColor="#9ca3af"
            value={locationNote}
            onChangeText={setLocationNote}
            returnKeyType="done"
          />
        </View>

        <View style={styles.confirmedAddressBox}>
          <Text style={styles.confirmedLabel}>CONFIRMED ADDRESS</Text>
          <View style={styles.addressCard}>
            {isLoadingAddress ? (
              <View style={styles.addressLoading}>
                <ActivityIndicator size="small" color="#ff5722" />
                <Text style={styles.addressLoadingText}>Fetching precise address...</Text>
              </View>
            ) : finalAddress ? (
              <>
                <Text style={styles.addressText}>{finalAddress}</Text>
                <Text style={styles.coordinateText}>
                  {markerCoord.latitude.toFixed(6)}, {markerCoord.longitude.toFixed(6)}
                </Text>
              </>
            ) : (
              <Text style={styles.addressPlaceholder}>
                Search for an address, use your current location, tap the map, or drag the pin.
              </Text>
            )}
          </View>
        </View>
      </View>

      <Animated.View style={[{ transform: [{ scale: buttonScale }] }, styles.buttonWrapper]}>
        <TouchableOpacity
          activeOpacity={1}
          onPressIn={handlePressIn}
          onPressOut={handlePressOut}
          onPress={handleContinue}
          style={[styles.continueButton, !canContinue && styles.continueButtonDisabled]}
          disabled={!canContinue}
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

  stepIndicatorRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 20 },
  stepCircle: {
    width: 24, height: 24, borderRadius: 12,
    backgroundColor: '#ff5722',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#ff5722', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3, shadowRadius: 4, elevation: 4,
  },
  stepText: { fontFamily: 'Montserrat-Bold', fontSize: 11, color: '#ffffff' },
  stepTitle: {
    fontFamily: 'Montserrat-Bold', fontSize: 12, color: '#1e1b1b',
    textTransform: 'uppercase', letterSpacing: 1.5, marginLeft: 12,
  },

  progressContainer: { marginBottom: 28 },
  progressRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  progressLabel: { fontFamily: 'Inter-SemiBold', fontSize: 11, color: '#ff5722', textTransform: 'uppercase', letterSpacing: 1 },
  skipRow: { flexDirection: 'row', alignItems: 'center' },
  skipText: { fontFamily: 'Inter-SemiBold', fontSize: 10, color: '#5b4039', letterSpacing: 0.5, marginRight: 2 },
  progressBarTrack: { height: 5, backgroundColor: '#eeeeee', borderRadius: 3, overflow: 'hidden' },
  progressBarFill: { height: '100%', backgroundColor: '#ff5722', width: '80%', borderRadius: 3 },

  headerTextContainer: { marginBottom: 20 },
  title: { fontFamily: 'Montserrat-Bold', fontSize: 20, color: '#1b1c1c', marginBottom: 6 },
  subtitle: { fontFamily: 'Inter-Medium', fontSize: 13, color: '#5b4039', lineHeight: 20 },

  formContent: { flex: 1, paddingBottom: 16 },

  inputLabel: {
    fontFamily: 'Inter-SemiBold', fontSize: 11, color: '#5c697a',
    marginBottom: 6, paddingLeft: 4,
  },
  inputGroup: {
    flexDirection: 'row', alignItems: 'center',
    height: 56, borderWidth: 1.5, borderColor: '#eae7e7',
    borderRadius: 16, backgroundColor: '#f6f3f2',
    paddingHorizontal: 16, marginBottom: 16,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03, shadowRadius: 4, elevation: 1,
  },
  noteInputGroup: {
    flexDirection: 'row', alignItems: 'center',
    height: 52, borderWidth: 1.5, borderColor: '#eae7e7',
    borderRadius: 16, backgroundColor: '#f6f3f2',
    paddingHorizontal: 16, marginBottom: 16,
  },
  inputGroupFocused: {
    borderColor: '#ff5722', backgroundColor: '#ffffff',
    shadowColor: '#ff5722', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 8, elevation: 3,
  },
  searchIcon: { marginRight: 8 },
  textInput: {
    flex: 1, height: '100%',
    fontSize: 14, fontFamily: 'Inter-Medium', color: '#1b1c1c',
  },
  myLocationBtn: { padding: 4 },
  searchSpinner: { marginRight: 4 },

  suggestionsBox: {
    backgroundColor: '#ffffff',
    borderWidth: 1.5, borderColor: '#eae7e7',
    borderRadius: 16, marginTop: -8, marginBottom: 12,
    overflow: 'hidden',
    maxHeight: 200,
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1, shadowRadius: 10, elevation: 5,
    zIndex: 20,
  },

  mapContainer: {
    height: 220,
    borderRadius: 20,
    borderWidth: 1.5, borderColor: '#eae7e7',
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#fcf9f8',
    position: 'relative',
  },
  mapView: {
    width: '100%',
    height: '100%',
  },
  customMarker: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: '#ff5722',
    justifyContent: 'center', alignItems: 'center',
    shadowColor: '#ff5722', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 6, elevation: 6,
  },
  centerPinContainer: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    marginLeft: -20,
    marginTop: -48,
    alignItems: 'center',
  },
  markerTail: {
    width: 0, height: 0,
    borderLeftWidth: 8, borderRightWidth: 8, borderTopWidth: 10,
    borderLeftColor: 'transparent', borderRightColor: 'transparent',
    borderTopColor: '#ff5722',
    alignSelf: 'center', marginTop: -2,
  },
  dragLegendBox: {
    position: 'absolute', bottom: 12, left: 12,
    backgroundColor: 'rgba(255,255,255,0.95)',
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 20, flexDirection: 'row', alignItems: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1, shadowRadius: 4, elevation: 2,
  },
  dragLegendText: {
    fontFamily: 'Montserrat-Bold', fontSize: 10, color: '#5b4039',
    textTransform: 'uppercase', letterSpacing: 0.5, marginLeft: 6,
  },
  useMapCenterButton: {
    position: 'absolute',
    right: 12,
    bottom: 12,
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 14,
    backgroundColor: '#ffd600',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.16,
    shadowRadius: 5,
    elevation: 4,
  },
  useMapCenterText: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 11,
    color: '#1e1b1b',
  },
  mapLoadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#fcf9f8',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mapLoadingText: {
    fontFamily: 'Inter-SemiBold',
    fontSize: 12,
    color: '#5b4039',
  },
  mapKeyMissingBox: {
    flex: 1,
    backgroundColor: '#fcf9f8',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 22,
  },
  mapKeyMissingTitle: {
    fontFamily: 'Montserrat-Bold',
    fontSize: 14,
    color: '#1b1c1c',
    marginTop: 10,
    marginBottom: 6,
  },
  mapKeyMissingText: {
    fontFamily: 'Inter-Medium',
    fontSize: 12,
    color: '#5b4039',
    lineHeight: 18,
    textAlign: 'center',
  },

  confirmedAddressBox: { marginBottom: 16 },
  confirmedLabel: {
    fontFamily: 'Montserrat-Bold', fontSize: 10, color: '#5c697a',
    letterSpacing: 1, marginBottom: 8, paddingLeft: 4,
  },
  addressCard: {
    backgroundColor: '#fcf9f8', borderWidth: 1.5, borderColor: '#eae7e7',
    borderRadius: 16, padding: 16,
  },
  addressText: {
    fontFamily: 'Inter-Medium', fontSize: 13, color: '#1b1c1c', lineHeight: 20,
  },
  coordinateText: {
    fontFamily: 'Inter-SemiBold', fontSize: 11, color: '#5c697a',
    marginTop: 8,
  },
  addressPlaceholder: {
    fontFamily: 'Inter-Medium', fontSize: 13, color: '#9ca3af',
    lineHeight: 20, fontStyle: 'italic',
  },
  addressLoading: {
    flexDirection: 'row', alignItems: 'center',
  },
  addressLoadingText: {
    fontFamily: 'Inter-Medium', fontSize: 13, color: '#5b4039', marginLeft: 10,
  },

  buttonWrapper: { marginTop: 12 },
  continueButton: {
    height: 56, backgroundColor: '#ffd600', borderRadius: 16,
    flexDirection: 'row', justifyContent: 'center', alignItems: 'center',
    shadowColor: '#ffd600', shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 6,
  },
  continueButtonDisabled: {
    backgroundColor: '#ffea79', opacity: 0.6,
    shadowOpacity: 0.1, elevation: 2,
  },
  continueButtonText: {
    fontFamily: 'Montserrat-Bold', fontSize: 14, color: '#1e1b1b', marginRight: 8,
  },
});
