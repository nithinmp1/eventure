import React, { useEffect } from 'react';
import { useEventParticipantsStore } from './state';
import { useScreenStore } from './state';
import { useAuthStore } from './state';
import io from 'socket.io-client';
import {
  Text,
  Button,
  SafeAreaView,
  View,
  FlatList,
  StyleSheet,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchGraphQL, GET_EVENT_QUERY } from './graphql';
import { Participants } from './Participants';

const socket = io('http://localhost:4000');

export const EventDetails = () => {
  const { selectedEventId, navigateTo } = useScreenStore();
  const { participants, setParticipants, addParticipant, removeParticipant } =
    useEventParticipantsStore();

  const { data, isLoading } = useQuery({
    queryKey: ['event', selectedEventId],
    queryFn: () => fetchGraphQL(GET_EVENT_QUERY, { id: selectedEventId }),
    enabled: !!selectedEventId,
  });

  useEffect(() => {
    if (!selectedEventId) return;
    const user = useAuthStore.getState().user;
    socket.emit('joinEventRoom', { eventId: selectedEventId, name: user?.name || 'Anonymous' });

    socket.on('eventUsersUpdate', (users: string[]) => {
      console.log('Received participants:', users);
      setParticipants(users);
    });

    return () => {
      socket.emit('leaveEventRoom', selectedEventId);
      socket.off('eventUsersUpdate');
    };
  }, [selectedEventId]);

  if (isLoading || !data?.event) return <Text>Loading...</Text>;

  const event = data.event;

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Event Details</Text>

      <Text style={styles.eventName}>{event.name}</Text>
      <Text style={styles.eventLocation}>{event.location}</Text>

      <Button title="Back" onPress={() => navigateTo('eventList')} />

      <Participants />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
    flex: 1,
  },
  title: {
    fontSize: 24,
    marginBottom: 16,
    fontWeight: 'bold',
  },
  eventName: {
    fontSize: 20,
    marginBottom: 8,
  },
  eventLocation: {
    fontSize: 16,
    marginBottom: 16,
  },
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
