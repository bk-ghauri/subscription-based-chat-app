// Import Socket.IO client
import { io } from 'socket.io-client';

// Replace with your backend URL
const SERVER_URL = 'http://localhost:3000';

// Insert the JWT you got from your REST login
const TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI0YmI1ZDlkNC0xNmE5LTRhZjMtYmZjZS0yZGVhNzk5NGE3YmYiLCJpYXQiOjE3NTc0OTQyMjYsImV4cCI6MTc1NzUwNTAyNn0.iWSygckTde9-yt5VWBBY1nu4dallny68FH4D5NT6syQ';
// Conversation you already created via REST
const CONVERSATION_ID = 'c883cb76-c634-48f4-9287-a098db33bad0';

/**
 * 1. Initialize socket.io client
 * - Pass JWT in the `auth` field (your gateway checks `handshake.auth.token`)
 */
const socket = io(SERVER_URL, {
  auth: { token: TOKEN },
  transports: ['websocket'], // force WebSocket (avoids long-polling fallback)
});

/**
 * 2. Connection lifecycle events
 */
socket.on('authenticated', () => {
  console.log('✅ Connected:', socket.id);
  socket.emit('joinRoom', { conversationId: CONVERSATION_ID }, (response) => {
    console.log('➡️ joinRoom response:', response);

    if (response.success) {
      // After joining, send a test message
      socket.emit(
        'createMessage',
        { conversationId: CONVERSATION_ID, body: 'Hello from test client!' },
        (msg) => {
          console.log('➡️ createMessage ack:', msg);
        },
      );

      // Simulate typing event
      socket.emit('typing', {
        conversationId: CONVERSATION_ID,
        isTyping: true,
      });
      setTimeout(() => {
        socket.emit('typing', {
          conversationId: CONVERSATION_ID,
          isTyping: false,
        });
      }, 2000);
    }
  });
});

socket.on('disconnect', (reason) => {
  console.log('❌ Disconnected:', reason);
});

/**
 * 3. Listen for server events
 */
socket.on('message', (msg) => {
  console.log('📩 New message event:', msg);
});

socket.on('typing', (data) => {
  console.log('⌨️ Typing event:', data);
});

socket.on('connect_error', (err) => {
  console.error('⚠️ Connection error:', err.message);
});
