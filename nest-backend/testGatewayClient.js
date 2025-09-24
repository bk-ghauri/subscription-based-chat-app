// Import Socket.IO client
import { io } from 'socket.io-client';

// Replace with your backend URL
const SERVER_URL = 'http://localhost:3000';

// Insert the JWT you got from your REST login
const TOKEN =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOiI0NjA5ZTM3Yy1iODE4LTQ0NWMtYjY1NS0yNjIzMWFlMGYwZGMiLCJpYXQiOjE3NTg1MzU4NDQsImV4cCI6MTc1ODU0NjY0NH0.ToTnOKw-Rca9CiiEApk2CSbYVavA_KKyLt3FptBQhq4'; // JWT from login
// Conversation you already created via REST
const CONVERSATION_ID = '15ce0bd5-9f47-42e7-8b46-d6c27caa9bea';

/**
 * 1. Initialize socket.io client
 * - Pass JWT in the `auth` field (your gateway checks `handshake.auth.token`)
 */
const socket = io(SERVER_URL, {
  auth: { token: TOKEN },
  transports: ['websocket'],
});

/**
 * 2. Connection lifecycle
 */
socket.on('authenticated', () => {
  console.log('✅ Authenticated, socket id:', socket.id);

  // Join conversation room
  socket.emit('joinRoom', { conversationId: CONVERSATION_ID }, (response) => {
    console.log('➡️ joinRoom response:', response);

    if (response.success) {
      // Send test message
      socket.emit(
        'sendMessage',
        { conversationId: CONVERSATION_ID, body: 'Hello hello hellooo!' },
        (ack) => {
          console.log('➡️ sendMessage ack:', ack);

          const msgId = ack?.message?.id;
          if (msgId) {
            // Simulate delivered event
            socket.emit('messageDelivered', {
              messageId: msgId,
              conversationId: CONVERSATION_ID,
            });

            // Simulate read event
            setTimeout(() => {
              socket.emit('messageRead', {
                messageId: msgId,
                conversationId: CONVERSATION_ID,
              });
            }, 1500);

            // Simulate remove message
            setTimeout(() => {
              socket.emit('removeMessage', {
                messageId: msgId,
                conversationId: CONVERSATION_ID,
              });
            }, 3000);
          }
        },
      );

      // Typing events
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
 * 3. Listen for all server events
 */
socket.on('userOnline', (data) => {
  console.log('🟢 User online:', data);
});

socket.on('userOffline', (data) => {
  console.log('🔴 User offline:', data);
});

socket.on('receiveMessage', (msg) => {
  console.log('📩 receiveMessage:', msg);
});

socket.on('typing', (data) => {
  console.log('⌨️ Typing:', data);
});

socket.on('messageStatusUpdate', (data) => {
  console.log('📬 Message status update:', data);
});

socket.on('messageReadByAll', (data) => {
  console.log('👀 Message read by all:', data);
});

socket.on('MESSAGE_DELETED', (data) => {
  console.log('🗑️ Message deleted:', data);
});

socket.on('connect_error', (err) => {
  console.error('⚠️ Connection error:', err.message);
});
