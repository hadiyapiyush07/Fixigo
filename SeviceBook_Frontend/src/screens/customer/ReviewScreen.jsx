// src/screens/customer/ReviewScreen.jsx
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS } from '../../theme/typography';

const ReviewScreen = ({ route }) => {
  const { bookingId, providerId } = route?.params || {};
  const [rating, setRating] = useState('5');
  const [comment, setComment] = useState('');

  const submitReview = async () => {
    try {
      // TODO: call review API if you have one
      Alert.alert('Success', 'Review submitted');
    } catch (e) {
      console.log(e);
      Alert.alert('Error', 'Could not submit review');
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Review</Text>
      <Text style={styles.text}>Booking ID: {bookingId}</Text>
      <Text style={styles.text}>Provider ID: {providerId}</Text>

      <TextInput style={styles.input} value={rating} onChangeText={setRating} placeholder="Rating" keyboardType="numeric" />
      <TextInput style={[styles.input, styles.textArea]} value={comment} onChangeText={setComment} placeholder="Write review..." multiline />

      <TouchableOpacity style={styles.btn} onPress={submitReview}>
        <Text style={styles.btnText}>Submit Review</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background, padding: SPACING.xl, justifyContent: 'center' },
  title: { fontSize: FONT_SIZES.xl, fontWeight: '700', marginBottom: SPACING.md },
  text: { marginBottom: 8, color: COLORS.textPrimary },
  input: { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.md, padding: SPACING.md, marginTop: SPACING.md },
  textArea: { height: 110, textAlignVertical: 'top' },
  btn: { backgroundColor: COLORS.primary, padding: SPACING.lg, borderRadius: BORDER_RADIUS.lg, alignItems: 'center', marginTop: SPACING.lg },
  btnText: { color: COLORS.white, fontWeight: '700' },
});

export default ReviewScreen;