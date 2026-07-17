import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, Animated as RNAnimated, Platform
} from 'react-native';
import Animated, { FadeInUp, FadeIn, Layout, SlideOutRight } from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';
import { Bell, CheckCircle2, XCircle, CreditCard, Calendar, Star, Trash2, Check, BellRing } from 'lucide-react-native';
import { notificationAPI } from '../../api/notification.api';
import { socketService } from '../../services/socket.service';
import { useFocusEffect } from '@react-navigation/native';
import Skeleton from '../../components/Skeleton';
import { Card } from '../../components/ui/Card';

const getIconForType = (type, read) => {
  const color = read ? COLORS.textTertiary : COLORS.primary;
  if (type === 'booking_confirmed') return { icon: <CheckCircle2 size={24} color={color} /> };
  if (type === 'booking_completed') return { icon: <Star size={24} color={color} /> };
  if (type === 'booking_cancelled') return { icon: <XCircle size={24} color={read ? COLORS.textTertiary : COLORS.danger} /> };
  if (type === 'payment_success') return { icon: <CreditCard size={24} color={color} /> };
  if (type === 'booking_request') return { icon: <Calendar size={24} color={color} /> };
  return { icon: <Bell size={24} color={color} /> };
};

const getTimeAgo = (dateStr) => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins < 1)   return `Just now`;
  if (mins < 60)  return `${mins}m`;
  if (hours < 24) return `${hours}h`;
  return `${days}d`;
};

const NotificationsScreen = ({ navigation }) => {
  const [notifications, setNotifications] = useState([]);
  const [isLoaded, setIsLoaded] = useState(false);

  const fetchNotifications = async () => {
    try {
      const res = await notificationAPI.getMine();
      setNotifications(res.data.data || []);
    } catch (e) {
      console.log('Error fetching notifications');
    } finally {
      setIsLoaded(true);
    }
  };

  useFocusEffect(
    React.useCallback(() => {
      fetchNotifications();
      socketService.on('notification:new', fetchNotifications);
      socketService.on('booking:status_update', fetchNotifications);
      return () => {
        socketService.off('notification:new', fetchNotifications);
        socketService.off('booking:status_update', fetchNotifications);
      };
    }, [])
  );

  const markAllRead = async () => {
    try {
      await notificationAPI.markAllRead();
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
    } catch (e) { console.log('Error marking all read'); }
  };

  const deleteNotification = async (id) => {
    try {
      await notificationAPI.delete(id);
      setNotifications(prev => prev.filter(n => n._id !== id));
    } catch (e) { console.log('Error deleting notification'); }
  };

  const unreadCount = notifications.filter(n => !n.read).length;
  const rowRefs = new Map();

  const renderRightActions = (progress, dragX, id) => {
    const scale = dragX.interpolate({ inputRange: [-80, 0], outputRange: [1, 0.5], extrapolate: 'clamp' });
    return (
      <TouchableOpacity style={styles.deleteAction} onPress={() => deleteNotification(id)}>
        <RNAnimated.View style={{ transform: [{ scale }], alignItems: 'center' }}>
          <Trash2 size={24} color={COLORS.white} />
          <Text style={styles.deleteActionText}>Delete</Text>
        </RNAnimated.View>
      </TouchableOpacity>
    );
  };

  const NotifItem = ({ item, index }) => {
    const styleInfo = getIconForType(item.type, item.read);
    
    return (
      <Animated.View entering={FadeInUp.delay(index * 50).springify()} layout={Layout.springify()} exiting={SlideOutRight}>
        <Swipeable
          ref={ref => { if (ref && !rowRefs.has(item._id)) rowRefs.set(item._id, ref); }}
          renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item._id)}
          onSwipeableWillOpen={() => { [...rowRefs.entries()].forEach(([key, ref]) => { if (key !== item._id && ref) ref.close(); }); }}
          friction={2} rightThreshold={40}
        >
          <TouchableOpacity
            style={[styles.card, !item.read && styles.cardUnread]}
            onPress={async () => {
              if (!item.read) {
                try {
                  await notificationAPI.markRead(item._id);
                  setNotifications(prev => prev.map(n => n._id === item._id ? { ...n, read: true } : n));
                } catch (e) { console.log('Error marking read'); }
              }
            }}
            activeOpacity={0.9}
          >
            <View style={styles.iconBox}>{styleInfo.icon}</View>
            <View style={styles.content}>
              <View style={styles.cardHeader}>
                <Text style={[styles.title, !item.read && styles.titleUnread]} numberOfLines={1}>{item.title}</Text>
                <View style={styles.rightSide}>
                  <Text style={styles.time}>{getTimeAgo(item.createdAt)}</Text>
                  {!item.read && <View style={styles.unreadDot} />}
                </View>
              </View>
              <Text style={[styles.body, !item.read && styles.bodyUnread]} numberOfLines={2}>{item.message || item.body}</Text>
            </View>
          </TouchableOpacity>
        </Swipeable>
      </Animated.View>
    );
  };

  if (!isLoaded) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <View style={{ padding: SPACING.lg, gap: SPACING.md }}>
          {[1, 2, 3, 4, 5].map(i => (
            <View key={i} style={styles.skeletonCard}>
              <Skeleton width={48} height={48} borderRadius={24} style={{ marginRight: SPACING.md }} />
              <View style={{ flex: 1, gap: 8 }}>
                <Skeleton width="70%" height={16} />
                <Skeleton width="100%" height={12} />
              </View>
            </View>
          ))}
        </View>
      </View>
    );
  }

  if (notifications.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Notifications</Text>
        </View>
        <Animated.View entering={FadeIn.duration(600)} style={styles.emptyContainer}>
          <View style={styles.emptyIconBox}>
            <BellRing size={48} color={COLORS.primary} />
          </View>
          <Text style={styles.emptyTitle}>All Caught Up!</Text>
          <Text style={styles.emptySubtitle}>You have no new notifications right now.</Text>
        </Animated.View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Notifications</Text>
          {unreadCount > 0 && <Text style={styles.unreadText}>{unreadCount} unread</Text>}
        </View>
        {unreadCount > 0 && (
          <TouchableOpacity onPress={markAllRead} style={styles.markAllBtn}>
            <Check size={16} color={COLORS.primaryDark} />
            <Text style={styles.markAllText}>Mark all read</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={notifications}
        keyExtractor={item => item._id}
        renderItem={({ item, index }) => <NotifItem item={item} index={index} />}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: COLORS.background },
  header: { 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', 
    paddingHorizontal: SPACING.xl, paddingTop: Platform.OS === 'ios' ? 60 : SPACING.xxl, 
    paddingBottom: SPACING.md, backgroundColor: COLORS.background 
  },
  headerTitle: { fontSize: 32, fontWeight: '900', color: COLORS.textPrimary, letterSpacing: -0.5 },
  unreadText:  { fontSize: FONT_SIZES.sm, color: COLORS.primary, marginTop: 4, fontWeight: '700' },
  markAllBtn:  { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.primaryLight, paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, gap: 4 },
  markAllText: { fontSize: FONT_SIZES.sm, color: COLORS.primaryDark, fontWeight: '700' },

  list: { padding: SPACING.lg, paddingBottom: 100 },

  card: { 
    flexDirection: 'row', backgroundColor: COLORS.surface,
    padding: SPACING.lg, borderRadius: BORDER_RADIUS.lg, 
    borderBottomWidth: 1, borderBottomColor: COLORS.divider,
    marginBottom: SPACING.xs
  },
  cardUnread: { backgroundColor: 'rgba(15, 118, 110, 0.04)' },

  iconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md, borderWidth: 1, borderColor: COLORS.divider },

  content: { flex: 1, justifyContent: 'center' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.textSecondary, flex: 1, marginRight: 8 },
  titleUnread: { fontWeight: '800', color: COLORS.textPrimary },
  
  rightSide: { flexDirection: 'row', alignItems: 'center' },
  time: { fontSize: 12, color: COLORS.textTertiary, fontWeight: '600', marginRight: 6 },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: COLORS.primary },

  body: { fontSize: 14, color: COLORS.textSecondary, lineHeight: 20 },
  bodyUnread: { color: COLORS.textPrimary, fontWeight: '500' },

  deleteAction: { backgroundColor: COLORS.danger, justifyContent: 'center', alignItems: 'center', width: 90, borderRadius: BORDER_RADIUS.lg, marginLeft: SPACING.sm, height: '100%', marginBottom: SPACING.xs },
  deleteActionText: { color: COLORS.white, fontWeight: '700', fontSize: 12, marginTop: 4 },

  skeletonCard: { flexDirection: 'row', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.divider },

  emptyContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: -50 },
  emptyIconBox: { width: 100, height: 100, borderRadius: 50, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl },
  emptyTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  emptySubtitle: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, textAlign: 'center', maxWidth: 250, lineHeight: 22 },
});

export default NotificationsScreen;
