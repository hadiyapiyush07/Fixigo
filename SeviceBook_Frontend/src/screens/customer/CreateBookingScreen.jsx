// src/screens/customer/CreateBookingScreen.jsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform,
} from 'react-native';
import { bookingAPI } from '../../api/booking.api';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';

// Time slots for scheduling
const TIME_SLOTS = [
  '08:00 AM', '09:00 AM', '10:00 AM', '11:00 AM',
  '12:00 PM', '01:00 PM', '02:00 PM', '03:00 PM',
  '04:00 PM', '05:00 PM', '06:00 PM', '07:00 PM',
];

// Quick date options
const getDateOptions = () => {
  const options = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() + i);
    options.push({
      label: i === 0 ? 'Today' : i === 1 ? 'Tomorrow' : d.toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' }),
      value: d.toISOString().split('T')[0],
      full:  d.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    });
  }
  return options;
};

const CreateBookingScreen = ({ navigation, route }) => {
  const providerId  = route?.params?.providerId;
  const categoryId  = route?.params?.categoryId;
  const providerName= route?.params?.providerName || 'Provider';

  const [loading,      setLoading]      = useState(false);
  const [addressLine,  setAddressLine]  = useState('');
  const [city,         setCity]         = useState('Surat');
  const [pincode,      setPincode]      = useState('');
  const [selectedDate, setSelectedDate] = useState(getDateOptions()[0].value);
  const [selectedTime, setSelectedTime] = useState('10:00 AM');
  const [notes,        setNotes]        = useState('');
  const [errors,       setErrors]       = useState({});

  const dateOptions = getDateOptions();

  const validate = () => {
    const e = {};
    if (!addressLine.trim())           e.address = 'Address is required';
    if (!city.trim())                  e.city    = 'City is required';
    if (!pincode || pincode.length < 6) e.pincode = 'Enter valid 6-digit pincode';
    if (!selectedDate)                 e.date    = 'Please select a date';
    if (!selectedTime)                 e.time    = 'Please select a time slot';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleConfirmBooking = async () => {
    if (!validate()) return;

    if (!providerId || !categoryId) {
      Alert.alert('Error', 'Missing booking information. Please go back and try again.');
      return;
    }

    try {
      setLoading(true);

      const payload = {
        categoryId,
        scheduledDate: selectedDate,
        scheduledTime: selectedTime,
        address: {
          addressLine: addressLine.trim(),
          city:        city.trim(),
          pincode:     pincode.trim(),
          location: {
            type:        'Point',
            coordinates: [72.8311, 21.1702], // default Surat — replace with GPS
          },
        },
        description: notes.trim(),
        subService: {
          name:  'General Service',
          price: 499,
        },
        pricing: {
          baseAmount:     499,
          convenienceFee: 49,
          discount:       0,
          totalAmount:    548,
        },
      };

      const res       = await bookingAPI.create(payload);
      const booking   = res?.data?.data || res?.data;
      const bookingId = booking?._id;

      if (!bookingId) throw new Error('Booking creation failed');

      Alert.alert(
        '🎉 Booking Created!',
        'We are finding the best provider near you. You will be notified once confirmed.',
        [{ text: 'Track Booking', onPress: () => navigation.navigate('BookingTrack', { bookingId }) }]
      );
    } catch (e) {
      console.log('Booking error:', e);
      Alert.alert('Booking Failed', e?.response?.data?.message || e.message || 'Please try again');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.headerCard}>
          <Text style={styles.headerIcon}>📋</Text>
          <View>
            <Text style={styles.headerTitle}>Book Service</Text>
            <Text style={styles.headerSub}>with {providerName}</Text>
          </View>
        </View>

        {/* Date Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📅 Select Date</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.dateRow}>
            {dateOptions.map(d => (
              <TouchableOpacity
                key={d.value}
                style={[styles.dateChip, selectedDate === d.value && styles.dateChipActive]}
                onPress={() => setSelectedDate(d.value)}
              >
                <Text style={[styles.dateChipLabel, selectedDate === d.value && styles.dateChipLabelActive]}>
                  {d.label}
                </Text>
                <Text style={[styles.dateChipSub, selectedDate === d.value && styles.dateChipLabelActive]}>
                  {d.full}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {errors.date && <Text style={styles.errorText}>{errors.date}</Text>}
        </View>

        {/* Time Slot Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>⏰ Select Time Slot</Text>
          <View style={styles.timeGrid}>
            {TIME_SLOTS.map(t => (
              <TouchableOpacity
                key={t}
                style={[styles.timeChip, selectedTime === t && styles.timeChipActive]}
                onPress={() => setSelectedTime(t)}
              >
                <Text style={[styles.timeChipText, selectedTime === t && styles.timeChipTextActive]}>
                  {t}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
          {errors.time && <Text style={styles.errorText}>{errors.time}</Text>}
        </View>

        {/* Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Service Address</Text>

          <Text style={styles.label}>House / Flat / Street *</Text>
          <TextInput
            style={[styles.input, errors.address && styles.inputError]}
            placeholder="e.g. B-204, Sunrise Apartment, Near City Mall"
            placeholderTextColor={COLORS.textTertiary}
            value={addressLine}
            onChangeText={setAddressLine}
            multiline
            numberOfLines={2}
          />
          {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}

          <View style={styles.rowInputs}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>City *</Text>
              <TextInput
                style={[styles.input, errors.city && styles.inputError]}
                placeholder="Surat"
                placeholderTextColor={COLORS.textTertiary}
                value={city}
                onChangeText={setCity}
              />
              {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}
            </View>
            <View style={{ width: SPACING.md }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Pincode *</Text>
              <TextInput
                style={[styles.input, errors.pincode && styles.inputError]}
                placeholder="395001"
                placeholderTextColor={COLORS.textTertiary}
                value={pincode}
                onChangeText={setPincode}
                keyboardType="numeric"
                maxLength={6}
              />
              {errors.pincode && <Text style={styles.errorText}>{errors.pincode}</Text>}
            </View>
          </View>
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Special Instructions (Optional)</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder="Any specific requirements or instructions for the provider..."
            placeholderTextColor={COLORS.textTertiary}
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>

        {/* Price Summary */}
        <View style={styles.priceCard}>
          <Text style={styles.priceSectionTitle}>💰 Price Summary</Text>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Base Amount</Text>
            <Text style={styles.priceValue}>₹499</Text>
          </View>
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Convenience Fee</Text>
            <Text style={styles.priceValue}>₹49</Text>
          </View>
          <View style={styles.priceDivider} />
          <View style={styles.priceRow}>
            <Text style={styles.priceTotalLabel}>Total Amount</Text>
            <Text style={styles.priceTotalValue}>₹548</Text>
          </View>
          <Text style={styles.paymentNote}>💵 Pay after service is completed</Text>
        </View>

        {/* Confirm Button */}
        <TouchableOpacity
          style={[styles.confirmBtn, loading && { opacity: 0.7 }]}
          onPress={handleConfirmBooking}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading
            ? <ActivityIndicator color={COLORS.white} />
            : <Text style={styles.confirmBtnText}>Confirm Booking →</Text>
          }
        </TouchableOpacity>

        <View style={{ height: SPACING.xxxl }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  content:   { padding: SPACING.xl },

  headerCard: {
    flexDirection:   'row',
    alignItems:      'center',
    gap:             SPACING.lg,
    backgroundColor: COLORS.primary,
    borderRadius:    BORDER_RADIUS.xl,
    padding:         SPACING.xl,
    marginBottom:    SPACING.xl,
  },
  headerIcon:  { fontSize: 40 },
  headerTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.white },
  headerSub:   { fontSize: FONT_SIZES.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2 },

  section:      { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg, ...SHADOWS.sm },
  sectionTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },

  dateRow:          { gap: SPACING.sm, paddingRight: SPACING.md },
  dateChip:         { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.lg, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', minWidth: 80 },
  dateChipActive:   { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  dateChipLabel:    { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.textPrimary },
  dateChipSub:      { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  dateChipLabelActive: { color: COLORS.primary },

  timeGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  timeChip:          { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background },
  timeChipActive:    { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  timeChipText:      { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  timeChipTextActive:{ color: COLORS.primary, fontWeight: '700' },

  label:      { fontSize: FONT_SIZES.sm, fontWeight: '500', color: COLORS.textSecondary, marginBottom: 6, marginTop: SPACING.md },
  input:      { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  inputError: { borderColor: COLORS.error },
  rowInputs:  { flexDirection: 'row' },
  errorText:  { fontSize: FONT_SIZES.xs, color: COLORS.error, marginTop: 4 },

  priceCard:        { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg, borderWidth: 1, borderColor: COLORS.border, ...SHADOWS.sm },
  priceSectionTitle:{ fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  priceRow:         { flexDirection: 'row', justifyContent: 'space-between', marginBottom: SPACING.sm },
  priceLabel:       { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  priceValue:       { fontSize: FONT_SIZES.sm, color: COLORS.textPrimary, fontWeight: '500' },
  priceDivider:     { height: 1, backgroundColor: COLORS.border, marginVertical: SPACING.sm },
  priceTotalLabel:  { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary },
  priceTotalValue:  { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.primary },
  paymentNote:      { fontSize: FONT_SIZES.xs, color: COLORS.success, marginTop: SPACING.sm, textAlign: 'center' },

  confirmBtn:     { backgroundColor: COLORS.primary, paddingVertical: SPACING.lg + 2, borderRadius: BORDER_RADIUS.lg, alignItems: 'center', ...SHADOWS.md },
  confirmBtnText: { color: COLORS.white, fontSize: FONT_SIZES.lg, fontWeight: '700' },
});

export default CreateBookingScreen;