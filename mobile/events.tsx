import React from 'react';
import { View, Text, Button, SafeAreaView } from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { fetchGraphQL, GET_EVENTS_QUERY } from './graphql';
import { useScreenStore } from './state';

export const EventList = () => {
  const { navigateTo } = useScreenStore();
  const { data, isLoading } = useQuery({
    queryKey: ['events'],
    queryFn: () => fetchGraphQL(GET_EVENTS_QUERY),
  });

  if (isLoading) return <Text>Loading...</Text>;

  return (
    <SafeAreaView style={{ padding: 20 }}>
      <Text style={{ fontSize: 24 }}>Events</Text>
      {data.events.map((e) => (
        <View key={e.id} style={{ marginVertical: 10 }}>
          <Text>{e.name}</Text>
          <Button title="View" onPress={() => navigateTo('eventDetails', e.id)} />
        </View>
      ))}
    </SafeAreaView>
  );
}
