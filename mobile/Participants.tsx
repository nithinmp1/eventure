// Participants.tsx
import React from 'react';
import { View, Text, FlatList, StyleSheet } from 'react-native';
import { useEventParticipantsStore } from './state';

export const Participants = () => {
  const { participants } = useEventParticipantsStore();
    console.log(participants);
  return (
    <View>
      <Text style={styles.subheading}>Live Participants:</Text>
      <FlatList
        data={participants}
        keyExtractor={(item) => item}
        renderItem={({ item }) => <Text style={styles.participant}>{item}</Text>}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  subheading: {
    fontSize: 18,
    marginTop: 24,
    marginBottom: 8,
    fontWeight: '600',
  },
  participant: {
    fontSize: 16,
    paddingVertical: 4,
  },
});
