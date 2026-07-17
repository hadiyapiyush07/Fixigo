import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView,
  TextInput, Alert, Modal, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Animated, { FadeInUp, FadeInDown, Layout } from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import { addressAPI } from '../../api/address.api';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';
import { ChevronLeft, Home, Building2, MapPin, Trash2, Edit2, Star, Plus, X, CheckSquare, Square } from 'lucide-react-native';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { Card } from '../../components/ui/Card';

const SavedAddressesScreen = ({ navigation }) => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formType, setFormType] = useState('Home');
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formPincode, setFormPincode] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const rowRefs = new Map();

  const fetchAddresses = useCallback(async () => {
    try {
      setLoading(true);
      const res = await addressAPI.getAll();
      if (res.data) setAddresses(res.data);
    } catch (e) {
      console.log('Error fetching addresses:', e);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { fetchAddresses(); }, [fetchAddresses]));

  const openAddModal = () => {
    setEditingId(null); setFormType('Home'); setFormAddress('');
    setFormCity('Surat'); setFormPincode(''); setIsDefault(addresses.length === 0);
    setModalVisible(true);
  };

  const openEditModal = (item) => {
    setEditingId(item._id); setFormType(item.type || 'Home'); setFormAddress(item.addressLine || '');
    setFormCity(item.city || ''); setFormPincode(item.pincode || ''); setIsDefault(item.isDefault || false);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formAddress.trim() || !formCity.trim() || !formPincode.trim()) {
      return Alert.alert('Validation Error', 'Please fill in all fields.');
    }
    setSaving(true);
    const payload = { type: formType, addressLine: formAddress, city: formCity, pincode: formPincode, isDefault };

    try {
      if (editingId) await addressAPI.update(editingId, payload);
      else await addressAPI.add(payload);
      setModalVisible(false);
      fetchAddresses();
    } catch (e) { Alert.alert('Error', 'Failed to save address.'); }
    finally { setSaving(false); }
  };

  const handleDelete = async (id) => {
    try {
      await addressAPI.delete(id);
      fetchAddresses();
    } catch (e) { Alert.alert('Error', 'Failed to delete address.'); }
  };

  const handleSetDefault = async (id) => {
    try {
      await addressAPI.setDefault(id);
      fetchAddresses();
    } catch (e) { Alert.alert('Error', 'Failed to set default address.'); }
  };

  const getIconForType = (type, color) => {
    if (type === 'Home') return <Home size={20} color={color} />;
    if (type === 'Work') return <Building2 size={20} color={color} />;
    return <MapPin size={20} color={color} />;
  };

  const renderRightActions = (progress, dragX, id) => (
    <TouchableOpacity 
      style={styles.deleteAction}
      onPress={() => {
        Alert.alert('Delete Address', 'Are you sure?', [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Delete', style: 'destructive', onPress: () => handleDelete(id) }
        ]);
      }}
    >
      <Trash2 size={24} color={COLORS.white} />
      <Text style={styles.deleteActionText}>Delete</Text>
    </TouchableOpacity>
  );

  const renderItem = ({ item, index }) => (
    <Animated.View entering={FadeInUp.delay(index * 100).springify()} layout={Layout.springify()}>
      <Swipeable
        ref={ref => { if (ref && !rowRefs.has(item._id)) rowRefs.set(item._id, ref); }}
        renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item._id)}
        onSwipeableWillOpen={() => {
          [...rowRefs.entries()].forEach(([key, ref]) => { if (key !== item._id && ref) ref.close(); });
        }}
        friction={2} rightThreshold={40}
      >
        <Card style={[styles.card, item.isDefault && styles.cardDefault]}>
          <View style={styles.cardHeader}>
            <View style={[styles.iconBox, item.isDefault && styles.iconBoxDefault]}>
              {getIconForType(item.type, item.isDefault ? COLORS.white : COLORS.primary)}
            </View>
            <View style={{ flex: 1, marginLeft: SPACING.md }}>
              <View style={styles.titleRow}>
                <Text style={styles.title}>{item.type || 'Address'}</Text>
                {item.isDefault && (
                  <View style={styles.defaultBadge}>
                    <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                  </View>
                )}
              </View>
              <Text style={styles.addressText}>{item.addressLine}</Text>
              <Text style={styles.addressText}>{item.city}, {item.pincode}</Text>
            </View>
          </View>
          <View style={styles.actionBtns}>
            <TouchableOpacity style={styles.actionBtn} onPress={() => openEditModal(item)}>
              <Edit2 size={16} color={COLORS.textSecondary} />
              <Text style={styles.actionBtnText}>Edit</Text>
            </TouchableOpacity>
            {!item.isDefault && (
              <>
                <View style={styles.dividerVertical} />
                <TouchableOpacity style={styles.actionBtn} onPress={() => handleSetDefault(item._id)}>
                  <Star size={16} color={COLORS.warning} />
                  <Text style={styles.actionBtnText}>Set Default</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </Card>
      </Swipeable>
    </Animated.View>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <ChevronLeft size={28} color={COLORS.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <View style={{ width: 44 }} />
      </View>

      {loading ? (
        <View style={styles.center}><ActivityIndicator size="large" color={COLORS.primary} /></View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Animated.View entering={FadeInUp.springify()} style={styles.empty}>
              <View style={styles.emptyIconBox}>
                <MapPin size={40} color={COLORS.primary} />
              </View>
              <Text style={styles.emptyTitle}>No saved addresses</Text>
              <Text style={styles.emptyText}>Add your home or work address for faster checkout.</Text>
            </Animated.View>
          }
        />
      )}

      <Animated.View entering={FadeInDown.delay(200).springify()} style={styles.bottomBar}>
        <PrimaryButton title="Add New Address" icon={<Plus size={20} color={COLORS.white} />} onPress={openAddModal} />
      </Animated.View>

      <Modal visible={isModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Edit Address' : 'Add Address'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <X size={24} color={COLORS.textPrimary} />
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: SPACING.lg }}>
              <Text style={styles.label}>Address Type</Text>
              <View style={styles.typeRow}>
                {['Home', 'Work', 'Other'].map(type => (
                  <TouchableOpacity 
                    key={type}
                    style={[styles.typeChip, formType === type && styles.typeChipActive]}
                    onPress={() => setFormType(type)}
                  >
                    {getIconForType(type, formType === type ? COLORS.primaryDark : COLORS.textSecondary)}
                    <Text style={[styles.typeChipText, formType === type && styles.typeChipTextActive]}>{type}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>House / Flat / Street <Text style={{color: COLORS.danger}}>*</Text></Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                value={formAddress} onChangeText={setFormAddress}
                placeholder="e.g. B-204, Sunrise Apartment..."
                placeholderTextColor={COLORS.textTertiary}
                multiline
              />

              <View style={{ flexDirection: 'row', gap: SPACING.md }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>City <Text style={{color: COLORS.danger}}>*</Text></Text>
                  <TextInput style={styles.input} value={formCity} onChangeText={setFormCity} placeholder="Surat" placeholderTextColor={COLORS.textTertiary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Pincode <Text style={{color: COLORS.danger}}>*</Text></Text>
                  <TextInput style={styles.input} value={formPincode} onChangeText={setFormPincode} keyboardType="numeric" maxLength={6} placeholder="395001" placeholderTextColor={COLORS.textTertiary} />
                </View>
              </View>

              <TouchableOpacity style={styles.checkboxRow} onPress={() => setIsDefault(!isDefault)}>
                {isDefault ? <CheckSquare size={24} color={COLORS.primary} /> : <Square size={24} color={COLORS.textTertiary} />}
                <Text style={styles.checkboxLabel}>Set as Default Address</Text>
              </TouchableOpacity>

              <PrimaryButton title="Save Address" onPress={handleSave} loading={saving} style={{ marginTop: SPACING.lg }} />
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.background },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: SPACING.lg, paddingTop: Platform.OS === 'ios' ? 60 : SPACING.xxl, paddingBottom: SPACING.md 
  },
  backBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm },
  headerTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary },
  
  list: { padding: SPACING.lg, paddingBottom: 100 },
  
  card: { padding: 0, marginBottom: SPACING.md, overflow: 'hidden' },
  cardDefault: { borderColor: COLORS.primary, borderWidth: 1.5, backgroundColor: COLORS.primaryLight },
  cardHeader: { flexDirection: 'row', padding: SPACING.lg },
  iconBox: { width: 48, height: 48, borderRadius: 24, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center', ...SHADOWS.sm },
  iconBoxDefault: { backgroundColor: COLORS.primary },
  
  titleRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  title: { fontSize: FONT_SIZES.md, fontWeight: '800', color: COLORS.textPrimary },
  defaultBadge: { backgroundColor: COLORS.primaryDark, paddingHorizontal: 8, paddingVertical: 2, borderRadius: 4, marginLeft: SPACING.sm },
  defaultBadgeText: { color: COLORS.white, fontSize: 10, fontWeight: '800' },
  addressText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginTop: 2, lineHeight: 20 },
  
  actionBtns: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: COLORS.divider, paddingVertical: SPACING.sm },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: SPACING.xs, gap: SPACING.xs },
  actionBtnText: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textSecondary },
  dividerVertical: { width: 1, height: '100%', backgroundColor: COLORS.divider },

  deleteAction: { backgroundColor: COLORS.danger, justifyContent: 'center', alignItems: 'center', width: 90, height: '100%', borderTopRightRadius: BORDER_RADIUS.lg, borderBottomRightRadius: BORDER_RADIUS.lg, marginBottom: SPACING.md },
  deleteActionText: { color: COLORS.white, fontWeight: '700', fontSize: 12, marginTop: 4 },

  empty: { alignItems: 'center', paddingTop: 80 },
  emptyIconBox: { width: 80, height: 80, borderRadius: 40, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.lg },
  emptyTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  emptyText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, textAlign: 'center', paddingHorizontal: SPACING.xl, lineHeight: 20 },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.surface, padding: SPACING.lg, paddingBottom: Platform.OS === 'ios' ? 32 : SPACING.lg, ...SHADOWS.lg },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.background, borderTopLeftRadius: BORDER_RADIUS.xxl, borderTopRightRadius: BORDER_RADIUS.xxl, maxHeight: '90%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: SPACING.lg, borderBottomWidth: 1, borderBottomColor: COLORS.divider },
  modalTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.textPrimary },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: COLORS.surface, alignItems: 'center', justifyContent: 'center' },

  label: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.textSecondary, marginBottom: 8, marginTop: SPACING.md },
  typeRow: { flexDirection: 'row', gap: SPACING.sm },
  typeChip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, borderRadius: BORDER_RADIUS.md, backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, gap: 8 },
  typeChipActive: { backgroundColor: COLORS.primaryLight, borderColor: COLORS.primary },
  typeChipText: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: COLORS.textSecondary },
  typeChipTextActive: { color: COLORS.primaryDark, fontWeight: '700' },
  
  input: { backgroundColor: COLORS.surface, borderWidth: 1, borderColor: COLORS.border, borderRadius: BORDER_RADIUS.md, paddingHorizontal: SPACING.md, height: 52, fontSize: FONT_SIZES.md, color: COLORS.textPrimary },
  
  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.xl, marginBottom: SPACING.md, gap: SPACING.sm },
  checkboxLabel: { fontSize: FONT_SIZES.md, fontWeight: '600', color: COLORS.textPrimary },
});

export default SavedAddressesScreen;
