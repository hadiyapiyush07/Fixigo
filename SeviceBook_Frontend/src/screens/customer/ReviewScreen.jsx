import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  TextInput, Alert, ActivityIndicator,
  KeyboardAvoidingView, Platform, ScrollView,
} from 'react-native';
import { bookingAPI } from '../../api/booking.api';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';
import api from '../../api/axiosInstance';
import { CommonActions } from '@react-navigation/native';
import Animated, { FadeInUp, FadeIn, ZoomIn, SlideInDown, Layout } from 'react-native-reanimated';
import { Star, Check, X, ChevronLeft, ThumbsUp } from 'lucide-react-native';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { Card } from '../../components/ui/Card';

const RATING_LABELS = {
  1: 'Poor',
  2: 'Below Average',
  3: 'Good',
  4: 'Very Good',
  5: 'Excellent!',
};

const QUICK_REVIEWS = [
  'Work was done perfectly',
  'Very professional',
  'Arrived on time',
  'Very clean and tidy',
  'Good communication',
  'Value for money',
  'Will book again',
];

const ReviewScreen = ({ route, navigation }) => {
  const bookingId  = route?.params?.bookingId;
  const providerId = route?.params?.providerId;

  const [rating,   setRating]   = useState(5);
  const [comment,  setComment]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [selected, setSelected] = useState([]);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const toggleTag = (tag) => {
    setSelected(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSubmit = async () => {
    if (!bookingId || !providerId) return Alert.alert('Error', 'Missing booking or provider info');

    const finalComment = [...selected, comment.trim()].filter(Boolean).join('. ');

    try {
      setLoading(true);
      await api.post(`/bookings/${bookingId}/review`, {
        rating, reviewText: finalComment || `Rated ${rating} stars`,
      });
      setIsSubmitted(true);
      setTimeout(() => {
        navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'CustomerTabs', params: { screen: 'Home' } }] }));
      }, 2500);
    } catch (e) {
      console.log('Review error');
      setIsSubmitted(true);
      setTimeout(() => {
        navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'CustomerTabs', params: { screen: 'Home' } }] }));
      }, 2500);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: COLORS.background }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      {!isSubmitted && (
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <ChevronLeft size={28} color={COLORS.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Leave a Review</Text>
          <View style={{ width: 44 }} />
        </View>
      )}

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
        {isSubmitted ? (
          <Animated.View entering={FadeIn.duration(400)} style={styles.successContainer}>
            <Animated.View entering={ZoomIn.delay(200).springify()} style={styles.successIconBox}>
              <ThumbsUp size={64} color={COLORS.white} />
            </Animated.View>
            <Animated.Text entering={SlideInDown.delay(400)} style={styles.successTitle}>Thank You!</Animated.Text>
            <Animated.Text entering={SlideInDown.delay(500)} style={styles.successMessage}>Your feedback helps us provide the best experience.</Animated.Text>
          </Animated.View>
        ) : (
          <>
            {/* Star Rating */}
            <Animated.View entering={FadeInUp.delay(100).springify()}>
              <Card style={styles.cardCenter}>
                <Text style={styles.sectionTitle}>How was the service?</Text>
                <View style={styles.starsRow}>
                  {[1, 2, 3, 4, 5].map(i => (
                    <TouchableOpacity key={i} onPress={() => setRating(i)} activeOpacity={0.7} style={{ padding: 4 }}>
                      <Star size={42} color={i <= rating ? '#F39C12' : COLORS.border} fill={i <= rating ? '#F39C12' : 'transparent'} />
                    </TouchableOpacity>
                  ))}
                </View>
                <Text style={styles.ratingLabel}>{RATING_LABELS[rating]}</Text>
              </Card>
            </Animated.View>

            {/* Quick Tags */}
            <Animated.View entering={FadeInUp.delay(200).springify()}>
              <Text style={styles.subTitle}>What went well? (Optional)</Text>
              <View style={styles.tagsRow}>
                {QUICK_REVIEWS.map(tag => {
                  const isActive = selected.includes(tag);
                  return (
                    <TouchableOpacity key={tag} style={[styles.tag, isActive && styles.tagActive]} onPress={() => toggleTag(tag)} activeOpacity={0.8}>
                      {isActive && <Check size={14} color={COLORS.primaryDark} style={{ marginRight: 4 }} />}
                      <Text style={[styles.tagText, isActive && styles.tagTextActive]}>{tag}</Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </Animated.View>

            {/* Written Comment */}
            <Animated.View entering={FadeInUp.delay(300).springify()}>
              <Text style={[styles.subTitle, { marginTop: SPACING.lg }]}>Add a Comment (Optional)</Text>
              <TextInput
                style={styles.commentInput}
                value={comment}
                onChangeText={setComment}
                placeholder="Share your experience with this provider..."
                placeholderTextColor={COLORS.textTertiary}
                multiline
                numberOfLines={4}
                maxLength={500}
              />
              <Text style={styles.charCount}>{comment.length}/500</Text>
            </Animated.View>

            <View style={{ height: 100 }} />
          </>
        )}
      </ScrollView>

      {/* Submit */}
      {!isSubmitted && (
        <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.bottomBar}>
          <PrimaryButton title="Submit Review" onPress={handleSubmit} loading={loading} />
          <TouchableOpacity 
            style={styles.skipBtn} 
            onPress={() => navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'CustomerTabs', params: { screen: 'Home' } }] }))}
            disabled={loading}
          >
            <Text style={styles.skipBtnText}>Skip for now</Text>
          </TouchableOpacity>
        </Animated.View>
      )}
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: SPACING.lg, paddingTop: Platform.OS === 'ios' ? 60 : SPACING.xxl, paddingBottom: SPACING.md 
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm },
  headerTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary },

  content: { padding: SPACING.xl },
  cardCenter: { alignItems: 'center', paddingVertical: SPACING.xxl, marginBottom: SPACING.xl },
  sectionTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.lg },
  
  starsRow: { flexDirection: 'row', justifyContent: 'center', gap: SPACING.sm, marginBottom: SPACING.md },
  ratingLabel: { textAlign: 'center', fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.primary },

  subTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textSecondary, marginBottom: SPACING.md },
  
  tagsRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  tag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderRadius: BORDER_RADIUS.round, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.surface },
  tagActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  tagText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '600' },
  tagTextActive: { color: COLORS.primaryDark, fontWeight: '700' },

  commentInput: { backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, fontSize: FONT_SIZES.md, color: COLORS.textPrimary, textAlignVertical: 'top', minHeight: 120, borderWidth: 1, borderColor: COLORS.border },
  charCount: { textAlign: 'right', fontSize: FONT_SIZES.xs, color: COLORS.textTertiary, marginTop: 4, fontWeight: '600' },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.surface, padding: SPACING.xl, paddingBottom: Platform.OS === 'ios' ? 32 : SPACING.xl, ...SHADOWS.lg },
  skipBtn: { alignItems: 'center', marginTop: SPACING.md },
  skipBtnText: { fontSize: FONT_SIZES.md, color: COLORS.textTertiary, fontWeight: '600' },

  successContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', minHeight: 400, marginTop: SPACING.xxl },
  successIconBox: { width: 120, height: 120, borderRadius: 60, backgroundColor: COLORS.primary, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.xl, ...SHADOWS.md },
  successTitle: { fontSize: 28, fontWeight: '900', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  successMessage: { fontSize: FONT_SIZES.md, color: COLORS.textSecondary, textAlign: 'center', maxWidth: 250, lineHeight: 22 },
});

export default ReviewScreen;