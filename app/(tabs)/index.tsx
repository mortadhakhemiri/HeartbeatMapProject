import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, View, Text, Alert, ActivityIndicator } from 'react-native';
import MapView, { Marker, Polyline, Region } from 'react-native-maps';
import { ref, onValue, Unsubscribe } from 'firebase/database';
import { database } from '../../firebaseConfig';
import * as Location from 'expo-location';

interface LocationCoord {
  latitude: number;
  longitude: number;
}

interface RouteCoordinate {
  latitude: number;
  longitude: number;
}

interface FirebaseLocationData {
  latitude: number;
  longitude: number;
}

export default function HomeScreen() {
  const [heartbeat, setHeartbeat] = useState<number | null>(null);
  const [deviceLocation, setDeviceLocation] = useState<LocationCoord | null>(null);
  const [userLocation, setUserLocation] = useState<LocationCoord | null>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<RouteCoordinate[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const mapRef = useRef<MapView | null>(null);

  const OPENROUTESERVICE_APIKEY = '5b3ce3597851110001cf6248369c837777f4492fafff3dddbe8fd939'; // Replace with your actual API key

  useEffect(() => {
    let isMounted = true;

    (async () => {
      try {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          setError('Permission to access location was denied');
          setLoading(false);
          return;
        }

        const userLoc = await Location.getCurrentPositionAsync({});
        if (isMounted) {
          const userCoord: LocationCoord = {
            latitude: userLoc.coords.latitude,
            longitude: userLoc.coords.longitude,
          };
          setUserLocation(userCoord);
          setLoading(false);
        }
      } catch (err) {
        console.error('Error fetching user location:', err);
        setError('Error fetching user location');
        setLoading(false);
      }
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  useEffect(() => {
    const heartRateRefDB = ref(database, '/sensorData/heartRate');
    const locationRefDB = ref(database, '/sensorData/location');

    const unsubscribeHeartRate: Unsubscribe = onValue(
      heartRateRefDB,
      (snapshot) => {
        const value = snapshot.val();
        console.log('Heartbeat value from Firebase:', value);
        if (typeof value === 'number') {
          setHeartbeat(value);
          setError(null);
        } else {
          setHeartbeat(null);
          setError('Invalid heart rate data');
        }
      },
      (err) => {
        console.error('Error fetching heart rate:', err);
        setError('Error fetching heart rate');
      }
    );

    const unsubscribeLocation: Unsubscribe = onValue(
      locationRefDB,
      (snapshot) => {
        const value: FirebaseLocationData | null = snapshot.val();
        console.log('Location data from Firebase:', value);
        if (value && typeof value.latitude === 'number' && typeof value.longitude === 'number') {
          setDeviceLocation({
            latitude: value.latitude,
            longitude: value.longitude,
          });
          setError(null);
        } else {
          setError('Invalid location data');
        }
      },
      (err) => {
        console.error('Error fetching location:', err);
        setError('Error fetching location');
      }
    );

    return () => {
      unsubscribeHeartRate();
      unsubscribeLocation();
    };
  }, []);

  useEffect(() => {
    if (
      userLocation &&
      deviceLocation &&
      deviceLocation.latitude !== null &&
      deviceLocation.longitude !== null
    ) {
      fetchRoute(userLocation, deviceLocation);
    }
  }, [userLocation, deviceLocation]);

  const fetchRoute = async (startLoc: LocationCoord, endLoc: LocationCoord) => {
    try {
      const response = await fetch(
        'https://api.openrouteservice.org/v2/directions/driving-car/geojson',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: OPENROUTESERVICE_APIKEY,
          },
          body: JSON.stringify({
            coordinates: [
              [startLoc.longitude, startLoc.latitude],
              [endLoc.longitude, endLoc.latitude],
            ],
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        console.error('Error fetching route:', errorData);
        Alert.alert('Error', 'Unable to fetch route');
        return;
      }

      const data = await response.json();

      if (data && data.features && data.features.length > 0) {
        const coords: RouteCoordinate[] = data.features[0].geometry.coordinates.map(
          (coord: [number, number]) => ({
            latitude: coord[1],
            longitude: coord[0],
          })
        );
        setRouteCoordinates(coords);
      } else {
        Alert.alert('Error', 'No route found');
      }
    } catch (error) {
      console.error('Error fetching route:', error);
      Alert.alert('Error', 'Unable to fetch route');
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ff0000" />
        <Text style={styles.loadingText}>Fetching your location...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {error && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      )}

      <View style={styles.heartbeatContainer}>
        <Text style={styles.heartbeatText}>
          Heartbeat: {heartbeat !== null ? `${heartbeat/10} bpm` : 'Loading...'}
        </Text>
      </View>

      {userLocation && (
        <MapView
          ref={mapRef}
          style={styles.map}
          showsUserLocation={true}
          initialRegion={
            userLocation
              ? {
                  ...userLocation,
                  latitudeDelta: 0.05,
                  longitudeDelta: 0.05,
                }
              : undefined
          }
          zoomEnabled={true}
          scrollEnabled={true}
        >
          <Marker coordinate={userLocation} title="Your Location" pinColor="blue" />

          {deviceLocation && (
            <Marker
              coordinate={deviceLocation}
              title="Device Location"
              description={`Heartbeat: ${
                heartbeat !== null ? `${heartbeat} bpm` : 'N/A'
              }`}
              pinColor="red"
            />
          )}

          {routeCoordinates.length > 0 && (
            <Polyline coordinates={routeCoordinates} strokeColor="hotpink" strokeWidth={3} />
          )}
        </MapView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  heartbeatContainer: {
    position: 'absolute',
    top: 20,
    width: '100%',
    alignItems: 'center',
    zIndex: 1,
  },
  heartbeatText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'red',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 10,
    borderRadius: 5,
  },
  map: {
    flex: 1,
  },
  errorContainer: {
    position: 'absolute',
    top: 70,
    width: '100%',
    alignItems: 'center',
    zIndex: 1,
  },
  errorText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: 'rgba(255, 0, 0, 0.8)',
    padding: 10,
    borderRadius: 5,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#333',
  },
});
