import { io } from 'socket.io-client';

const socket = io('http://localhost:4000');

socket.on('connect', () => {
  console.log('🔌 Socket connected!');
});

socket.on('eventCreated', (event) => {
  console.log('🆕 New event:', event);
});
