import React, { useState } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  TextInput, SafeAreaView, StatusBar, Platform, Image, ScrollView
} from 'react-native';
import Animated, { FadeInUp, FadeInDown, Layout } from 'react-native-reanimated';
import { COLORS, FONT_SIZES, SPACING, BORDER_RADIUS, SHADOWS } from '../../theme/typography';
import { ChevronLeft, Search, Check, Plus, Star, ShieldCheck, Clock, CheckCircle2, XCircle } from 'lucide-react-native';
import { PrimaryButton } from '../../components/ui/PrimaryButton';
import { Card } from '../../components/ui/Card';

const CATEGORY_IMAGES = {
  electrician: 'https://images.pexels.com/photos/8853503/pexels-photo-8853503.jpeg?auto=compress&cs=tinysrgb&w=800',
  plumb: 'https://images.pexels.com/photos/6419128/pexels-photo-6419128.jpeg?auto=compress&cs=tinysrgb&w=800',
  ac: 'https://images.pexels.com/photos/3680454/pexels-photo-3680454.jpeg?auto=compress&cs=tinysrgb&w=800',
  clean: 'https://images.pexels.com/photos/4108715/pexels-photo-4108715.jpeg?auto=compress&cs=tinysrgb&w=800',
  paint: 'https://images.pexels.com/photos/1669754/pexels-photo-1669754.jpeg?auto=compress&cs=tinysrgb&w=800',
  carpent: 'https://images.pexels.com/photos/1260968/pexels-photo-1260968.jpeg?auto=compress&cs=tinysrgb&w=800',
  appliance: 'https://images.pexels.com/photos/2251247/pexels-photo-2251247.jpeg?auto=compress&cs=tinysrgb&w=800',
  salon: 'https://images.pexels.com/photos/3951881/pexels-photo-3951881.jpeg?auto=compress&cs=tinysrgb&w=800',
  washing: 'https://images.pexels.com/photos/5591460/pexels-photo-5591460.jpeg?auto=compress&cs=tinysrgb&w=800',
  refrigerat: 'https://images.pexels.com/photos/2103445/pexels-photo-2103445.jpeg?auto=compress&cs=tinysrgb&w=800',
  pest: 'https://images.pexels.com/photos/7365020/pexels-photo-7365020.jpeg?auto=compress&cs=tinysrgb&w=800',
};

const CATEGORY_METADATA = {
  ac: {
    description: 'Professional AC technicians providing installation, repair, gas refilling, cooling diagnostics and maintenance.',
    included: ['Cooling diagnosis', 'Gas pressure check', 'Electrical inspection', 'Filter cleaning', 'Performance testing', 'Safety inspection'],
    notIncluded: ['Gas refill cost', 'Compressor replacement', 'Spare parts'],
  },
  washing: {
    description: 'Expert repair for front-load, top-load and fully automatic washing machines.',
    included: ['Drum inspection', 'Motor diagnosis', 'Water leakage inspection', 'Electrical testing', 'Functional testing'],
    notIncluded: ['Spare parts', 'Major motor replacement', 'Drum replacement'],
  },
  electrician: {
    description: 'Certified electricians for wiring, switches, fans, lights and electrical troubleshooting.',
    included: ['Wiring inspection', 'Switch testing', 'Safety check', 'Load testing', 'Connection tightening'],
    notIncluded: ['Wiring materials', 'Switch replacement', 'New installation materials'],
  },
  plumb: {
    description: 'Expert plumbers for leakages, pipe blockages, tap installations and bathroom fittings.',
    included: ['Leakage detection', 'Water pressure check', 'Pipe inspection', 'Basic unclogging', 'Post-service cleanup'],
    notIncluded: ['Replacement pipes', 'New taps or fixtures', 'Major structural work'],
  },
  pest: {
    description: 'Professional pest control for termites, cockroaches, rodents, and general insects.',
    included: ['Thorough inspection', 'Safe chemical spray', 'Corner and crevice treatment', '30-day warranty'],
    notIncluded: ['Deep cleaning', 'Structural wood repair'],
  },
  clean: {
    description: 'Deep cleaning services for homes, apartments, and offices by trained professionals.',
    included: ['Dusting and wiping', 'Floor scrubbing', 'Bathroom deep clean', 'Kitchen degreasing', 'Post-service inspection'],
    notIncluded: ['Upholstery shampooing', 'Exterior window cleaning', 'Heavy furniture moving'],
  },
  paint: {
    description: 'Professional interior and exterior painting with texture and waterproofing options.',
    included: ['Surface preparation', 'Crack filling', 'Primer application', 'Two coats of paint', 'Post-painting cleanup'],
    notIncluded: ['Paint cost (if not specified)', 'Major wall repair', 'Scaffolding charges'],
  },
  carpent: {
    description: 'Skilled carpenters for furniture assembly, repair, door fittings and custom woodwork.',
    included: ['Joint inspection', 'Hardware tightening', 'Basic wood gluing', 'Alignment check', 'Surface leveling'],
    notIncluded: ['New wood materials', 'Replacement hardware', 'Major polishing'],
  },
  refrigerat: {
    description: 'Certified technicians for single-door, double-door and side-by-side refrigerator repair.',
    included: ['Cooling diagnosis', 'Compressor check', 'Gas level inspection', 'Door seal check', 'Thermostat testing'],
    notIncluded: ['Gas refill (charged extra)', 'Compressor replacement', 'New door seals'],
  },
  appliance: {
    description: 'Expert repair for microwaves, ovens, geysers, and other home appliances.',
    included: ['Electrical testing', 'Heating diagnosis', 'Component inspection', 'Safety check', 'Functional testing'],
    notIncluded: ['Replacement parts', 'Major circuit board repair'],
  },
  salon: {
    description: 'Premium at-home salon services by top-rated beauty professionals.',
    included: ['High-quality products', 'Sanitized equipment', 'Disposable sheets', 'Post-service cleanup'],
    notIncluded: ['Specialized treatments not listed', 'Personal product requests'],
  },
  default: {
    description: 'Professional and verified experts delivering high-quality service directly to your doorstep. Complete satisfaction guaranteed.',
    included: ['Fully equipped professionals', 'Post-service cleanup', '30-day service warranty'],
    notIncluded: ['Spare parts (charged extra at market rate)'],
  }
};

const getCategoryMetadata = (categoryName) => {
  const defaultMeta = {
    image: 'https://images.pexels.com/photos/4108715/pexels-photo-4108715.jpeg?auto=compress&cs=tinysrgb&w=800',
    ...CATEGORY_METADATA.default
  };
  if (!categoryName) return defaultMeta;
  
  const name = categoryName.toLowerCase();
  let matchedKey = null;
  
  for (const key of Object.keys(CATEGORY_IMAGES)) {
    if (name.includes(key)) {
      matchedKey = key;
      break;
    }
  }

  if (matchedKey) {
    return {
      image: CATEGORY_IMAGES[matchedKey],
      ...(CATEGORY_METADATA[matchedKey] || CATEGORY_METADATA.default)
    };
  }
  return defaultMeta;
};

const ServiceOptionsScreen = ({ navigation, route }) => {
  const { category } = route.params;
  const [selectedOptions, setSelectedOptions] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showDetails, setShowDetails] = useState(false);

  const subServices = category?.subServices || [];
  const meta = getCategoryMetadata(category?.name);

  const filteredOptions = subServices.filter(opt =>
    opt.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSelectOption = (opt) => {
    setSelectedOptions(prev => {
      const exists = prev.some(item => item._id === opt._id);
      if (exists) return prev.filter(item => item._id !== opt._id);
      return [...prev, opt];
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
      convenienceFee,
      totalAmount: totalBasePrice + convenienceFee
    });
  };

  const totalSelectedPrice = selectedOptions.reduce((sum, opt) => sum + opt.price, 0);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
      
      {/* Back Button (Absolute) */}
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <ChevronLeft size={28} color={COLORS.textPrimary} />
      </TouchableOpacity>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Hero Section */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: meta.image }} style={styles.heroImage} />
          <View style={styles.heroOverlay}>
            <Animated.View entering={FadeInUp.delay(100).springify()}>
              <Text style={styles.heroTitle}>{category?.name}</Text>
              <View style={styles.heroMetaRow}>
                <View style={styles.heroBadge}>
                  <Star size={14} color={COLORS.star} fill={COLORS.star} />
                  <Text style={styles.heroBadgeTxt}>4.8 (12k reviews)</Text>
                </View>
                <View style={styles.heroBadge}>
                  <ShieldCheck size={14} color={COLORS.primary} />
                  <Text style={[styles.heroBadgeTxt, { color: COLORS.primary }]}>Verified Professionals</Text>
                </View>
              </View>
            </Animated.View>
          </View>
        </View>

        {/* What's Included Card */}
        <Animated.View entering={FadeInUp.delay(200).springify()}>
          <Card style={styles.infoCard}>
            <Text style={styles.infoTitle}>About {category?.name} Service</Text>
            <Text style={styles.infoDesc}>{meta.description}</Text>
            
            <View style={styles.divider} />
            
            <Text style={styles.listTitle}>What's Included</Text>
            {meta.included.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <CheckCircle2 size={16} color={COLORS.success} />
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}

            <View style={{ height: SPACING.sm }} />
            <Text style={styles.listTitle}>What's Not Included</Text>
            {meta.notIncluded.map((item, index) => (
              <View key={index} style={styles.listItem}>
                <XCircle size={16} color={COLORS.danger} />
                <Text style={styles.listText}>{item}</Text>
              </View>
            ))}
          </Card>
        </Animated.View>

        {/* Services Selection Header */}
        <View style={styles.selectionHeader}>
          <Text style={styles.selectionTitle}>Select Services</Text>
          <View style={styles.searchBox}>
            <Search size={18} color={COLORS.textTertiary} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor={COLORS.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
        </View>

        {/* Options List */}
        {filteredOptions.length === 0 ? (
          <Animated.View entering={FadeInUp.delay(300).springify()} style={styles.premiumEmpty}>
            <View style={styles.emptyIconBox}>
              <Search size={32} color={COLORS.primary} />
            </View>
            <Text style={styles.emptyTitle}>No Services Available</Text>
            <Text style={styles.emptySubtitle}>We couldn't find any specific services for this category right now. Please try again later.</Text>
          </Animated.View>
        ) : (
          filteredOptions.map((item, index) => {
            const isSelected = selectedOptions.some(opt => opt._id === item._id);
            return (
              <Animated.View key={item._id} entering={FadeInUp.delay(300 + index * 50).springify()} layout={Layout.springify()}>
                <TouchableOpacity
                  style={[styles.optionCard, isSelected && styles.optionCardActive]}
                  onPress={() => handleSelectOption(item)}
                  activeOpacity={0.8}
                >
                  <View style={styles.optionInfo}>
                    <Text style={styles.optionName}>{item.name}</Text>
                    <View style={styles.optionMeta}>
                      <Text style={styles.optionPrice}>₹{item.price}</Text>
                      <Text style={styles.metaDivider}>•</Text>
                      <Clock size={12} color={COLORS.textSecondary} style={{ marginRight: 4 }} />
                      <Text style={styles.optionDuration}>{item.duration || 60} mins</Text>
                    </View>
                    <Text style={styles.optionDesc} numberOfLines={2}>
                      Expert {item.name.toLowerCase()} service with standard diagnostics and repair.
                    </Text>
                  </View>
                  <View style={[styles.selectBox, isSelected && styles.selectBoxActive]}>
                    {isSelected ? (
                      <Check size={18} color={COLORS.white} />
                    ) : (
                      <Plus size={18} color={COLORS.primary} />
                    )}
                    <Text style={[styles.selectText, isSelected && styles.selectTextActive]}>
                      {isSelected ? 'Added' : 'Add'}
                    </Text>
                  </View>
                </TouchableOpacity>
              </Animated.View>
            );
          })
        )}
        
        <View style={{ height: 120 }} />
      </ScrollView>

      {/* Bottom Sticky Proceed Panel */}
      {selectedOptions.length > 0 && (
        <Animated.View entering={FadeInDown.springify().damping(15)} style={styles.bottomPanel}>
          <View style={styles.bottomInfo}>
            <Text style={styles.totalPrice}>₹{totalSelectedPrice}</Text>
            <Text style={styles.selectedCount}>{selectedOptions.length} Service{selectedOptions.length > 1 ? 's' : ''} added</Text>
          </View>
          <PrimaryButton 
            title="Continue" 
            onPress={handleProceed} 
            style={styles.proceedBtn}
          />
        </Animated.View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: COLORS.background },
  scrollContent: { paddingBottom: 0 },
  
  backBtn: {
    position: 'absolute', top: Platform.OS === 'ios' ? 60 : 40, left: SPACING.lg, zIndex: 100,
    width: 44, height: 44, borderRadius: 22, backgroundColor: COLORS.surface,
    alignItems: 'center', justifyContent: 'center', ...SHADOWS.md
  },

  heroContainer: { height: 320, width: '100%', position: 'relative' },
  heroImage: { width: '100%', height: '100%' },
  heroOverlay: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    padding: SPACING.xl, paddingTop: 60,
    backgroundColor: 'rgba(0,0,0,0.4)', // Simulating gradient overlay
  },
  heroTitle: { fontSize: 32, fontWeight: '900', color: COLORS.white, letterSpacing: -0.5, marginBottom: SPACING.sm },
  heroMetaRow: { flexDirection: 'row', gap: SPACING.sm },
  heroBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, paddingHorizontal: 12, paddingVertical: 6, borderRadius: BORDER_RADIUS.round },
  heroBadgeTxt: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.textPrimary, marginLeft: 4 },

  infoCard: { margin: SPACING.lg, marginTop: -20, backgroundColor: COLORS.surface },
  infoTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.textPrimary, marginBottom: SPACING.xs },
  infoDesc: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 20 },
  divider: { height: 1, backgroundColor: COLORS.divider, marginVertical: SPACING.md },
  listTitle: { fontSize: FONT_SIZES.md, fontWeight: '700', color: COLORS.textPrimary, marginBottom: SPACING.sm },
  listItem: { flexDirection: 'row', alignItems: 'center', marginBottom: SPACING.xs },
  listText: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, marginLeft: SPACING.sm },

  selectionHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: SPACING.lg, marginBottom: SPACING.md },
  selectionTitle: { fontSize: FONT_SIZES.xl, fontWeight: '800', color: COLORS.textPrimary },
  searchBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.lg, paddingHorizontal: SPACING.sm, height: 40, width: 140, borderWidth: 1, borderColor: COLORS.border },
  searchInput: { flex: 1, fontSize: FONT_SIZES.sm, color: COLORS.textPrimary, marginLeft: SPACING.xs },

  optionCard: {
    flexDirection: 'row', backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xl,
    padding: SPACING.lg, marginHorizontal: SPACING.lg, marginBottom: SPACING.md,
    borderWidth: 1.5, borderColor: COLORS.border, alignItems: 'center', ...SHADOWS.sm
  },
  optionCardActive: { borderColor: COLORS.primary, backgroundColor: COLORS.primaryLight },
  optionInfo: { flex: 1, paddingRight: SPACING.md },
  optionName: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.textPrimary },
  optionMeta: { flexDirection: 'row', alignItems: 'center', marginTop: 4, marginBottom: 6 },
  optionPrice: { fontSize: FONT_SIZES.md, fontWeight: '800', color: COLORS.primary },
  metaDivider: { color: COLORS.textTertiary, marginHorizontal: SPACING.xs },
  optionDuration: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '500' },
  optionDesc: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, lineHeight: 18 },

  selectBox: {
    paddingHorizontal: SPACING.md, paddingVertical: 8, borderRadius: BORDER_RADIUS.md,
    borderWidth: 1.5, borderColor: COLORS.primary, backgroundColor: COLORS.surface,
    alignItems: 'center', flexDirection: 'row', gap: 4
  },
  selectBoxActive: { backgroundColor: COLORS.primary, borderColor: COLORS.primary },
  selectText: { fontSize: FONT_SIZES.sm, fontWeight: '700', color: COLORS.primary },
  selectTextActive: { color: COLORS.white },

  bottomPanel: {
    position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xxl, borderTopRightRadius: BORDER_RADIUS.xxl,
    paddingHorizontal: SPACING.xl, paddingVertical: SPACING.lg, paddingBottom: Platform.OS === 'ios' ? 32 : SPACING.lg,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', ...SHADOWS.lg
  },
  bottomInfo: { flex: 1 },
  selectedCount: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, fontWeight: '600' },
  totalPrice: { fontSize: FONT_SIZES.xxl, fontWeight: '900', color: COLORS.textPrimary },
  proceedBtn: { width: 140 },

  premiumEmpty: { alignItems: 'center', justifyContent: 'center', padding: SPACING.xl, marginTop: SPACING.lg, backgroundColor: COLORS.surface, borderRadius: BORDER_RADIUS.xxl, borderWidth: 1, borderColor: COLORS.border },
  emptyIconBox: { width: 64, height: 64, borderRadius: 32, backgroundColor: COLORS.primaryLight, alignItems: 'center', justifyContent: 'center', marginBottom: SPACING.md },
  emptyTitle: { fontSize: FONT_SIZES.lg, fontWeight: '800', color: COLORS.textPrimary, marginBottom: 4 },
  emptySubtitle: { fontSize: FONT_SIZES.sm, color: COLORS.textSecondary, textAlign: 'center', lineHeight: 20 }
});

export default ServiceOptionsScreen;
