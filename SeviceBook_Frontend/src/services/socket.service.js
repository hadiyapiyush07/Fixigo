// src/services/socket.service.js
import { io } from 'socket.io-client';
import Config from 'react-native-config';

// Ensure you define SOCKET_URL in your .env file or fallback
const SOCKET_URL = Config.API_URL ? Config.API_URL.replace('/api', '') : 'http://10.0.2.2:5000';

class SocketService {
  constructor() {
    this.socket = null;
    this.listeners = new Map();
  }

  connect(token) {
    if (this.socket) {
      if (this.socket.connected) return;
      this.socket.connect();
      return;
    }

    this.socket = io(SOCKET_URL, {
      auth: { token: `Bearer ${token}` },
      transports: ['websocket'],
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1000,
    });

    this.socket.on('connect', () => {
      console.log('🔌 Socket connected:', this.socket.id);
      this._rebindListeners();
    });

    this.socket.on('disconnect', (reason) => {
      console.log('🔌 Socket disconnected:', reason);
    });

    this.socket.on('connect_error', (error) => {
      console.log('🔌 Socket connect error:', error.message);
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.listeners.clear();
      console.log('🔌 Socket manually disconnected');
    }
  }

  joinBookingRoom(bookingId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('booking:join', bookingId);
    }
  }

  leaveBookingRoom(bookingId) {
    if (this.socket && this.socket.connected) {
      this.socket.emit('booking:leave', bookingId);
    }
  }

  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);

    if (this.socket) {
      this.socket.on(event, callback);
    }
  }

  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index !== -1) {
        callbacks.splice(index, 1);
      }
    }

    if (this.socket) {
      this.socket.off(event, callback);
    }
  }

  emit(event, data) {
    if (this.socket && this.socket.connected) {
      this.socket.emit(event, data);
    }
  }

  _rebindListeners() {
    if (!this.socket) return;
    this.listeners.forEach((callbacks, event) => {
      callbacks.forEach(callback => {
        this.socket.off(event, callback); // prevent duplicates
        this.socket.on(event, callback);
      });
    });
  }
}

export const socketService = new SocketService();
