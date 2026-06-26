// src/screens/customer/CreateBookingScreen.jsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, Image,
} from 'react-native';
import Animated, { FadeInUp } from 'react-native-reanimated';
import { launchImageLibrary } from 'react-native-image-picker';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { addressAPI } from '../../api/address.api';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';

const API_URL = 'http://10.87.158.85:5000/api';

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
  const [savedAddresses, setSavedAddresses] = useState([]);

  // Fetch saved addresses
  const fetchSavedAddresses = React.useCallback(async () => {
    try {
      const res = await addressAPI.getAll();
      if (res.data) {
        setSavedAddresses(res.data);
        const def = res.data.find(a => a.isDefault);
        if (def && !addressLine && !city && !pincode) {
          setAddressLine(def.addressLine || '');
          setCity(def.city || 'Surat');
          setPincode(def.pincode || '');
        }
      }
    } catch (e) {
      console.log('Error fetching saved addresses:', e);
    }
  }, [addressLine, city, pincode]);

  useFocusEffect(
    React.useCallback(() => {
      fetchSavedAddresses();
    }, [fetchSavedAddresses])
  );

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

  const { accessToken } = useSelector(state => state.auth);

  const [applyingCoupon, setApplyingCoupon] = useState(false);

  const handleApplyCoupon = async () => {
    if (couponApplied) {
      setDiscount(0);
      setCouponCode('');
      setCouponApplied(false);
      Alert.alert('Coupon Removed', 'Promo code removed successfully.');
      return;
    }

    const code = couponCode.trim().toUpperCase();
    if (!code) {
      Alert.alert('Error', 'Please enter a valid coupon code.');
      return;
    }

    try {
      setApplyingCoupon(true);
      // API call to validate and calculate discount
      const res = await axios.post(`${API_URL}/coupons/apply`, {
        code,
        basePrice
      }, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      
      const { discountAmount, description } = res.data.data;
      
      setDiscount(discountAmount);
      setCouponApplied(true);
      Alert.alert('🎉 Promo Applied', `${description}\n\n₹${discountAmount} discount applied!`);
    } catch (err) {
      const msg = err.response?.data?.message || 'Invalid or expired coupon code.';
      Alert.alert('Coupon Error', msg);
    } finally {
      setApplyingCoupon(false);
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

    // Compute prices (No GST)
    const convenienceFee = basePrice < 200 ? 29 : 49;
    const totalAmount = Math.max(0, basePrice + convenienceFee - discount);

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
        <Animated.View entering={FadeInUp.delay(100).springify()} style={styles.headerCard}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backBtnText}>‹</Text>
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={styles.headerTitle}>Booking Details</Text>
            <Text style={styles.headerSub}>{categoryName} • {subService?.name || 'General'}</Text>
          </View>
        </Animated.View>

        {/* Address */}
        <Animated.View entering={FadeInUp.delay(200).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>📍 Service Address</Text>

          {savedAddresses.length > 0 && (
            <View style={{ marginBottom: SPACING.lg }}>
              <Text style={{ fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginBottom: SPACING.sm }}>Use Saved Address</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: SPACING.md }}>
                {savedAddresses.map(addr => (
                  <TouchableOpacity
                    key={addr._id}
                    style={styles.addressChip}
                    onPress={() => {
                      setAddressLine(addr.addressLine || '');
                      setCity(addr.city || 'Surat');
                      setPincode(addr.pincode || '');
                      setErrors(p => ({ ...p, address: null, city: null, pincode: null }));
                    }}
                  >
                    <Text style={{ fontSize: 16 }}>{(addr.label || addr.type) === 'Home' ? '🏠' : (addr.label || addr.type) === 'Work' ? '🏢' : '📍'}</Text>
                    <Text style={styles.addressChipText}>{addr.label || addr.type || 'Other'}</Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          <Text style={styles.label}>House / Flat / Street *</Text>
          <TextInput
            style={[styles.input, errors.address && styles.inputError]}
            placeholder="e.g. B-204, Sunrise Apartment..."
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
        </Animated.View>

        {/* Optional Images */}
        <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>📸 Reference Photos</Text>
          <Text style={styles.subtext}>Add up to 3 photos of the issue</Text>
          
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
              <TouchableOpacity style={styles.pickerBtn} onPress={handlePickImage} activeOpacity={0.8}>
                <Text style={{ fontSize: 24, color: COLORS.primary }}>+</Text>
                <Text style={styles.pickerLabel}>Add</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>

        {/* Coupon Code */}
        <Animated.View entering={FadeInUp.delay(400).springify()} style={styles.section}>
          <Text style={styles.sectionTitle}>🏷 Promo Code</Text>
          <View style={styles.couponRow}>
            <TextInput
              style={[styles.input, { flex: 1, marginTop: 0 }]}
              placeholder="e.g. FIXIGO50"
              placeholderTextColor={COLORS.textTertiary}
              value={couponCode}
              onChangeText={setCouponCode}
              autoCapitalize="characters"
              editable={!couponApplied}
            />
            <TouchableOpacity
              style={[styles.applyBtn, couponApplied && styles.applyBtnActive, applyingCoupon && { opacity: 0.7 }]}
              onPress={handleApplyCoupon}
              disabled={applyingCoupon}
            >
              {applyingCoupon ? (
                <ActivityIndicator color={couponApplied ? COLORS.white : COLORS.primary} size="small" />
              ) : (
                <Text style={styles.applyBtnText}>{couponApplied ? 'Remove' : 'Apply'}</Text>
              )}
            </TouchableOpacity>
          </View>
          {couponApplied && (
            <Text style={styles.appliedText}>✓ Coupon applied! Saved ₹{discount}</Text>
          )}
        </Animated.View>

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
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Proceed to Summary"
          accessibilityHint="Navigates to the booking summary page where you can review your details"
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
    backgroundColor: COLORS.white,
    borderRadius:    16,
    padding:         SPACING.xl,
    marginBottom:    SPACING.xl,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.05,
    shadowRadius:    12,
    elevation:       2,
  },
  backBtn:     { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F5F7FA', alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 24, color: COLORS.textPrimary, fontWeight: '300', lineHeight: 26 },
  headerTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary },
  headerSub:   { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2 },

  section:      { backgroundColor: COLORS.white, borderRadius: 16, padding: SPACING.xl, marginBottom: SPACING.lg, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.03, shadowRadius: 10, elevation: 2 },
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

  addressChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F3F4F6', paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: '#E5E7EB', gap: 6 },
  addressChipText: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: '#374151' },

  label:      { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 8, marginTop: SPACING.md },
  input:      { backgroundColor: '#FAFAFA', borderWidth: 1, borderColor: '#EEEEEE', borderRadius: 12, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  inputError: { borderColor: COLORS.error, backgroundColor: '#FFF5F5' },
  rowInputs:  { flexDirection: 'row' },
  errorText:  { fontSize: FONT_SIZES.xs, color: COLORS.error, marginTop: 4 },

  imagePickerRow: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  pickerBtn: { width: 75, height: 75, borderRadius: 16, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center' },
  pickerLabel: { fontSize: 10, color: COLORS.primary, fontWeight: '600', marginTop: 4 },
  thumbWrapper: { position: 'relative', width: 75, height: 75 },
  thumbnail: { width: '100%', height: '100%', borderRadius: 16 },
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