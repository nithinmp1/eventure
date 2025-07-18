import React from 'react';
import { Text, Button, SafeAreaView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchGraphQL, GET_EVENT_QUERY } from './graphql';
import { useScreenStore } from './state';

export const EventDetails = () => {
  const { selectedEventId, navigateTo } = useScreenStore();

  const { data, isLoading } = useQuery({
    queryKey: ['event'],
    queryFn: () => fetchGraphQL(GET_EVENT_QUERY, { id: selectedEventId }),
  });

  if (isLoading) return <Text>Loading...</Text>;
  const event = data?.event;
  if (!event) return <Text>Event not found.</Text>;

  return (
    <SafeAreaView style={{ padding: 20 }}>
      <Text style={{ fontSize: 20 }}>{event.name}</Text>
      <Text style={{ marginVertical: 10 }}>{event.location}</Text>
      <Button title="Back" onPress={() => navigateTo('eventList')} />
    </SafeAreaView>
  );
}
