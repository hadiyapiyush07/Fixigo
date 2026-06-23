// src/hooks/useLocation.js
import { useState, useEffect, useRef, useCallback } from 'react';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import Geolocation from '@react-native-community/geolocation';
import { socketService } from '../services/socket.service';
import { calculateDistance } from '../utils/distance';

const DISTANCE_THRESHOLD_KM = 0.03; // Emit socket if moved by 30 meters
const EMIT_INTERVAL_MS = 30000; // Fallback: Emit at least every 30 seconds

export const useLocation = ({ isOnline = false, isActiveBooking = false } = {}) => {
  const [location, setLocation] = useState(null);
  const [hasPermission, setHasPermission] = useState(false);
  const watchId = useRef(null);
  const lastEmitLocation = useRef(null);
  const lastEmitTime = useRef(0);

  const requestPermission = async () => {
    if (Platform.OS === 'ios') {
      Geolocation.requestAuthorization();
      setHasPermission(true); // iOS handles internally via popup
      return true;
    }

    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION,
          {
            title: 'Location Permission',
            message: 'We need your location to find nearby bookings and show distance to customers.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          setHasPermission(true);
          return true;
        } else {
          Alert.alert('Permission Denied', 'Location permission is required to track your bookings.');
          setHasPermission(false);
          return false;
        }
      } catch (err) {
        console.warn(err);
        return false;
      }
    }
  };

  const emitLocation = useCallback((coords) => {
    const { latitude, longitude, heading, speed } = coords;
    
    const now = Date.now();
    const timeSinceLastEmit = now - lastEmitTime.current;
    
    let shouldEmit = false;
    
    if (!lastEmitLocation.current || timeSinceLastEmit > EMIT_INTERVAL_MS) {
      shouldEmit = true;
    } else {
      const distanceMoved = calculateDistance(
        lastEmitLocation.current.latitude,
        lastEmitLocation.current.longitude,
        latitude,
        longitude
      );
      if (distanceMoved > DISTANCE_THRESHOLD_KM) {
        shouldEmit = true;
      }
    }

    if (shouldEmit) {
      socketService.emit('provider:updateLocation', {
        latitude,
        longitude,
        heading,
        speed
      });
      lastEmitLocation.current = { latitude, longitude };
      lastEmitTime.current = now;
    }
  }, []);

  const startTracking = useCallback(() => {
    if (watchId.current !== null) return; // Already tracking

    Geolocation.getCurrentPosition(
      (position) => {
        setLocation(position.coords);
        emitLocation(position.coords);
      },
      (error) => console.log('Location Error:', error),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
    );

    watchId.current = Geolocation.watchPosition(
      (position) => {
        setLocation(position.coords);
        emitLocation(position.coords);
      },
      (error) => console.log('WatchPosition Error:', error),
      { 
        enableHighAccuracy: true, 
        distanceFilter: 10, // Update every 10 meters 
        interval: 10000, 
        fastestInterval: 5000 
      }
    );
  }, [emitLocation]);

  const stopTracking = useCallback(() => {
    if (watchId.current !== null) {
      Geolocation.clearWatch(watchId.current);
      watchId.current = null;
    }
  }, []);

  useEffect(() => {
    let mounted = true;
    
    const init = async () => {
      const granted = await requestPermission();
      if (!mounted) return;
      
      // Start tracking if permission granted AND provider is online OR on active booking
      if (granted && (isOnline || isActiveBooking)) {
        startTracking();
      } else {
        stopTracking();
      }
    };
    
    init();

    return () => {
      mounted = false;
      stopTracking();
    };
  }, [isOnline, isActiveBooking, startTracking, stopTracking]);

  // Expose manual re-fetch if needed
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      Geolocation.getCurrentPosition(
        (position) => {
          setLocation(position.coords);
          resolve(position.coords);
        },
        (error) => reject(error),
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 10000 }
      );
    });
  };

  return { location, hasPermission, getCurrentLocation };
};
