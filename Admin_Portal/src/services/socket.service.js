import { io } from 'socket.io-client';

let socket = null;

export const initSocket = (token) => {
  if (socket) return socket;
  
  const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
  socket = io(apiUrl.replace('/api', ''), {
    auth: { token: `Bearer ${token}` }
  });

  socket.on('connect', () => {
    console.log('🔌 Connected to Socket.io');
  });

  socket.on('disconnect', () => {
    console.log('🔌 Disconnected from Socket.io');
  });

  return socket;
};

export const getSocket = () => socket;
export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
