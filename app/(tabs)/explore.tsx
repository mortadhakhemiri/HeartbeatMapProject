import React, { useState } from 'react';
import { StyleSheet, FlatList, View, Text, useColorScheme } from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Collapsible } from '@/components/Collapsible';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function TabTwoScreen() {
  const colorScheme = useColorScheme();

  const [heartbeatHistory] = useState([
    { id: '1', value: 72, time: '10:00 AM', date: new Date('2024-10-01T10:00:00') },
    { id: '2', value: 75, time: '10:05 AM', date: new Date('2024-10-01T10:05:00') },
    { id: '3', value: 68, time: '10:10 AM', date: new Date('2024-10-02T10:10:00') },
    { id: '4', value: 80, time: '10:15 AM', date: new Date('2024-10-02T10:15:00') },
  ]);

  const [locationHistory] = useState([
    { id: '1', latitude: 37.7749, longitude: -122.4194, time: '10:00 AM', date: new Date('2024-10-01T10:00:00') },
    { id: '2', latitude: 37.7755, longitude: -122.4199, time: '10:05 AM', date: new Date('2024-10-01T10:05:00') },
    { id: '3', latitude: 37.7760, longitude: -122.4205, time: '10:10 AM', date: new Date('2024-10-02T10:10:00') },
    { id: '4', latitude: 37.7765, longitude: -122.4210, time: '10:15 AM', date: new Date('2024-10-02T10:15:00') },
  ]);

  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const filteredHeartbeatHistory = heartbeatHistory.filter(
    (item) => item.date.toDateString() === selectedDate.toDateString()
  );

  const filteredLocationHistory = locationHistory.filter(
    (item) => item.date.toDateString() === selectedDate.toDateString()
  );

  const sections = [
    {
      id: 'heartbeat',
      title: 'Heartbeat History',
      data: filteredHeartbeatHistory,
      renderItem: ({ item }) => (
        <View style={styles.historyItem}>
          <View style={styles.iconContainer}>
            <Text style={styles.heartIcon}>❤️</Text>
          </View>
          <Text
            style={[
              styles.historyText,
              { color: colorScheme === 'dark' ? '#FFF' : '#000' },
            ]}
          >
            Time: {item.time}, Heartbeat: {item.value} bpm
          </Text>
        </View>
      ),
    },
    {
      id: 'location',
      title: 'Location History',
      data: filteredLocationHistory,
      renderItem: ({ item }) => (
        <View style={styles.historyItem}>
          <View style={styles.iconContainer}>
            <Text style={styles.locationIcon}>📍</Text>
          </View>
          <Text
            style={[
              styles.historyText,
              { color: colorScheme === 'dark' ? '#FFF' : '#000' },
            ]}
          >
            Time: {item.time}, Latitude: {item.latitude.toFixed(4)}, Longitude:{' '}
            {item.longitude.toFixed(4)}
          </Text>
        </View>
      ),
    },
  ];

  return (
    <FlatList
      data={sections}
      keyExtractor={(section) => section.id}
      renderItem={({ item: section }) => (
        <Collapsible title={section.title}>
          {section.data.length > 0 ? (
            <FlatList
              data={section.data}
              keyExtractor={(item) => item.id}
              renderItem={section.renderItem}
              nestedScrollEnabled
            />
          ) : (
            <Text
              style={[
                styles.noDataText,
                { color: colorScheme === 'dark' ? '#FFF' : '#000' },
              ]}
            >
              No data available for the selected date.
            </Text>
          )}
        </Collapsible>
      )}
      ListHeaderComponent={() => (
        <ThemedView style={styles.titleContainer}>
          <View style={styles.headerIcon}>
            <Text style={styles.customIcon}>📜</Text>
          </View>
          <ThemedText
            type="title"
            style={{ color: colorScheme === 'dark' ? '#FFF' : '#000' }}
          >
            History Overview
          </ThemedText>
          <View style={styles.datePickerContainer}>
            <Text
              style={[
                styles.datePickerText,
                { color: colorScheme === 'dark' ? '#FFF' : '#000' },
              ]}
              onPress={() => setShowDatePicker(true)}
            >
              Select Date: {selectedDate.toDateString()}
            </Text>
            {showDatePicker && (
              <DateTimePicker
                value={selectedDate}
                mode="date"
                display="default"
                onChange={(event, date) => {
                  setShowDatePicker(false);
                  if (date) {
                    setSelectedDate(date);
                  }
                }}
              />
            )}
          </View>
        </ThemedView>
      )}
    />
  );
}

const styles = StyleSheet.create({
  titleContainer: {
    alignItems: 'center',
    padding: 16,
  },
  headerIcon: {
    fontSize: 60,
    marginBottom: 10,
  },
  customIcon: {
    fontSize: 60,
  },
  historyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  iconContainer: {
    marginRight: 10,
  },
  heartIcon: {
    fontSize: 24,
    color: 'red',
  },
  locationIcon: {
    fontSize: 24,
    color: 'blue',
  },
  historyText: {
    fontSize: 16,
  },
  datePickerContainer: {
    marginTop: 20,
    alignItems: 'center',
  },
  datePickerText: {
    fontSize: 18,
    textDecorationLine: 'underline',
  },
  noDataText: {
    padding: 10,
    fontSize: 16,
    textAlign: 'center',
  },
});
