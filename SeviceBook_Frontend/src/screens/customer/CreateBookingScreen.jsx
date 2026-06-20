// src/screens/customer/CreateBookingScreen.jsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';

// Instant booking — no date/time selection needed.
// The backend auto-sets scheduledDate = now, scheduledTime = 'Instant'

const CreateBookingScreen = ({ navigation, route }) => {
  const categoryId    = route?.params?.categoryId;
  const categoryName  = route?.params?.categoryName  || 'Service';
  const subService    = route?.params?.subService;
  const subServices   = route?.params?.subServices || (subService ? [subService] : []);

  const basePrice     = route?.params?.basePrice || subServices.reduce((sum, s) => sum + s.price, 0) || 499;
  const totalDuration = route?.params?.duration || subServices.reduce((sum, s) => sum + (s.duration || 60), 0) || 60;

  // ── Form state ─────────────────────────────────────────────────────────
  const [addressLine,  setAddressLine]  = useState('');
  const [city,         setCity]         = useState('Surat');
  const [pincode,      setPincode]      = useState('');
  // Instant booking: no date/time chosen by user
  const [notes,        setNotes]        = useState('');
  const [couponCode,   setCouponCode]   = useState('');
  const [discount,     setDiscount]     = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  
  // Optional Images
  const [images, setImages] = useState([]); // array of base64/uri
  const [imageUris, setImageUris] = useState([]); // for preview
  const [errors, setErrors] = useState({});

  const handlePickImage = () => {
    if (imageUris.length >= 3) {
      Alert.alert('Limit Reached', 'You can upload a maximum of 3 images.');
      return;
    }

    launchImageLibrary({
      mediaType: 'photo',
      includeBase64: true,
      quality: 0.5,
    }, (response) => {
      if (response.didCancel) return;
      if (response.errorMessage) {
        Alert.alert('Image Pick Error', response.errorMessage);
        return;
      }
      const asset = response.assets?.[0];
      if (asset) {
        const base64Str = `data:${asset.type};base64,${asset.base64}`;
        setImages(prev => [...prev, base64Str]);
        setImageUris(prev => [...prev, asset.uri]);
      }
    });
  };

  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageUris(prev => prev.filter((_, i) => i !== index));
  };

  const handleApplyCoupon = () => {
    if (couponApplied) {
      setDiscount(0);
      setCouponCode('');
      setCouponApplied(false);
      Alert.alert('Coupon Removed', 'Promo code removed successfully.');
      return;
    }

    const code = couponCode.trim().toUpperCase();
    if (code === 'FIXIGO50') {
      setDiscount(50);
      setCouponApplied(true);
      Alert.alert('🎉 Promo Applied', 'Rs. 50 discount applied successfully!');
    } else if (code === 'WELCOME100') {
      if (basePrice < 300) {
        Alert.alert('Coupon Error', 'WELCOME100 requires a minimum booking amount of Rs. 300.');
        return;
      }
      setDiscount(100);
      setCouponApplied(true);
      Alert.alert('🎉 Promo Applied', 'Rs. 100 discount applied successfully!');
    } else {
      Alert.alert('Invalid Coupon', 'The promo code entered is invalid or expired.');
    }
  };

  const validate = () => {
    const e = {};
    if (!addressLine.trim())            e.address = 'Address is required';
    if (!city.trim())                   e.city    = 'City is required';
    if (!pincode || pincode.length < 6) e.pincode = 'Enter valid 6-digit pincode';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleProceedToSummary = () => {
    if (!validate()) {
      Alert.alert('Validation Error', 'Please complete all required fields.');
      return;
    }

    if (!categoryId) {
      Alert.alert('Error', 'Service category missing. Please go back and try again.');
      return;
    }

    // Compute prices
    const taxes = Math.round(basePrice * 0.18); // 18% GST
    const convenienceFee = 50;
    const totalAmount = Math.max(0, basePrice + taxes + convenienceFee - discount);

    navigation.navigate('BookingSummary', {
      categoryId,
      categoryName,
      subServices,
      subService: {
        name: subServices.map(s => s.name).join(', '),
        price: basePrice,
        duration: totalDuration
      },
      // Instant booking — no scheduledDate/scheduledTime from frontend
      notes: notes.trim(),
      address: {
        addressLine: addressLine.trim(),
        city: city.trim(),
        pincode: pincode.trim(),
        location: {
          type: 'Point',
          coordinates: [72.8311, 21.1702] // Default Surat coords
        }
      },
      couponCode: couponApplied ? couponCode.trim().toUpperCase() : null,
      images,
      pricing: {
        baseAmount: basePrice,
        taxes,
        convenienceFee,
        discount,
        totalAmount
      }
    });
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: COLORS.background }}
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
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Booking Details</Text>
            <Text style={styles.headerSub}>{categoryName} - {subService?.name || 'General'}</Text>
          </View>
          <Text style={styles.headerIcon}>📋</Text>
        </View>

        {/* Address */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Service Address *</Text>

          <Text style={styles.label}>House / Flat / Street *</Text>
          <TextInput
            style={[styles.input, errors.address && styles.inputError]}
            placeholder="e.g. B-204, Sunrise Apartment, Near City Mall"
            placeholderTextColor={COLORS.textTertiary}
            value={addressLine}
            onChangeText={v => { setAddressLine(v); if (errors.address) setErrors(p => ({ ...p, address: null })); }}
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
                onChangeText={v => { setCity(v); if (errors.city) setErrors(p => ({ ...p, city: null })); }}
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
                onChangeText={v => { setPincode(v); if (errors.pincode) setErrors(p => ({ ...p, pincode: null })); }}
                keyboardType="numeric"
                maxLength={6}
              />
              {errors.pincode && <Text style={styles.errorText}>{errors.pincode}</Text>}
            </View>
          </View>
        </View>

        {/* Optional Images */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📸 Upload Reference Images (Optional)</Text>
          <Text style={styles.subtext}>Add up to 3 photos of the issue to help the provider:</Text>
          
          <View style={styles.imagePickerRow}>
            {imageUris.map((uri, idx) => (
              <View key={uri} style={styles.thumbWrapper}>
                <Image source={{ uri }} style={styles.thumbnail} />
                <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveImage(idx)}>
                  <Text style={styles.removeBtnText}>✕</Text>
                </TouchableOpacity>
              </View>
            ))}
            {imageUris.length < 3 && (
              <TouchableOpacity style={styles.pickerBtn} onPress={handlePickImage}>
                <Text style={{ fontSize: 28, color: COLORS.textTertiary }}>+</Text>
                <Text style={styles.pickerLabel}>Upload</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Coupon Code */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>🏷 Coupon Code (Optional)</Text>
          <View style={styles.couponRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginTop: 0 }]}
              placeholder="e.g. FIXIGO50, WELCOME100"
              placeholderTextColor={COLORS.textTertiary}
              value={couponCode}
              onChangeText={setCouponCode}
              autoCapitalize="characters"
              editable={!couponApplied}
            />
            <TouchableOpacity
              style={[styles.applyBtn, couponApplied && styles.applyBtnActive]}
              onPress={handleApplyCoupon}
            >
              <Text style={styles.applyBtnText}>{couponApplied ? 'Remove' : 'Apply'}</Text>
            </TouchableOpacity>
          </View>
          {couponApplied && (
            <Text style={styles.appliedText}>✓ Coupon applied! Saved ₹{discount}</Text>
          )}
        </View>

        {/* Notes */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>📝 Additional Notes (Optional)</Text>
          <TextInput
            style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
            placeholder="Any specific requirements or instructions..."
            placeholderTextColor={COLORS.textTertiary}
            value={notes}
            onChangeText={setNotes}
            multiline
          />
        </View>

        {/* Proceed Button */}
        <TouchableOpacity
          style={styles.confirmBtn}
          onPress={handleProceedToSummary}
          activeOpacity={0.85}
        >
          <Text style={styles.confirmBtnText}>Proceed to Summary  →</Text>
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
    gap:             SPACING.md,
    backgroundColor: COLORS.primary,
    borderRadius:    BORDER_RADIUS.xl,
    padding:         SPACING.xl,
    marginBottom:    SPACING.xl,
    ...SHADOWS.md,
  },
  backBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 24, color: COLORS.white, fontWeight: '300', lineHeight: 26 },
  headerTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.white },
  headerSub:   { fontSize: FONT_SIZES.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2 },
  headerIcon:  { fontSize: 36 },

  section:      { backgroundColor: COLORS.white, borderRadius: BORDER_RADIUS.lg, padding: SPACING.lg, marginBottom: SPACING.lg, ...SHADOWS.sm },
  sectionTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.md },
  subtext:      { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginBottom: SPACING.md },

  dateRow:             { gap: SPACING.sm, paddingRight: SPACING.md },
  dateChip:            { paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, borderRadius: BORDER_RADIUS.lg, borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', minWidth: 82 },
  dateChipActive:      { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  dateChipLabel:       { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.textPrimary },
  dateChipDay:         { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2 },
  dateChipLabelActive: { color: COLORS.primary },

  timeGrid:           { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.sm },
  timeChip:           { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border, backgroundColor: COLORS.background },
  timeChipActive:     { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  timeChipText:       { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  timeChipTextActive: { color: COLORS.primary, fontWeight: '700' },

  label:      { fontSize: FONT_SIZES.sm, fontWeight: '500', color: COLORS.textSecondary, marginBottom: 6, marginTop: SPACING.md },
  input:      { backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  inputError: { borderColor: COLORS.error },
  rowInputs:  { flexDirection: 'row' },
  errorText:  { fontSize: FONT_SIZES.xs, color: COLORS.error, marginTop: 4 },

  imagePickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  pickerBtn: { width: 75, height: 75, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed', backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center' },
  pickerLabel: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '500' },
  thumbWrapper: { position: 'relative', width: 75, height: 75 },
  thumbnail: { width: '100%', height: '100%', borderRadius: BORDER_RADIUS.md },
  removeBtn: { position: 'absolute', top: -6, right: -6, width: 20, height: 20, borderRadius: 10, backgroundColor: COLORS.error, alignItems: 'center', justifyContent: 'center' },
  removeBtnText: { color: COLORS.white, fontSize: 10, fontWeight: '700' },

  couponRow: { flexDirection: 'row', gap: SPACING.sm, alignItems: 'center' },
  applyBtn: { backgroundColor: COLORS.primary, paddingHorizontal: SPACING.xl, paddingVertical: 12, borderRadius: BORDER_RADIUS.md },
  applyBtnActive: { backgroundColor: COLORS.textSecondary },
  applyBtnText: { color: COLORS.white, fontWeight: '700', fontSize: FONT_SIZES.md },
  appliedText: { fontSize: FONT_SIZES.xs, color: COLORS.success, fontWeight: '600', marginTop: SPACING.xs },

  confirmBtn:     { backgroundColor: COLORS.primary, paddingVertical: SPACING.lg + 2, borderRadius: BORDER_RADIUS.lg, alignItems: 'center', ...SHADOWS.md },
  confirmBtnText: { color: COLORS.white, fontSize: FONT_SIZES.lg, fontWeight: '700' },
});

export default CreateBookingScreen;