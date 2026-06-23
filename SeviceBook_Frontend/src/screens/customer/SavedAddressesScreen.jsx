import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, ScrollView,
  TextInput, Alert, Modal, KeyboardAvoidingView, Platform, ActivityIndicator
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import Reanimated, { FadeInUp, FadeIn } from 'react-native-reanimated';
import { Swipeable } from 'react-native-gesture-handler';
import { addressAPI } from '../../api/address.api';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';

const SavedAddressesScreen = ({ navigation }) => {
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Modal state
  const [isModalVisible, setModalVisible] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [formType, setFormType] = useState('Home'); // Home, Work, Other
  const [formAddress, setFormAddress] = useState('');
  const [formCity, setFormCity] = useState('');
  const [formPincode, setFormPincode] = useState('');
  const [isDefault, setIsDefault] = useState(false);
  
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

  useFocusEffect(
    useCallback(() => {
      fetchAddresses();
    }, [fetchAddresses])
  );

  const openAddModal = () => {
    setEditingId(null);
    setFormType('Home');
    setFormAddress('');
    setFormCity('Surat');
    setFormPincode('');
    setIsDefault(addresses.length === 0);
    setModalVisible(true);
  };

  const openEditModal = (item) => {
    setEditingId(item._id);
    setFormType(item.type || 'Home');
    setFormAddress(item.addressLine || '');
    setFormCity(item.city || '');
    setFormPincode(item.pincode || '');
    setIsDefault(item.isDefault || false);
    setModalVisible(true);
  };

  const handleSave = async () => {
    if (!formAddress.trim() || !formCity.trim() || !formPincode.trim()) {
      Alert.alert('Validation Error', 'Please fill in all fields.');
      return;
    }
    
    const payload = {
      type: formType,
      addressLine: formAddress,
      city: formCity,
      pincode: formPincode,
      isDefault
    };

    try {
      if (editingId) {
        await addressAPI.update(editingId, payload);
      } else {
        await addressAPI.add(payload);
      }
      setModalVisible(false);
      fetchAddresses();
    } catch (e) {
      Alert.alert('Error', 'Failed to save address.');
    }
  };

  const handleDelete = async (id) => {
    try {
      await addressAPI.delete(id);
      fetchAddresses();
    } catch (e) {
      Alert.alert('Error', 'Failed to delete address.');
    }
  };

  const handleSetDefault = async (id) => {
    try {
      await addressAPI.setDefault(id);
      fetchAddresses();
    } catch (e) {
      Alert.alert('Error', 'Failed to set default address.');
    }
  };

  const getIconForType = (type) => {
    if (type === 'Home') return '🏠';
    if (type === 'Work') return '🏢';
    return '📍';
  };

  const renderRightActions = (progress, dragX, id) => {
    return (
      <TouchableOpacity 
        style={styles.deleteAction}
        onPress={() => {
          Alert.alert('Delete Address', 'Are you sure?', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Delete', style: 'destructive', onPress: () => handleDelete(id) }
          ]);
        }}
      >
        <Text style={styles.deleteActionText}>🗑️ Delete</Text>
      </TouchableOpacity>
    );
  };

  const renderItem = ({ item, index }) => (
    <Reanimated.View entering={FadeInUp.delay(index * 100).springify()}>
      <Swipeable
        ref={ref => {
          if (ref && !rowRefs.has(item._id)) rowRefs.set(item._id, ref);
        }}
        renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item._id)}
        onSwipeableWillOpen={() => {
          [...rowRefs.entries()].forEach(([key, ref]) => {
            if (key !== item._id && ref) ref.close();
          });
        }}
        friction={2}
        rightThreshold={40}
      >
        <View style={[styles.card, item.isDefault && styles.cardDefault]}>
          <View style={styles.iconBox}>
            <Text style={styles.icon}>{getIconForType(item.type)}</Text>
          </View>
          <View style={styles.content}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 4 }}>
              <Text style={styles.title}>{item.type || 'Address'}</Text>
              {item.isDefault && (
                <View style={styles.defaultBadge}>
                  <Text style={styles.defaultBadgeText}>DEFAULT</Text>
                </View>
              )}
            </View>
            <Text style={styles.body}>{item.addressLine}</Text>
            <Text style={styles.body}>{item.city}, {item.pincode}</Text>
          </View>
          <View style={styles.actionBtns}>
            <TouchableOpacity style={styles.iconBtn} onPress={() => openEditModal(item)}>
              <Text style={{ fontSize: 16 }}>✏️</Text>
            </TouchableOpacity>
            {!item.isDefault && (
              <TouchableOpacity style={[styles.iconBtn, { marginLeft: 8 }]} onPress={() => handleSetDefault(item._id)}>
                <Text style={{ fontSize: 16 }}>⭐</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </Swipeable>
    </Reanimated.View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Text style={styles.backBtnText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Saved Addresses</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={COLORS.primary} />
        </View>
      ) : (
        <FlatList
          data={addresses}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>📍</Text>
              <Text style={styles.emptyTitle}>No saved addresses</Text>
              <Text style={styles.emptyText}>Add your home or work address for faster booking.</Text>
            </View>
          }
        />
      )}

      <View style={styles.bottomBar}>
        <TouchableOpacity style={styles.addBtn} onPress={openAddModal} activeOpacity={0.8}>
          <Text style={styles.addBtnText}>+ Add New Address</Text>
        </TouchableOpacity>
      </View>

      {/* Add/Edit Modal */}
      <Modal visible={isModalVisible} animationType="slide" transparent>
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : undefined} 
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{editingId ? 'Edit Address' : 'Add Address'}</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
                <Text style={{ fontSize: 20 }}>✕</Text>
              </TouchableOpacity>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              <Text style={styles.label}>Address Type</Text>
              <View style={styles.typeRow}>
                {['Home', 'Work', 'Other'].map(type => (
                  <TouchableOpacity 
                    key={type}
                    style={[styles.typeChip, formType === type && styles.typeChipActive]}
                    onPress={() => setFormType(type)}
                  >
                    <Text style={[styles.typeChipText, formType === type && styles.typeChipTextActive]}>
                      {getIconForType(type)} {type}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.label}>House / Flat / Street *</Text>
              <TextInput
                style={[styles.input, { height: 80, textAlignVertical: 'top' }]}
                value={formAddress}
                onChangeText={setFormAddress}
                placeholder="e.g. B-204, Sunrise Apartment..."
                placeholderTextColor="#9CA3AF"
                multiline
              />

              <View style={{ flexDirection: 'row', gap: SPACING.md }}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>City *</Text>
                  <TextInput
                    style={styles.input}
                    value={formCity}
                    onChangeText={setFormCity}
                    placeholder="Surat"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.label}>Pincode *</Text>
                  <TextInput
                    style={styles.input}
                    value={formPincode}
                    onChangeText={setFormPincode}
                    keyboardType="numeric"
                    maxLength={6}
                    placeholder="395001"
                    placeholderTextColor="#9CA3AF"
                  />
                </View>
              </View>

              <TouchableOpacity 
                style={styles.checkboxRow}
                onPress={() => setIsDefault(!isDefault)}
              >
                <View style={[styles.checkbox, isDefault && styles.checkboxActive]}>
                  {isDefault && <Text style={{ color: '#FFF', fontSize: 12 }}>✓</Text>}
                </View>
                <Text style={styles.checkboxLabel}>Set as Default Address</Text>
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave} activeOpacity={0.8}>
                <Text style={styles.saveBtnText}>Save Address</Text>
              </TouchableOpacity>
              <View style={{ height: 40 }} />
            </ScrollView>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container:   { flex: 1, backgroundColor: '#F9FAFB' },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center' },
  
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: SPACING.lg, paddingTop: 60, paddingBottom: SPACING.md,
    backgroundColor: COLORS.white, borderBottomWidth: 1, borderBottomColor: '#F3F4F6'
  },
  backBtn:     { width: 40, height: 40, borderRadius: 20, backgroundColor: '#F5F7FA', alignItems: 'center', justifyContent: 'center' },
  backBtnText: { fontSize: 26, color: '#111827', fontWeight: '300', lineHeight: 28 },
  headerTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: '#111827' },

  list: { padding: SPACING.lg, paddingBottom: 100 },
  
  card: { 
    flexDirection: 'row', backgroundColor: COLORS.white,
    padding: SPACING.lg, marginBottom: SPACING.md, borderRadius: BORDER_RADIUS.lg,
    shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 8, elevation: 2,
    borderWidth: 1, borderColor: '#F3F4F6'
  },
  cardDefault: { borderColor: COLORS.primary, backgroundColor: '#F5F3FF' },
  
  iconBox: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#F3E8FD', alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  icon: { fontSize: 20 },
  
  content: { flex: 1 },
  title: { fontSize: FONT_SIZES.md, fontWeight: '700', color: '#111827' },
  body: { fontSize: 13, color: '#4B5563', marginTop: 2, lineHeight: 18 },
  
  defaultBadge: { backgroundColor: COLORS.primary, paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, marginLeft: 8 },
  defaultBadgeText: { color: COLORS.white, fontSize: 9, fontWeight: '800' },

  actionBtns: { flexDirection: 'row', alignItems: 'center' },
  iconBtn: { padding: 8, backgroundColor: '#F3F4F6', borderRadius: 8 },

  deleteAction: { backgroundColor: '#EF4444', justifyContent: 'center', alignItems: 'center', width: 90, marginBottom: SPACING.md, borderRadius: BORDER_RADIUS.lg, marginLeft: SPACING.sm },
  deleteActionText: { color: '#FFF', fontWeight: '800', fontSize: FONT_SIZES.sm },

  empty: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { fontSize: 64, marginBottom: SPACING.lg },
  emptyTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: '#111827', marginBottom: SPACING.xs },
  emptyText: { fontSize: FONT_SIZES.sm, color: '#6B7280', textAlign: 'center', maxWidth: 250, lineHeight: 20 },

  bottomBar: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.white, padding: SPACING.lg, paddingBottom: 30, borderTopWidth: 1, borderTopColor: '#F3F4F6', ...SHADOWS.md },
  addBtn: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: BORDER_RADIUS.lg, alignItems: 'center' },
  addBtnText: { color: COLORS.white, fontSize: FONT_SIZES.md, fontWeight: '700' },

  // Modal Styles
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: COLORS.white, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: SPACING.xl, maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: SPACING.xl },
  modalTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: '#111827' },
  closeBtn: { padding: SPACING.xs },
  
  label: { fontSize: FONT_SIZES.sm, fontWeight: '600', color: '#4B5563', marginBottom: 8, marginTop: SPACING.lg },
  input: { backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', borderRadius: 12, paddingHorizontal: SPACING.lg, paddingVertical: SPACING.md, fontSize: FONT_SIZES.md, color: '#111827' },
  
  typeRow: { flexDirection: 'row', gap: SPACING.md },
  typeChip: { paddingHorizontal: SPACING.md, paddingVertical: SPACING.sm, borderRadius: BORDER_RADIUS.md, borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#F9FAFB' },
  typeChipActive: { borderColor: COLORS.primary, backgroundColor: '#F5F3FF' },
  typeChipText: { fontSize: FONT_SIZES.sm, color: '#4B5563', fontWeight: '500' },
  typeChipTextActive: { color: COLORS.primary, fontWeight: '700' },

  checkboxRow: { flexDirection: 'row', alignItems: 'center', marginTop: SPACING.xl, marginBottom: SPACING.lg },
  checkbox: { width: 20, height: 20, borderRadius: 4, borderWidth: 2, borderColor: '#D1D5DB', alignItems: 'center', justifyContent: 'center', marginRight: SPACING.md },
  checkboxActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  checkboxLabel: { fontSize: FONT_SIZES.md, color: '#374151', fontWeight: '500' },

  saveBtn: { backgroundColor: COLORS.primary, paddingVertical: 16, borderRadius: BORDER_RADIUS.lg, alignItems: 'center', marginTop: SPACING.lg },
  saveBtnText: { color: COLORS.white, fontSize: FONT_SIZES.md, fontWeight: '700' }
});

export default SavedAddressesScreen;
