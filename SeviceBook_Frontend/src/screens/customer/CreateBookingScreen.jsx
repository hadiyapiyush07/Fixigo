import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Alert, KeyboardAvoidingView, Platform, Image
} from 'react-native';
import Animated, { FadeInUp, FadeInDown, Layout } from 'react-native-reanimated';
import { launchImageLibrary } from 'react-native-image-picker';
import { useSelector } from 'react-redux';
import { useFocusEffect } from '@react-navigation/native';
import axios from 'axios';
import { addressAPI } from '../../api/address.api';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';
import { ChevronLeft, MapPin, Camera, X, TicketPercent, CheckCircle2, Clock, CalendarClock, Home, Building2, MapPinned } from 'lucide-react-native';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { Card } from '../../components/ui/Card';
import { SectionHeader } from '../../components/ui/SectionHeader';

const API_URL = 'http://10.0.2.2:5000/api'; // Switched to generic local IP to prevent network errors

const CreateBookingScreen = ({ navigation, route }) => {
  const categoryId    = route?.params?.categoryId;
  const categoryName  = route?.params?.categoryName  || 'Service';
  const subService    = route?.params?.subService;
  const subServices   = route?.params?.subServices || (subService ? [subService] : []);

  const basePrice     = route?.params?.basePrice || subServices.reduce((sum, s) => sum + s.price, 0) || 499;
  const totalDuration = route?.params?.duration || subServices.reduce((sum, s) => sum + (s.duration || 60), 0) || 60;

  // Form state
  const [addressLine,  setAddressLine]  = useState('');
  const [city,         setCity]         = useState('Surat');
  const [pincode,      setPincode]      = useState('');
  const [notes,        setNotes]        = useState('');
  const [couponCode,   setCouponCode]   = useState('');
  const [discount,     setDiscount]     = useState(0);
  const [couponApplied, setCouponApplied] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  
  const [images, setImages] = useState([]);
  const [imageUris, setImageUris] = useState([]);
  const [errors, setErrors] = useState({});
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [selectedAddrId, setSelectedAddrId] = useState(null);

  const { accessToken } = useSelector(state => state.auth);

  const fetchSavedAddresses = React.useCallback(async () => {
    try {
      const res = await addressAPI.getAll();
      if (res.data) {
        setSavedAddresses(res.data);
      }
    } catch (e) { console.log('Error fetching addresses'); }
  }, []);

  useFocusEffect(React.useCallback(() => { fetchSavedAddresses(); }, [fetchSavedAddresses]));

  const handleSelectSavedAddress = (addr) => {
    if (selectedAddrId === addr._id) {
      setSelectedAddrId(null);
      setAddressLine('');
      setCity('Surat');
      setPincode('');
    } else {
      setSelectedAddrId(addr._id);
      setAddressLine(addr.addressLine || '');
      setCity(addr.city || 'Surat');
      setPincode(addr.pincode || '');
    }
    setErrors({});
  };

  const handlePickImage = () => {
    if (imageUris.length >= 3) {
      Alert.alert('Limit Reached', 'Maximum 3 images allowed.');
      return;
    }
    launchImageLibrary({ mediaType: 'photo', includeBase64: true, quality: 0.5 }, (response) => {
      if (response.didCancel) return;
      if (response.errorMessage) return Alert.alert('Error', response.errorMessage);
      const asset = response.assets?.[0];
      if (asset) {
        setImages(prev => [...prev, `data:${asset.type};base64,${asset.base64}`]);
        setImageUris(prev => [...prev, asset.uri]);
      }
    });
  };

  const handleRemoveImage = (index) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    setImageUris(prev => prev.filter((_, i) => i !== index));
  };

  const handleApplyCoupon = async () => {
    if (couponApplied) {
      setDiscount(0); setCouponCode(''); setCouponApplied(false);
      return Alert.alert('Removed', 'Promo code removed.');
    }
    const code = couponCode.trim().toUpperCase();
    if (!code) return Alert.alert('Error', 'Enter a coupon code.');

    try {
      setApplyingCoupon(true);
      const res = await axios.post(`${API_URL}/coupons/apply`, { code, basePrice }, { headers: { Authorization: `Bearer ${accessToken}` } });
      setDiscount(res.data.data.discountAmount);
      setCouponApplied(true);
      Alert.alert('🎉 Applied!', `₹${res.data.data.discountAmount} discount applied!`);
    } catch (err) {
      Alert.alert('Error', err.response?.data?.message || 'Invalid coupon code.');
    } finally {
      setApplyingCoupon(false);
    }
  };

  const validate = () => {
    const e = {};
    if (!addressLine.trim()) e.address = 'Address is required';
    if (!city.trim()) e.city = 'City is required';
    if (!pincode || pincode.length < 6) e.pincode = 'Valid 6-digit pincode required';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleProceed = () => {
    if (!validate()) return Alert.alert('Validation Error', 'Complete required fields.');
    if (!categoryId) return Alert.alert('Error', 'Service missing. Please go back.');

    const convenienceFee = basePrice < 200 ? 29 : 49;
    const totalAmount = Math.max(0, basePrice + convenienceFee - discount);

    navigation.navigate('BookingSummary', {
      categoryId, categoryName, subServices,
      subService: { name: subServices.map(s => s.name).join(', '), price: basePrice, duration: totalDuration },
      notes: notes.trim(),
      address: {
        addressLine: addressLine.trim(), city: city.trim(), pincode: pincode.trim(),
        location: { type: 'Point', coordinates: [72.8311, 21.1702] }
      },
      couponCode: couponApplied ? couponCode.trim().toUpperCase() : null,
      images,
      pricing: { baseAmount: basePrice, convenienceFee, discount, totalAmount }
    });
  };

  const getAddressIcon = (type) => {
    if (type === 'Home') return <Home size={20} color={COLORS.primary} />;
    if (type === 'Work') return <Building2 size={20} color={COLORS.primary} />;
    return <MapPinned size={20} color={COLORS.primary} />;
  };

  return (
    <KeyboardAvoidingView style={styles.safe} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <ChevronLeft size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Booking Details</Text>
        <View style={{ width: 44 }} />
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        
        {/* Instant Booking Schedule Card */}
        <Animated.View entering={FadeInUp.delay(100).springify()}>
          <SectionHeader title="Schedule" />
          <Card style={styles.scheduleCard} noPadding>
            <View style={styles.scheduleInner}>
              <View style={styles.scheduleIconBox}>
                <CalendarClock size={28} color={COLORS.white} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.scheduleTitle}>Instant Booking</Text>
                <Text style={styles.scheduleSub}>Provider will be assigned immediately</Text>
              </View>
              <CheckCircle2 size={24} color={COLORS.success} />
            </View>
          </Card>
        </Animated.View>

        {/* Address Selection */}
        <Animated.View entering={FadeInUp.delay(150).springify()}>
          <SectionHeader title="Service Location" />
          
          {savedAddresses.length > 0 && (
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.savedAddrList}>
              {savedAddresses.map(addr => {
                const isSel = selectedAddrId === addr._id;
                return (
                  <TouchableOpacity 
                    key={addr._id} 
                    style={[styles.savedAddrCard, isSel && styles.savedAddrCardActive]}
                    onPress={() => handleSelectSavedAddress(addr)}
                  >
                    <View style={[styles.savedAddrIcon, isSel && styles.savedAddrIconActive]}>
                      {getAddressIcon(addr.label || addr.type)}
                    </View>
                    <Text style={[styles.savedAddrTitle, isSel && { color: COLORS.primary }]}>{addr.label || addr.type || 'Other'}</Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          )}

          <Card style={styles.formCard}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>House / Flat / Street <Text style={styles.req}>*</Text></Text>
              <TextInput
                style={[styles.input, errors.address && styles.inputError]}
                placeholder="e.g. B-204, Sunrise Apartment..."
                placeholderTextColor={COLORS.textTertiary}
                value={addressLine}
                onChangeText={v => { setAddressLine(v); setSelectedAddrId(null); setErrors(p => ({ ...p, address: null })); }}
                multiline
              />
              {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
            </View>

            <View style={styles.rowInputs}>
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>City <Text style={styles.req}>*</Text></Text>
                <TextInput
                  style={[styles.input, errors.city && styles.inputError]}
                  value={city}
                  onChangeText={v => { setCity(v); setSelectedAddrId(null); setErrors(p => ({ ...p, city: null })); }}
                />
              </View>
              <View style={{ width: SPACING.md }} />
              <View style={[styles.inputGroup, { flex: 1 }]}>
                <Text style={styles.label}>Pincode <Text style={styles.req}>*</Text></Text>
                <TextInput
                  style={[styles.input, errors.pincode && styles.inputError]}
                  value={pincode}
                  onChangeText={v => { setPincode(v); setSelectedAddrId(null); setErrors(p => ({ ...p, pincode: null })); }}
                  keyboardType="numeric" maxLength={6}
                />
              </View>
            </View>
          </Card>
        </Animated.View>

        {/* Promo Code */}
        <Animated.View entering={FadeInUp.delay(200).springify()}>
          <SectionHeader title="Offers & Discounts" />
          <Card style={styles.couponCard}>
            <View style={styles.couponRow}>
              <TicketPercent size={24} color={COLORS.primary} />
              <TextInput
                style={styles.couponInput}
                placeholder="Enter Promo Code"
                placeholderTextColor={COLORS.textTertiary}
                value={couponCode}
                onChangeText={setCouponCode}
                editable={!couponApplied}
                autoCapitalize="characters"
              />
              <PrimaryButton 
                title={couponApplied ? "Remove" : "Apply"}
                onPress={handleApplyCoupon}
                variant={couponApplied ? "outline" : "primary"}
                style={styles.applyBtn}
                textStyle={{ fontSize: 13 }}
                loading={applyingCoupon}
              />
            </View>
          </Card>
        </Animated.View>

        {/* Notes & Photos */}
        <Animated.View entering={FadeInUp.delay(250).springify()}>
          <SectionHeader title="Additional Details (Optional)" />
          <Card style={styles.formCard}>
            <Text style={styles.label}>Instructions for Provider</Text>
            <TextInput
              style={[styles.input, { minHeight: 80, textAlignVertical: 'top' }]}
              placeholder="Any specific details you want the provider to know?"
              placeholderTextColor={COLORS.textTertiary}
              value={notes}
              onChangeText={setNotes}
              multiline
            />

            <Text style={[styles.label, { marginTop: SPACING.lg }]}>Reference Photos (Max 3)</Text>
            <View style={styles.imageGrid}>
              {imageUris.map((uri, idx) => (
                <Animated.View key={uri} entering={FadeInDown.springify()} layout={Layout.springify()} style={styles.thumbWrapper}>
                  <Image source={{ uri }} style={styles.thumbnail} />
                  <TouchableOpacity style={styles.removeBtn} onPress={() => handleRemoveImage(idx)}>
                    <X size={14} color={COLORS.white} />
                  </TouchableOpacity>
                </Animated.View>
              ))}
              {imageUris.length < 3 && (
                <TouchableOpacity style={styles.addPhotoBtn} onPress={handlePickImage} activeOpacity={0.7}>
                  <Camera size={28} color={COLORS.primary} />
                  <Text style={styles.addPhotoTxt}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </Card>
        </Animated.View>

        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Sticky Bottom Panel */}
      <Animated.View entering={FadeInDown.delay(300).springify()} style={styles.bottomPanel}>
        <View style={styles.bottomInfo}>
          <Text style={styles.totalLabel}>Service Total</Text>
          <Text style={styles.totalPrice}>₹{basePrice}</Text>
        </View>
        <PrimaryButton 
          title="Review Booking" 
          onPress={handleProceed}
          style={styles.proceedBtn}
        />
      </Animated.View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: SPACING.lg, paddingTop: Platform.OS === 'ios' ? 60 : SPACING.xl, paddingBottom: SPACING.md 
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm },
  headerTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary },
  scrollContent: { padding: SPACING.lg, paddingTop: 0 },

  scheduleCard: { backgroundColor: COLORS.primary, overflow: 'hidden' },
  scheduleInner: { flexDirection: 'row', alignItems: 'center', padding: SPACING.lg },
  scheduleIconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  scheduleTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.white },
  scheduleSub: { fontSize: FONT_SIZES.sm, color: 'rgba(255,255,255,0.8)', marginTop: 2, fontWeight: '500' },

  savedAddrList: { gap: SPACING.md, marginBottom: SPACING.lg },
  savedAddrCard: { 
    flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, 
    borderRadius: BORDER_RADIUS.lg, paddingRight: SPACING.lg, paddingLeft: SPACING.sm, 
    paddingVertical: SPACING.sm, borderWidth: 1.5, borderColor: COLORS.border, ...SHADOWS.sm 
  },
  savedAddrCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  savedAddrIcon: { width: 40, height: 40, borderRadius: 20, backgroundColor: COLORS.background, alignItems: 'center', justifyContent: 'center', marginRight: SPACING.sm },
  savedAddrIconActive: { backgroundColor: COLORS.white },
  savedAddrTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textSecondary },

  formCard: { padding: SPACING.lg },
  inputGroup: { marginBottom: SPACING.md },
  label: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.textPrimary, marginBottom: 8 },
  req: { color: COLORS.danger },
  input: { 
    backgroundColor: COLORS.background, borderRadius: BORDER_RADIUS.md, 
    paddingHorizontal: SPACING.md, paddingVertical: 14, 
    fontSize: FONT_SIZES.md, color: COLORS.textPrimary, 
    borderWidth: 1, borderColor: COLORS.border 
  },
  inputError: { borderColor: COLORS.danger, backgroundColor: COLORS.errorLight },
  errorText: { color: COLORS.danger, fontSize: FONT_SIZES.xs, marginTop: 4, fontWeight: '500' },
  rowInputs: { flexDirection: 'row', alignItems: 'flex-start' },

  couponCard: { padding: SPACING.md },
  couponRow: { flexDirection: 'row', alignItems: 'center' },
  couponInput: { flex: 1, marginHorizontal: SPACING.sm, fontSize: FONT_SIZES.md, color: COLORS.textPrimary, fontWeight: '600' },
  applyBtn: { width: 90, height: 40, borderRadius: BORDER_RADIUS.md },

  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: SPACING.md },
  thumbWrapper: { width: 80, height: 80, borderRadius: BORDER_RADIUS.md, overflow: 'hidden' },
  thumbnail: { width: '100%', height: '100%' },
  removeBtn: { position: 'absolute', top: 4, right: 4, width: 24, height: 24, borderRadius: 12, backgroundColor: 'rgba(0,0,0,0.6)', alignItems: 'center', justifyContent: 'center' },
  addPhotoBtn: { width: 80, height: 80, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.background, borderWidth: 1, borderColor: COLORS.border, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  addPhotoTxt: { fontSize: 11, fontWeight: '600', color: COLORS.primary, marginTop: 4 },

  bottomPanel: { 
    position: 'absolute', bottom: 0, left: 0, right: 0, 
    backgroundColor: COLORS.surface, borderTopLeftRadius: BORDER_RADIUS.xxl, borderTopRightRadius: BORDER_RADIUS.xxl, 
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg, paddingBottom: Platform.OS === 'ios' ? 32 : SPACING.lg, 
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...SHADOWS.lg 
  },
  bottomInfo: { flex: 1 },
  totalLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '600' },
  totalPrice: { fontSize: FONT_SIZES.xxl, fontWeight: '900', color: COLORS.textPrimary },
  proceedBtn: { width: 160 }
});

export default CreateBookingScreen;