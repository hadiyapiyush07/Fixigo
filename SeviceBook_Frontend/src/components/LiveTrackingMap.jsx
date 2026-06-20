import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, Dimensions, Platform } from 'react-native';
import MapView, { Marker, Polyline, AnimatedRegion } from 'react-native-maps';
import axios from 'axios';

const { width } = Dimensions.get('window');

const LiveTrackingMap = ({ providerLocation, customerLocation }) => {
  const mapRef = useRef(null);
  const [routeCoordinates, setRouteCoordinates] = useState([]);
  
  // Use AnimatedRegion for smooth marker movement
  const [animatedProviderLoc] = useState(
    new AnimatedRegion({
      latitude: providerLocation?.latitude || 0,
      longitude: providerLocation?.longitude || 0,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    })
  );

  useEffect(() => {
    if (providerLocation?.latitude && providerLocation?.longitude) {
      // Animate marker to new location smoothly
      if (Platform.OS === 'android') {
        animatedProviderLoc.timing({
          latitude: providerLocation.latitude,
          longitude: providerLocation.longitude,
          duration: 1000,
          useNativeDriver: false
        }).start();
      } else {
        animatedProviderLoc.spring({
          latitude: providerLocation.latitude,
          longitude: providerLocation.longitude,
          useNativeDriver: false
        }).start();
      }
    }
  }, [providerLocation, animatedProviderLoc]);

  // Fetch OSRM Route
  useEffect(() => {
    const fetchRoute = async () => {
      if (!providerLocation || !customerLocation) return;
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${providerLocation.longitude},${providerLocation.latitude};${customerLocation.longitude},${customerLocation.latitude}?overview=full&geometries=geojson`;
        const res = await axios.get(url);
        if (res.data && res.data.routes && res.data.routes[0]) {
          const coords = res.data.routes[0].geometry.coordinates.map(c => ({
            latitude: c[1],
            longitude: c[0]
          }));
          setRouteCoordinates(coords);
          
          // Fit map to show both markers
          if (mapRef.current) {
            mapRef.current.fitToCoordinates(coords, {
              edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
              animated: true,
            });
          }
        }
      } catch (err) {
        console.error("OSRM Route Error:", err.message);
      }
    };
    
    fetchRoute();
  }, [providerLocation, customerLocation]);

  if (!providerLocation || !customerLocation) return null;

  return (
    <View style={styles.container}>
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={{
          latitude: customerLocation.latitude,
          longitude: customerLocation.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
      >
        <Marker 
          coordinate={customerLocation} 
          title="Your Location"
          pinColor="#3B82F6" 
        />
        
        <Marker.Animated 
          coordinate={animatedProviderLoc} 
          title="Provider"
        >
          <View style={styles.providerMarker}>
            <Text style={{fontSize: 20}}>🚗</Text>
          </View>
        </Marker.Animated>

        {routeCoordinates.length > 0 && (
          <Polyline
            coordinates={routeCoordinates}
            strokeColor="#3B82F6"
            strokeWidth={4}
          />
        )}
      </MapView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 250,
    width: '100%',
    borderRadius: 16,
    overflow: 'hidden',
    marginTop: 15,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  providerMarker: {
    backgroundColor: '#fff',
    padding: 5,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: '#3B82F6',
    elevation: 4,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 4,
  }
});

export default LiveTrackingMap;
