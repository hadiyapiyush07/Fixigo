// src/screens/customer/ServiceOptionsScreen.jsx
import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, SafeAreaView, StatusBar, Platform
} from 'react-native';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';

const CATEGORY_EMOJIS = {
  'Electrician':      '⚡',
  'Plumber':          '🔧',
  'AC Repair':        '❄️',
  'Home Cleaning':    '🧹',
  'Painting':         '🎨',
  'Carpenter':        '🪚',
  'RO Service':       '🚰',
  'Pest Control':     '🐛',
  'CCTV Installation':'📹',
  'Water Purifier Service': '💧',
  'Washing Machine Repair': '🧺',
  'Refrigerator Repair':    '🚪',
};

const ServiceOptionsScreen = ({ navigation, route }) => {
  const { category } = route.params;
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  const subServices = category?.subServices || [];
  const emoji = CATEGORY_EMOJIS[category?.name] || '🛠️';

  const filteredOptions = subServices.filter(opt =>
    opt.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectOption = (opt) => {
    setSelectedOptions(prev => {
      const exists = prev.some(item => item._id === opt._id);
      if (exists) {
        return prev.filter(item => item._id !== opt._id);
      } else {
        return [...prev, opt];
      }
    });
  };

  const handleProceed = () => {
    if (selectedOptions.length === 0) return;
    
    const totalBasePrice = selectedOptions.reduce((sum, opt) => sum + opt.price, 0);
    const totalDuration = selectedOptions.reduce((sum, opt) => sum + (opt.duration || 60), 0);

    const convenienceFee = totalBasePrice < 200 ? 29 : 49;

    navigation.navigate('CreateBooking', {
      categoryId: category._id,
      categoryName: category.name,
      subServices: selectedOptions,
      basePrice: totalBasePrice,
      duration: totalDuration,
      // Default calculations
      convenienceFee,
      totalAmount: totalBasePrice + convenienceFee
    });
  };

  const renderOptionItem = ({ item }) => {
    const isSelected = selectedOptions.some(opt => opt._id === item._id);
    return (
      <TouchableOpacity
        style={[styles.optionCard, isSelected && styles.optionCardActive]}
        onPress={() => handleSelectOption(item)}
        activeOpacity={0.9}
      >
        <View style={styles.optionInfo}>
          <Text style={styles.optionName}>{item.name}</Text>
          <View style={styles.optionMeta}>
            <Text style={styles.optionPrice}>₹{item.price}</Text>
            <Text style={styles.metaDivider}>•</Text>
            <Text style={styles.optionDuration}>⏱ {item.duration || 60} mins</Text>
          </View>
          <Text style={styles.optionDesc} numberOfLines={2}>
            Professional {item.name.toLowerCase()} service including complete setup and checkup.
          </Text>
        </View>
        <View style={[styles.selectBox, isSelected && styles.selectBoxActive]}>
          {isSelected ? (
            <Text style={styles.selectTextActive}>✓ Added</Text>
          ) : (
            <Text style={styles.selectText}>+ Add</Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  const totalSelectedPrice = selectedOptions.reduce((sum, opt) => sum + opt.price, 0);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.white} />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>‹</Text>
        </TouchableOpacity>
        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>{category?.name}</Text>
          <Text style={styles.headerSub}>{emoji} Select Service Options</Text>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchBox}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder={`Search in ${category?.name}...`}
            placeholderTextColor={COLORS.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>
      </View>

      {/* Options List */}
      <FlatList
        data={filteredOptions}
        keyExtractor={item => item._id || item.name}
        renderItem={renderOptionItem}
        contentContainerStyle={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyText}>No services options found</Text>
            <Text style={styles.emptySub}>Try searching for something else</Text>
          </View>
        }
      />

      {/* Bottom Proceed Panel */}
      {selectedOptions.length > 0 && (
        <View style={styles.bottomPanel}>
          <View style={styles.bottomInfo}>
            <Text style={styles.selectedCount}>{selectedOptions.length} Service{selectedOptions.length > 1 ? 's' : ''} Selected</Text>
            <Text style={styles.totalPrice}>₹{totalSelectedPrice} <Text style={styles.feeLabel}>+ fees</Text></Text>
          </View>
          <TouchableOpacity style={styles.proceedBtn} onPress={handleProceed} activeOpacity={0.85}>
            <Text style={styles.proceedText}>Proceed to Details  →</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: SPACING.xl,
    paddingTop: Platform.OS === 'ios' ? 0 : SPACING.lg,
    paddingBottom: SPACING.md,
    backgroundColor: COLORS.white,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    ...SHADOWS.sm
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.background,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: SPACING.md
  },
  backIcon: { fontSize: 26, color: COLORS.textPrimary, fontWeight: '300', lineHeight: 28, textAlign: 'center' },
  titleContainer: { flex: 1 },
  headerTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary },
  headerSub: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 2, fontWeight: '500' },

  searchContainer: { padding: SPACING.md, backgroundColor: COLORS.white },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    paddingHorizontal: SPACING.md,
    borderWidth: 1,
    borderColor: COLORS.border
  },
  searchIcon: { fontSize: 16, marginRight: SPACING.sm },
  searchInput: { flex: 1, paddingVertical: SPACING.sm, fontSize: FONT_SIZES.md, color: COLORS.textPrimary },

  list: { padding: SPACING.md, paddingBottom: 100 },
  optionCard: {
    flexDirection: 'row',
    backgroundColor: COLORS.white,
    borderRadius: BORDER_RADIUS.lg,
    padding: SPACING.lg,
    marginBottom: SPACING.md,
    borderWidth: 1.5,
    borderColor: COLORS.border,
    alignItems: 'center',
    ...SHADOWS.sm
  },
  optionCardActive: {
    borderColor: COLORS.primary,
    backgroundColor: COLORS.primaryLight
  },
  optionInfo: { flex: 1, paddingRight: SPACING.md },
  optionName: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary },
  optionMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  optionPrice: { fontSize: FONT_SIZES.md, fontWeight: '800', color: COLORS.primary },
  metaDivider: { color: COLORS.textTertiary, marginHorizontal: SPACING.xs },
  optionDuration: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary },
  optionDesc: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: SPACING.sm },

  selectBox: {
    paddingHorizontal: SPACING.md,
    paddingVertical: 6,
    borderRadius: BORDER_RADIUS.sm,
    borderWidth: 1,
    borderColor: COLORS.primary,
    backgroundColor: COLORS.white,
    minWidth: 70,
    alignItems: 'center'
  },
  selectBoxActive: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary
  },
  selectText: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.primary },
  selectTextActive: { fontSize: FONT_SIZES.xs, fontWeight: '700', color: COLORS.white },

  bottomPanel: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: COLORS.white,
    borderTopWidth: 1,
    borderTopColor: COLORS.border,
    paddingHorizontal: SPACING.xl,
    paddingVertical: SPACING.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    ...SHADOWS.lg
  },
  bottomInfo: { flex: 1 },
  selectedCount: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontWeight: '500' },
  totalPrice: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.textPrimary },
  feeLabel: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, fontWeight: 'normal' },
  proceedBtn: {
    backgroundColor: COLORS.primary,
    paddingHorizontal: SPACING.xl,
    paddingVertical: 12,
    borderRadius: BORDER_RADIUS.lg,
    ...SHADOWS.md
  },
  proceedText: { color: COLORS.white, fontSize: FONT_SIZES.md, fontWeight: '700' },

  empty: { alignItems: 'center', padding: 40 },
  emptyIcon: { fontSize: 48, marginBottom: SPACING.md },
  emptyText: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary },
  emptySub: { fontSize: FONT_SIZES.xs, color: COLORS.textSecondary, marginTop: 4 }
});

export default ServiceOptionsScreen;
