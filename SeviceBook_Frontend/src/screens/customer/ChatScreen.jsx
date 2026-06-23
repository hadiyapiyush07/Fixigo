import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  FlatList, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator
} from 'react-native';
import io from 'socket.io-client';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';

const API_URL = 'http://10.87.158.85:5000/api';
const SOCKET_URL = 'http://10.87.158.85:5000';

const ChatScreen = ({ route, navigation }) => {
  const { bookingId, receiverId, receiverName } = route.params;
  const { accessToken, user } = useSelector(state => state.auth);
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const socketRef = useRef(null);
  const flatListRef = useRef(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`${API_URL}/messages/${bookingId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        setMessages(res.data.data || []);
      } catch (err) {
        console.warn('Could not fetch messages:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();

    // Setup Socket
    socketRef.current = io(SOCKET_URL, { transports: ['websocket'] });
    
    socketRef.current.on('connect', () => {
      socketRef.current.emit('booking:join', bookingId);
    });

    socketRef.current.on('newMessage', (msg) => {
      setMessages(prev => {
        // Prevent duplicates if we already optimistically added it
        if (prev.find(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    });

    return () => {
      if (socketRef.current) {
        socketRef.current.emit('booking:leave', bookingId);
        socketRef.current.disconnect();
      }
    };
  }, [bookingId, accessToken]);

  const sendMessage = async () => {
    const messageText = input.trim();
    if (!messageText) return;

    // Optimistic update
    const tempId = Date.now().toString();
    const tempMessage = {
      _id: tempId,
      message: messageText,
      sender: { _id: user?._id || 'me' },
      createdAt: new Date().toISOString(),
      isOptimistic: true
    };

    setMessages(prev => [...prev, tempMessage]);
    setInput('');

    try {
      const res = await axios.post(`${API_URL}/messages/${bookingId}`, {
        receiverId,
        message: messageText
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      // Replace optimistic message with actual message
      const realMessage = res.data.data;
      setMessages(prev => prev.map(m => m._id === tempId ? realMessage : m));
    } catch (err) {
      console.warn('Message send failed', err);
      // Remove failed message
      setMessages(prev => prev.filter(m => m._id !== tempId));
    }
  };

  const renderItem = ({ item }) => {
    const isMine = String(item.sender?._id || item.sender) === String(user?._id);
    
    return (
      <View style={[styles.msgWrapper, isMine ? styles.msgMine : styles.msgTheirs]}>
        <View style={[styles.msgBubble, isMine ? styles.bubbleMine : styles.bubbleTheirs, item.isOptimistic && { opacity: 0.7 }]}>
          <Text style={[styles.msgText, isMine ? styles.textMine : styles.textTheirs]}>
            {item.message}
          </Text>
        </View>
        <Text style={[styles.msgTime, isMine ? { alignSelf: 'flex-end', marginRight: 4 } : { alignSelf: 'flex-start', marginLeft: 4 }]}>
          {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Premium Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <View style={styles.backBtnCircle}>
            <Text style={{ fontSize: 20, color: COLORS.textPrimary }}>←</Text>
          </View>
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle}>{receiverName || 'Support Chat'}</Text>
          <Text style={styles.headerSubtitle}>Typically replies instantly</Text>
        </View>
        <TouchableOpacity style={styles.phoneBtn} activeOpacity={0.7}>
          <Text style={{ fontSize: 18 }}>📞</Text>
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView 
        style={styles.chatArea} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {loading ? (
          <View style={styles.loaderContainer}>
            <ActivityIndicator size="large" color={COLORS.primary} />
          </View>
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={item => item._id.toString()}
            renderItem={renderItem}
            contentContainerStyle={styles.listContent}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
            showsVerticalScrollIndicator={false}
          />
        )}

        <View style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TextInput
              style={styles.input}
              placeholder="Type your message..."
              placeholderTextColor="#9CA3AF"
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={500}
            />
            <TouchableOpacity 
              style={[styles.sendBtn, !input.trim() && styles.sendBtnDisabled]} 
              onPress={sendMessage}
              disabled={!input.trim()}
              activeOpacity={0.8}
            >
              <Text style={styles.sendBtnIcon}>➤</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1, borderBottomColor: '#F3F4F6',
    ...SHADOWS.sm
  },
  backBtn: { padding: 4 },
  backBtnCircle: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#F3F4F6',
    alignItems: 'center', justifyContent: 'center'
  },
  headerTitleContainer: { flex: 1, alignItems: 'center' },
  headerTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: '#111827' },
  headerSubtitle: { fontSize: 11, color: '#10B981', fontWeight: '600', marginTop: 2 },
  phoneBtn: {
    width: 40, height: 40, borderRadius: 20, backgroundColor: '#EFF6FF',
    alignItems: 'center', justifyContent: 'center'
  },
  
  chatArea: { flex: 1, backgroundColor: '#F9FAFB' },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: SPACING.xl, paddingBottom: SPACING.xxxl },

  msgWrapper: { marginBottom: SPACING.lg, maxWidth: '85%' },
  msgMine: { alignSelf: 'flex-end' },
  msgTheirs: { alignSelf: 'flex-start' },
  
  msgBubble: { 
    paddingHorizontal: SPACING.lg, paddingVertical: 12, 
    borderRadius: 20, ...SHADOWS.sm, elevation: 2
  },
  bubbleMine: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: '#FFFFFF', borderBottomLeftRadius: 4, borderWidth: 1, borderColor: '#F3F4F6' },
  
  msgText: { fontSize: 15, lineHeight: 22 },
  textMine: { color: '#FFFFFF' },
  textTheirs: { color: '#111827' },
  
  msgTime: { fontSize: 10, color: '#9CA3AF', marginTop: 6 },
  
  inputContainer: {
    padding: SPACING.md, paddingBottom: Platform.OS === 'ios' ? 30 : SPACING.md,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1, borderTopColor: '#F3F4F6',
  },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: '#F3F4F6', borderRadius: 24,
    paddingHorizontal: 16, paddingVertical: 8,
  },
  input: {
    flex: 1, fontSize: 15, color: '#111827',
    maxHeight: 100, minHeight: 40, paddingTop: 10, paddingBottom: 10,
  },
  sendBtn: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.primary,
    alignItems: 'center', justifyContent: 'center', marginLeft: 12,
    marginBottom: -2
  },
  sendBtnDisabled: { backgroundColor: '#D1D5DB' },
  sendBtnIcon: { fontSize: 18, color: '#FFFFFF', marginLeft: 4 } // offset for the paper plane arrow
});

export default ChatScreen;
