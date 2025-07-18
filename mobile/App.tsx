import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  Button,
  SafeAreaView,
  TextInput,
  StyleSheet,
} from 'react-native';
import { useAuthStore, useScreenStore } from './state';
import { fetchGraphQL, GET_ME_QUERY, LOGIN_MUTATION } from './graphql';
import { EventList } from './events';
import { EventDetails } from './eventDetails';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient();

export default function App() {
  const { isLoggedIn, user, setUser, setIsLoggedIn } = useAuthStore();
  const { screen } = useScreenStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    const init = async () => {
      try {
        const token = localStorage.getItem('token');
        if (!token) return;

        const me = await fetchGraphQL(GET_ME_QUERY, {}, token);
        if (me?.me) {
          setUser(me.me);
          setIsLoggedIn(true);
        }
      } catch (err) {
        console.log('Not logged in yet.');
      }
    };
    init();
  }, []);

  const handleLogin = async () => {
    setError('');
    try {
      const result = await fetchGraphQL(LOGIN_MUTATION, { email, password });
      if (result?.login) {
        localStorage.setItem('token', result.login);

        setIsLoggedIn(true);

        const me = await fetchGraphQL(GET_ME_QUERY, {}, result.login);
        if (me?.me) {
          setUser(me.me);
        }
      } else {
        setError('Login failed');
      }
    } catch (err) {
      console.error(err);
      setError('Invalid credentials');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setIsLoggedIn(false);
    setUser(null);
  };

  const renderContent = () => {
    if (!isLoggedIn) {
      return (
        <SafeAreaView style={styles.container}>
          <Text style={styles.title}>Login</Text>

          <TextInput
            style={styles.input}
            placeholder="Email"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
          />

          <TextInput
            style={styles.input}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
          />

          {error ? <Text style={styles.error}>{error}</Text> : null}

          <Button title="Login" onPress={handleLogin} />
        </SafeAreaView>
      );
    }

    return screen === 'eventDetails' ? <EventDetails /> : <EventList />;
  };

  return (
    <QueryClientProvider client={queryClient}>
      {renderContent()}
    </QueryClientProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    marginBottom: 10,
    textAlign: 'center',
  },
  input: {
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    marginBottom: 10,
    paddingHorizontal: 10,
    borderRadius: 4,
  },
  error: {
    color: 'red',
    marginBottom: 10,
    textAlign: 'center',
  },
});
