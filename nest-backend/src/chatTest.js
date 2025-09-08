// chatTest.js
import { io } from 'socket.io-client';

// replace with your JWTs and conversationId
const USER1_TOKEN = 'abc';
const USER2_TOKEN = '<def';
const CONVERSATION_ID = '<conversation_uuid>';

function createClient(name, token) {
  const socket = io('http://localhost:3001', {
    auth: { token },
  });

  socket.on('connect', () => {
    console.log(`${name} connected`);

    // Join conversation room
    socket.emit('joinRoom', { conversationId: CONVERSATION_ID }, (res) => {
      console.log(`${name} joinRoom →`, res);

      // Send message after joining
      if (name === 'User1') {
        setTimeout(() => {
          socket.emit('createMessage', {
            conversationId: CONVERSATION_ID,
            body: 'Hello from User1 🚀',
          });
        }, 1000);
      }
    });
  });

  // Listen for new messages
  socket.on('message', (msg) => {
    console.log(`${name} got message →`, msg);
  });

  // Listen for typing indicator
  socket.on('typing', (data) => {
    console.log(`${name} sees typing →`, data);
  });

  return socket;
}

// simulate two users
const client1 = createClient('User1', USER1_TOKEN);
const client2 = createClient('User2', USER2_TOKEN);

// simulate typing event from User2
setTimeout(() => {
  client2.emit('typing', { conversationId: CONVERSATION_ID, isTyping: true });
}, 2000);
