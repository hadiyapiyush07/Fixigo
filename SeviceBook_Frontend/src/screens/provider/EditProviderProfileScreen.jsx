// src/screens/provider/EditProviderProfileScreen.jsx
import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TextInput,
  TouchableOpacity, ActivityIndicator, Alert, Image, Switch,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import { providerAPI } from '../../api/provider.api';
import { categoryAPI } from '../../api/category.api';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';

const DAYS_OF_WEEK = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

const EditProviderProfileScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [categories, setCategories] = useState([]);
  const [isVerified, setIsVerified] = useState(false);
  
  // Form fields state
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [experience, setExperience] = useState('');
  const [workingRadius, setWorkingRadius] = useState('10');
  const [city, setCity] = useState('');
  const [address, setAddress] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  
  // Docs & Verification
  const [aadhaar, setAadhaar] = useState('');
  const [pan, setPan] = useState('');
  const [profilePhoto, setProfilePhoto] = useState(null); // base64 / uri
  const [profilePhotoUri, setProfilePhotoUri] = useState(null);
  const [idProof, setIdProof] = useState(null); // base64 / uri
  const [idProofUri, setIdProofUri] = useState(null);
  const [selfie, setSelfie] = useState(null); // base64 / uri
  const [selfieUri, setSelfieUri] = useState(null);

  // Skills (Category IDs)
  const [selectedSkills, setSelectedSkills] = useState([]);

  // Bank Details
  const [bankHolder, setBankHolder] = useState('');
  const [bankAccount, setBankAccount] = useState('');
  const [bankIfsc, setBankIfsc] = useState('');

  // Availability Toggles
  const [availability, setAvailability] = useState({
    monday: { isOpen: true, start: '09:00', end: '18:00' },
    tuesday: { isOpen: true, start: '09:00', end: '18:00' },
    wednesday: { isOpen: true, start: '09:00', end: '18:00' },
    thursday: { isOpen: true, start: '09:00', end: '18:00' },
    friday: { isOpen: true, start: '09:00', end: '18:00' },
    saturday: { isOpen: true, start: '09:00', end: '18:00' },
    sunday: { isOpen: false, start: '09:00', end: '18:00' },
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      setLoading(true);

      // 1. Fetch categories independently (crucial for selectable skills list)
      try {
        const catRes = await categoryAPI.getAll();
        setCategories(catRes?.data?.data || []);
      } catch (catErr) {
        console.log('Error loading categories:', catErr.message);
        Alert.alert('Category Error', 'Failed to load service categories.');
      }
      
      // 2. Fetch provider profile independently
      try {
        const profileRes = await providerAPI.getMyProfile();
        const profile = profileRes?.data?.data || profileRes?.data;
        if (profile) {
          setName(profile.userId?.name || '');
          setBio(profile.bio || '');
          setExperience(String(profile.experience || ''));
          setWorkingRadius(String(profile.workingRadius || '10'));
          setCity(profile.serviceArea?.city || '');
          setAddress(profile.address || '');
          setEmergencyContact(profile.emergencyContact || '');
          setAadhaar(profile.aadhaar || '');
          setPan(profile.pan || '');
          setSelectedSkills(profile.skills?.filter(Boolean).map(s => s._id || s) || []);
          
          setProfilePhotoUri(profile.userId?.profilePhoto || null);
          setIdProofUri(profile.idProof || null);
          setSelfieUri(profile.selfie || null);
          setIsVerified(profile.isVerified || false);

          if (profile.bankDetails) {
            setBankHolder(profile.bankDetails.accountHolderName || '');
            setBankAccount(profile.bankDetails.accountNo || '');
            setBankIfsc(profile.bankDetails.ifscCode || '');
          }

          if (profile.availability) {
            setAvailability(profile.availability);
          }
        }
      } catch (profErr) {
        console.log('Profile fetch error:', profErr.message);
        // It is fine if profile fails with 404 for a brand new provider
        if (profErr.response?.status !== 404) {
          Alert.alert('Profile Error', 'Failed to load existing profile details.');
        }
      }
    } catch (e) {
      console.log('Initial fetch error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handlePickImage = (type) => {
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
        if (type === 'profile') {
          setProfilePhoto(base64Str);
          setProfilePhotoUri(asset.uri);
        } else if (type === 'id') {
          setIdProof(base64Str);
          setIdProofUri(asset.uri);
        } else if (type === 'selfie') {
          setSelfie(base64Str);
          setSelfieUri(asset.uri);
        }
      }
    });
  };

  const toggleSkill = (id) => {
    setSelectedSkills(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const toggleDay = (day) => {
    setAvailability(prev => ({
      ...prev,
      [day]: { ...prev[day], isOpen: !prev[day].isOpen }
    }));
  };

  const validate = () => {
    const e = {};
    if (!name.trim()) e.name = 'Full Name is required';
    if (!experience.trim() || isNaN(experience) || Number(experience) < 0) {
      e.experience = 'Enter valid years of experience';
    }
    if (!workingRadius.trim() || isNaN(workingRadius) || Number(workingRadius) <= 0) {
      e.workingRadius = 'Enter valid radius (KM)';
    }
    if (!city.trim()) e.city = 'City is required';
    if (!address.trim()) e.address = 'Full Address is required';
    
    // Aadhaar Validation
    if (!aadhaar.trim()) {
      e.aadhaar = 'Aadhaar number is required';
    } else if (!/^\d{12}$/.test(aadhaar)) {
      e.aadhaar = 'Aadhaar must be exactly 12 digits';
    }

    // PAN Validation (Optional but checked format if entered)
    if (pan.trim() && !/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(pan.trim().toUpperCase())) {
      e.pan = 'Invalid PAN format (e.g. ABCDE1234F)';
    }

    // Emergency Contact
    if (!emergencyContact.trim()) {
      e.emergencyContact = 'Emergency contact is required';
    } else if (!/^[6-9]\d{9}$/.test(emergencyContact)) {
      e.emergencyContact = 'Enter valid 10-digit phone number';
    }

    // Documents
    if (!profilePhotoUri) e.profile = 'Profile photo is required';
    if (!idProofUri) e.idProof = 'Aadhaar document image is required';
    if (!selfieUri) e.selfie = 'Selfie is required';

    // Skills
    if (selectedSkills.length === 0) e.skills = 'Select at least one skill';

    // Bank details
    if (!bankHolder.trim()) e.bankHolder = 'Account Holder Name is required';
    if (!bankAccount.trim()) e.bankAccount = 'Account Number is required';
    if (!bankIfsc.trim() || bankIfsc.length < 5) e.bankIfsc = 'Enter valid bank IFSC code';

    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async () => {
    if (!validate()) {
      Alert.alert('Validation Error', 'Please check and complete all required fields.');
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        name: name.trim(),
        bio: bio.trim(),
        experience: Number(experience),
        workingRadius: Number(workingRadius),
        serviceArea: { city: city.trim(), pincodes: [] },
        address: address.trim(),
        emergencyContact: emergencyContact.trim(),
        aadhaar: aadhaar.trim(),
        pan: pan.trim().toUpperCase(),
        skills: selectedSkills,
        bankDetails: {
          accountHolderName: bankHolder.trim(),
          accountNo: bankAccount.trim(),
          ifscCode: bankIfsc.trim().toUpperCase()
        },
        availability
      };

      // Add base64 images if they were newly selected
      if (profilePhoto) payload.profilePhoto = profilePhoto;
      if (idProof) payload.idProof = idProof;
      if (selfie) payload.selfie = selfie;

      await providerAPI.updateProfile(payload);
      
      Alert.alert(
        isVerified ? '✅ Profile Updated' : '📄 Profile Submitted',
        isVerified
          ? 'Your profile details have been successfully updated.'
          : 'Your profile has been submitted and is currently Pending Verification. You will not be able to receive bookings until admin approval.',
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );
    } catch (e) {
      const msg = e.response?.data?.message || 'Failed to update profile details.';
      Alert.alert('Submission Failed', msg);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.primary} />
        <Text style={styles.loadingText}>Loading profile setup...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={{ fontSize: 24, color: COLORS.textPrimary }}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Professional Profile</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        
        {/* Section 1: Profile Photo */}
        <View style={styles.photoContainer}>
          <TouchableOpacity style={styles.profilePicker} onPress={() => handlePickImage('profile')}>
            {profilePhotoUri ? (
              <Image source={{ uri: profilePhotoUri }} style={styles.profileImg} />
            ) : (
              <View style={styles.profilePlaceholder}>
                <Text style={{ fontSize: 32 }}>📸</Text>
                <Text style={styles.placeholderLabel}>Upload Photo</Text>
              </View>
            )}
          </TouchableOpacity>
          <Text style={styles.photoInstructions}>Upload a clear profile photo for customers to see.</Text>
          {errors.profile && <Text style={styles.errorTextCenter}>{errors.profile}</Text>}
        </View>

        {/* Section 2: Personal Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>👤 Basic Information</Text>
          
          <Text style={styles.label}>Full Name *</Text>
          <TextInput
            style={[styles.input, errors.name && styles.inputError]}
            value={name}
            onChangeText={setName}
            placeholder="John Doe"
            placeholderTextColor={COLORS.textTertiary}
          />
          {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

          <Text style={styles.label}>Bio / Description</Text>
          <TextInput
            style={[styles.input, { height: 70, textAlignVertical: 'top' }]}
            value={bio}
            onChangeText={setBio}
            placeholder="Introduce yourself to customers..."
            placeholderTextColor={COLORS.textTertiary}
            multiline
          />
        </View>

        {/* Section 3: Professional Info */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>💼 Professional Details</Text>

          <View style={styles.rowInputs}>
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Experience (Years) *</Text>
              <TextInput
                style={[styles.input, errors.experience && styles.inputError]}
                value={experience}
                onChangeText={setExperience}
                placeholder="5"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="numeric"
                importantForAutofill="no"
                textContentType="none"
              />
              {errors.experience && <Text style={styles.errorText}>{errors.experience}</Text>}
            </View>
            <View style={{ width: SPACING.md }} />
            <View style={{ flex: 1 }}>
              <Text style={styles.label}>Radius (KM) *</Text>
              <TextInput
                style={[styles.input, errors.workingRadius && styles.inputError]}
                value={workingRadius}
                onChangeText={setWorkingRadius}
                placeholder="10"
                placeholderTextColor={COLORS.textTertiary}
                keyboardType="numeric"
                importantForAutofill="no"
                textContentType="none"
              />
              {errors.workingRadius && <Text style={styles.errorText}>{errors.workingRadius}</Text>}
            </View>
          </View>

          <Text style={styles.label}>City *</Text>
          <TextInput
            style={[styles.input, errors.city && styles.inputError]}
            value={city}
            onChangeText={setCity}
            placeholder="Surat"
            placeholderTextColor={COLORS.textTertiary}
          />
          {errors.city && <Text style={styles.errorText}>{errors.city}</Text>}

          <Text style={styles.label}>Full Address *</Text>
          <TextInput
            style={[styles.input, errors.address && styles.inputError]}
            value={address}
            onChangeText={setAddress}
            placeholder="123, Ring Road, Surat"
            placeholderTextColor={COLORS.textTertiary}
            multiline
          />
          {errors.address && <Text style={styles.errorText}>{errors.address}</Text>}
        </View>

        {/* Section 4: Skills & Service Categories */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🛠️ Skills & Categories *</Text>
          <Text style={styles.subtext}>Select the services you can perform:</Text>
          <View style={styles.skillsGrid}>
            {categories.map(cat => {
              const selected = selectedSkills.includes(cat._id);
              return (
                <TouchableOpacity
                  key={cat._id}
                  style={[styles.skillChip, selected && styles.skillChipActive]}
                  onPress={() => toggleSkill(cat._id)}
                >
                  <Text style={[styles.skillChipText, selected && styles.skillChipTextActive]}>
                    {cat.name}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          {errors.skills && <Text style={styles.errorText}>{errors.skills}</Text>}
        </View>

        {/* Section 5: Documents & ID Upload */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📄 Verification Documents</Text>

          <Text style={styles.label}>Aadhaar Number *</Text>
          <TextInput
            style={[styles.input, errors.aadhaar && styles.inputError]}
            value={aadhaar}
            onChangeText={setAadhaar}
            placeholder="12-digit Aadhaar Number"
            placeholderTextColor={COLORS.textTertiary}
            keyboardType="numeric"
            maxLength={12}
          />
          {errors.aadhaar && <Text style={styles.errorText}>{errors.aadhaar}</Text>}

          <Text style={styles.label}>Aadhaar Image Document *</Text>
          <TouchableOpacity style={styles.docUploadBtn} onPress={() => handlePickImage('id')}>
            {idProofUri ? (
              <Image source={{ uri: idProofUri }} style={styles.docThumbnail} />
            ) : (
              <View style={styles.docUploadPlaceholder}>
                <Text style={{ fontSize: 24 }}>📇</Text>
                <Text style={styles.docUploadLabel}>Choose Aadhaar Image</Text>
              </View>
            )}
          </TouchableOpacity>
          {errors.idProof && <Text style={styles.errorText}>{errors.idProof}</Text>}

          <Text style={[styles.label, { marginTop: SPACING.md }]}>PAN Number (Optional)</Text>
          <TextInput
            style={[styles.input, errors.pan && styles.inputError]}
            value={pan}
            onChangeText={setPan}
            placeholder="e.g. ABCDE1234F"
            placeholderTextColor={COLORS.textTertiary}
            maxLength={10}
          />
          {errors.pan && <Text style={styles.errorText}>{errors.pan}</Text>}

          <Text style={[styles.label, { marginTop: SPACING.md }]}>Selfie Verification *</Text>
          <TouchableOpacity style={styles.docUploadBtn} onPress={() => handlePickImage('selfie')}>
            {selfieUri ? (
              <Image source={{ uri: selfieUri }} style={styles.docThumbnail} />
            ) : (
              <View style={styles.docUploadPlaceholder}>
                <Text style={{ fontSize: 24 }}>🤳</Text>
                <Text style={styles.docUploadLabel}>Take/Choose Selfie</Text>
              </View>
            )}
          </TouchableOpacity>
          {errors.selfie && <Text style={styles.errorText}>{errors.selfie}</Text>}
        </View>

        {/* Section 6: Emergency Contact */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🚨 Emergency Contact</Text>
          
          <Text style={styles.label}>Emergency Phone Number *</Text>
          <TextInput
            style={[styles.input, errors.emergencyContact && styles.inputError]}
            value={emergencyContact}
            onChangeText={setEmergencyContact}
            placeholder="10-digit Phone Number"
            placeholderTextColor={COLORS.textTertiary}
            keyboardType="numeric"
            maxLength={10}
          />
          {errors.emergencyContact && <Text style={styles.errorText}>{errors.emergencyContact}</Text>}
        </View>

        {/* Section 7: Bank Details */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>🏦 Bank Account Information</Text>

          <Text style={styles.label}>Account Holder Name *</Text>
          <TextInput
            style={[styles.input, errors.bankHolder && styles.inputError]}
            value={bankHolder}
            onChangeText={setBankHolder}
            placeholder="John Doe"
            placeholderTextColor={COLORS.textTertiary}
          />
          {errors.bankHolder && <Text style={styles.errorText}>{errors.bankHolder}</Text>}

          <Text style={styles.label}>Account Number *</Text>
          <TextInput
            style={[styles.input, errors.bankAccount && styles.inputError]}
            value={bankAccount}
            onChangeText={setBankAccount}
            placeholder="Account Number"
            placeholderTextColor={COLORS.textTertiary}
            keyboardType="numeric"
          />
          {errors.bankAccount && <Text style={styles.errorText}>{errors.bankAccount}</Text>}

          <Text style={styles.label}>IFSC Code *</Text>
          <TextInput
            style={[styles.input, errors.bankIfsc && styles.inputError]}
            value={bankIfsc}
            onChangeText={setBankIfsc}
            placeholder="e.g. SBIN0001234"
            placeholderTextColor={COLORS.textTertiary}
            maxLength={11}
          />
          {errors.bankIfsc && <Text style={styles.errorText}>{errors.bankIfsc}</Text>}
        </View>

        {/* Section 8: Availability Days */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📆 Weekly Working Days</Text>
          <Text style={styles.subtext}>Select the days you are available to work:</Text>
          <View style={styles.availabilityList}>
            {DAYS_OF_WEEK.map(day => (
              <View key={day} style={styles.dayRow}>
                <Text style={styles.dayLabel}>{day.charAt(0).toUpperCase() + day.slice(1)}</Text>
                <Switch
                  value={availability[day].isOpen}
                  onValueChange={() => toggleDay(day)}
                  trackColor={{ false: '#D1D5DB', true: COLORS.primaryLight }}
                  thumbColor={availability[day].isOpen ? COLORS.primary : '#9CA3AF'}
                />
              </View>
            ))}
          </View>
        </View>

        {/* Submit Button */}
        <TouchableOpacity
          style={[styles.submitBtn, submitting && { opacity: 0.7 }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color={COLORS.white} />
          ) : (
            <Text style={styles.submitBtnText}>
              {isVerified ? 'Save Profile Changes' : 'Submit Profile for Verification'}
            </Text>
          )}
        </TouchableOpacity>

        <View style={{ height: 60 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F7FA' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F7FA' },
  loadingText: { marginTop: 12, color: COLORS.textSecondary, fontWeight: '500' },
  
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: 56,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backBtn: { padding: 4, marginRight: 12 },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: '700', color: COLORS.textPrimary },
  
  scrollContent: { padding: SPACING.xl },
  
  // Photo Picker
  photoContainer: { alignItems: 'center', marginBottom: SPACING.xl },
  profilePicker: {
    width: 104,
    height: 104,
    borderRadius: 52,
    backgroundColor: '#E5E7EB',
    borderWidth: 2,
    borderColor: '#D1D5DB',
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  profileImg: { width: '100%', height: '100%' },
  profilePlaceholder: { alignItems: 'center' },
  placeholderLabel: { fontSize: 10, color: COLORS.textSecondary, fontWeight: '600', marginTop: 4 },
  photoInstructions: { fontSize: 11, color: COLORS.textSecondary, textAlign: 'center', marginTop: 8, paddingHorizontal: 20 },
  errorTextCenter: { fontSize: FONT_SIZES.xs, color: COLORS.error, marginTop: 4, textAlign: 'center' },

  card: {
    backgroundColor: COLORS.white,
    borderRadius: 16,
    padding: SPACING.lg,
    marginBottom: SPACING.lg,
    ...SHADOWS.sm
  },
  cardTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  subtext: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginBottom: SPACING.md },

  label: { fontSize: FONT_SIZES.xs, fontWeight: '600', color: COLORS.textSecondary, marginBottom: 6, marginTop: 10 },
  input: {
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    paddingVertical: 10,
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
  },
  inputError: { borderColor: COLORS.error },
  rowInputs: { flexDirection: 'row' },
  errorText: { fontSize: FONT_SIZES.xs, color: COLORS.error, marginTop: 4 },

  // Skills
  skillsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  skillChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  skillChipActive: {
    backgroundColor: COLORS.primaryLight,
    borderColor: COLORS.primary,
  },
  skillChipText: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary },
  skillChipTextActive: { color: COLORS.primary, fontWeight: '700' },

  // Document uploads
  docUploadBtn: {
    height: 120,
    borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5,
    borderColor: '#D1D5DB',
    borderStyle: 'dashed',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginTop: 4,
  },
  docThumbnail: { width: '100%', height: '100%', resizeMode: 'cover' },
  docUploadPlaceholder: { alignItems: 'center' },
  docUploadLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 6, fontWeight: '500' },

  // Availability
  availabilityList: { gap: 8 },
  dayRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6'
  },
  dayLabel: { fontSize: FONT_SIZES.sm, color: COLORS.textPrimary, fontWeight: '500' },

  // Submit button
  submitBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 14,
    borderRadius: BORDER_RADIUS.lg,
    alignItems: 'center',
    marginTop: SPACING.lg,
    ...SHADOWS.md,
  },
  submitBtnText: { color: COLORS.white, fontSize: FONT_SIZES.md, fontWeight: '700' },
});

export default EditProviderProfileScreen;
