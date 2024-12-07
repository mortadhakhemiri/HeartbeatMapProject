#include <ESP8266WiFi.h>
#include <FirebaseESP8266.h>
#include <TinyGPS++.h>
#include <SoftwareSerial.h>

// WiFi credentials
const char* ssid = "Rmiki";
const char* password = "Hovcu3378#";

// Firebase configuration
#define FIREBASE_HOST "sensor-a9e85-default-rtdb.firebaseio.com"
#define FIREBASE_AUTH "Q5nLp6MwBYhKd2WwiKanvpzJBxwFrWhXTsgYvo08"

FirebaseData firebaseData;       // Firebase data object
FirebaseConfig firebaseConfig;   // Firebase configuration object
FirebaseAuth firebaseAuth;       // Firebase authentication object

// GPS and Heart Rate Sensor Pins
#define HEART_RATE_PIN A0
TinyGPSPlus gps;
SoftwareSerial gpsSerial(12, 13); //rx,tx


// Timers for periodic updates
long lastLocationUpdate = 0;
long lastHeartbeatSend = 0;

// WiFi Setup
void setup_wifi() {
  Serial.println();
  Serial.print("Connecting to ");
  Serial.println(ssid);

  WiFi.begin(ssid, password);
  while (WiFi.status() != WL_CONNECTED) {
    delay(500);
    Serial.print(".");
  }

  Serial.println();
  Serial.print("WiFi connected - ESP IP address: ");
  Serial.println(WiFi.localIP());
}

// Firebase Initialization
void setup_firebase() {
  firebaseConfig.host = FIREBASE_HOST;
  firebaseConfig.signer.tokens.legacy_token = FIREBASE_AUTH;

  Firebase.begin(&firebaseConfig, &firebaseAuth);

  if (Firebase.ready()) {
    Serial.println("Firebase initialized.");
  } else {
    Serial.println("Failed to initialize Firebase.");
    Serial.println(firebaseData.errorReason());
  }
}

// Heart Rate Reading Function
int readHeartRate() {
  int value = analogRead(HEART_RATE_PIN);
  return value; // Adjust scaling if needed for your sensor
}

// GPS Data Reading
void updateGPS() {
  while (gpsSerial.available() > 0) {
    gps.encode(gpsSerial.read());
  }
}

// Firebase Update Functions
void updateFirebaseHeartRate(int heartRate) {
  if (Firebase.setInt(firebaseData, "/sensorData/heartRate", heartRate)) {
    Serial.println("Heart rate sent to Firebase.");
  } else {
    Serial.print("Failed to send heart rate: ");
    Serial.println(firebaseData.errorReason());
  }
}

void updateFirebaseLocation(double latitude, double longitude) {
  if (Firebase.setDouble(firebaseData, "/sensorData/location/latitude", latitude) &&
      Firebase.setDouble(firebaseData, "/sensorData/location/longitude", longitude)) {
    Firebase.setTimestamp(firebaseData, "/sensorData/location/lastUpdated");
    Serial.println("Location sent to Firebase.");
  } else {
    Serial.print("Failed to send location: ");
    Serial.println(firebaseData.errorReason());
  }
}

// Setup Function
void setup() {
  Serial.begin(115200);
  gpsSerial.begin(9600); // Initialize GPS module on Software Serial
  setup_wifi();          // Connect to WiFi
  setup_firebase();      // Initialize Firebase
}

// Main Loop
void loop() {
  long now = millis();

  // Heartbeat Sensor - Real-time Updates
  if (now - lastHeartbeatSend > 1000) { // Send every second
    lastHeartbeatSend = now;
    int heartRate = readHeartRate();
    updateFirebaseHeartRate(heartRate);
  }

  // GPS Location - Updated every 20 seconds
  updateGPS();
  if (now - lastLocationUpdate > 20000) {
    lastLocationUpdate = now;
    if (gps.location.isUpdated()) {
      double latitude = gps.location.lat();
      double longitude = gps.location.lng();
      updateFirebaseLocation(latitude, longitude);
    } else {
      Serial.println("Waiting for GPS signal...");
    }
  }
}
