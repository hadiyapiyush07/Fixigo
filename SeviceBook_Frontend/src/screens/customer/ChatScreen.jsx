import React, { useState, useEffect, useRef } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, 
  FlatList, StyleSheet, KeyboardAvoidingView, Platform, SafeAreaView, ActivityIndicator
} from 'react-native';
import Animated, { FadeInUp, FadeIn, Layout, SlideInRight, SlideInLeft } from 'react-native-reanimated';
import axios from 'axios';
import { useSelector } from 'react-redux';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';
import { socketService } from '../../services/socket.service';
import { ChevronLeft, Phone, Send, MoreVertical, Image as ImageIcon } from 'lucide-react-native';

const API_URL = 'http://10.113.245.85:5000/api'; // Switched back to physical IP or emulator IP depending on env

const ChatScreen = ({ route, navigation }) => {
  const { bookingId, receiverId, receiverName } = route.params;
  const { accessToken, user } = useSelector(state => state.auth);
  
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const flatListRef = useRef(null);

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const res = await axios.get(`${API_URL}/messages/${bookingId}`, {
          headers: { Authorization: `Bearer ${accessToken}` }
        });
        setMessages(res.data.data || []);
      } catch (err) {
        console.warn('Could not fetch messages');
      } finally {
        setLoading(false);
      }
    };
    fetchMessages();

    socketService.joinBookingRoom(bookingId);
    const handleNewMessage = (msg) => {
      if (String(msg.bookingId) !== String(bookingId)) return;
      setMessages(prev => {
        if (String(msg.sender?._id || msg.sender) === String(user?._id)) return prev;
        if (prev.find(m => m._id === msg._id)) return prev;
        return [...prev, msg];
      });
    };
    socketService.on('newMessage', handleNewMessage);
    return () => {
      socketService.leaveBookingRoom(bookingId);
      socketService.off('newMessage', handleNewMessage);
    };
  }, [bookingId, accessToken]);

  const sendMessage = async () => {
    const messageText = input.trim();
    if (!messageText) return;

    const tempId = Date.now().toString();
    const tempMessage = {
      _id: tempId, message: messageText, sender: { _id: user?._id || 'me' },
      createdAt: new Date().toISOString(), isOptimistic: true
    };
    setMessages(prev => [...prev, tempMessage]);
    setInput('');

    try {
      const res = await axios.post(`${API_URL}/messages/${bookingId}`, { receiverId, message: messageText }, { headers: { Authorization: `Bearer ${accessToken}` } });
      const realMessage = res.data.data;
      setMessages(prev => prev.map(m => m._id === tempId ? realMessage : m));
    } catch (err) {
      console.warn('Message send failed');
      setMessages(prev => prev.filter(m => m._id !== tempId));
    }
  };

  const renderItem = ({ item }) => {
    const isMine = String(item.sender?._id || item.sender) === String(user?._id);
    
    return (
      <Animated.View 
        entering={isMine ? SlideInRight.springify() : SlideInLeft.springify()} 
        layout={Layout.springify()}
        style={[styles.msgWrapper, isMine ? styles.msgMine : styles.msgTheirs]}
      >
        {!isMine && <View style={styles.avatarTheirs}><Text style={styles.avatarText}>{receiverName?.[0] || 'P'}</Text></View>}
        <View style={styles.msgContent}>
          <View style={[styles.msgBubble, isMine ? styles.bubbleMine : styles.bubbleTheirs, item.isOptimistic && { opacity: 0.6 }]}>
            <Text style={[styles.msgText, isMine ? styles.textMine : styles.textTheirs]}>{item.message}</Text>
          </View>
          <Text style={[styles.msgTime, isMine ? { alignSelf: 'flex-end', marginRight: 4 } : { alignSelf: 'flex-start', marginLeft: 4 }]}>
            {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </Text>
        </View>
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <ChevronLeft size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <View style={styles.headerTitleContainer}>
          <Text style={styles.headerTitle} numberOfLines={1}>{receiverName || 'Support Chat'}</Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2 }}>
            <View style={styles.onlineDot} />
            <Text style={styles.headerSubtitle}>Online</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.iconBtn} activeOpacity={0.7}>
          <Phone size={20} color={COLORS.primary} />
        </TouchableOpacity>
        <TouchableOpacity style={[styles.iconBtn, { marginLeft: SPACING.xs }]} activeOpacity={0.7}>
          <MoreVertical size={20} color={COLORS.textSecondary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView style={styles.chatArea} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        {loading ? (
          <View style={styles.loaderContainer}><ActivityIndicator size="large" color={COLORS.primary} /></View>
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

        <Animated.View entering={FadeInUp.springify()} style={styles.inputContainer}>
          <View style={styles.inputWrapper}>
            <TouchableOpacity style={styles.attachBtn}>
              <ImageIcon size={22} color={COLORS.textTertiary} />
            </TouchableOpacity>
            <TextInput
              style={styles.input}
              placeholder="Type a message..."
              placeholderTextColor={COLORS.textTertiary}
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
              <Send size={18} color={COLORS.white} style={{ marginLeft: -2 }} />
            </TouchableOpacity>
          </View>
        </Animated.View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: SPACING.lg, paddingTop: Platform.OS === 'ios' ? 60 : SPACING.xxl, paddingBottom: SPACING.md,
    backgroundColor: COLORS.background, borderBottomWidth: 1, borderBottomColor: COLORS.border,
  },
  backBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm, ...SHADOWS.sm },
  headerTitleContainer: { flex: 1 },
  headerTitle: { fontSize: FONT_SIZES.md, fontWeight: '800', color: COLORS.textPrimary },
  onlineDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.success, marginRight: 6 },
  headerSubtitle: { fontSize: 12, color: COLORS.textSecondary, fontWeight: '600' },
  iconBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm },
  
  chatArea: { flex: 1, backgroundColor: COLORS.background },
  loaderContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: SPACING.lg, paddingBottom: SPACING.xxxl },

  msgWrapper: { flexDirection: 'row', alignItems: 'flex-end', marginBottom: SPACING.lg, maxWidth: '85%' },
  msgMine: { alignSelf: 'flex-end', justifyContent: 'flex-end' },
  msgTheirs: { alignSelf: 'flex-start', justifyContent: 'flex-start' },
  
  avatarTheirs: { width: 32, height: 32, borderRadius: 16, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm, marginBottom: 20 },
  avatarText: { color: COLORS.primaryDark, fontWeight: '800', fontSize: 14 },
  
  msgContent: { flex: 1 },
  msgBubble: { paddingHorizontal: SPACING.lg, paddingVertical: 12, borderRadius: 20, ...SHADOWS.sm },
  bubbleMine: { backgroundColor: COLORS.primary, borderBottomRightRadius: 4 },
  bubbleTheirs: { backgroundColor: COLORS.surface, borderBottomLeftRadius: 4, borderWidth: 1, borderColor: COLORS.border },
  
  msgText: { fontSize: 15, lineHeight: 22 },
  textMine: { color: COLORS.white, fontWeight: '500' },
  textTheirs: { color: COLORS.textPrimary, fontWeight: '500' },
  
  msgTime: { fontSize: 10, color: COLORS.textTertiary, marginTop: 6, fontWeight: '600' },
  
  inputContainer: {
    padding: SPACING.md, paddingBottom: Platform.OS === 'ios' ? 30 : SPACING.md,
    backgroundColor: COLORS.surface, borderTopWidth: 1, borderTopColor: COLORS.border,
  },
  inputWrapper: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: COLORS.background, borderRadius: 24,
    paddingHorizontal: SPACING.sm, paddingVertical: 8, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm
  },
  attachBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  input: { flex: 1, fontSize: 15, color: COLORS.textPrimary, maxHeight: 100, minHeight: 40, paddingTop: 10, paddingBottom: 10, fontWeight: '500' },
  sendBtn: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginLeft: 8, marginBottom: 2 },
  sendBtnDisabled: { backgroundColor: COLORS.border },
});

export default ChatScreen;
