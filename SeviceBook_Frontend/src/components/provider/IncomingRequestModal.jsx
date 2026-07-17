import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration, Platform, ActivityIndicator } from 'react-native';
import Modal from 'react-native-modal';
import { Bell, MapPin, Wrench, IndianRupee, X } from 'lucide-react-native';
import { COLORS, FONT_SIZES, SPACING, SHADOWS, BORDER_RADIUS } from '../../theme/typography';
import { PrimaryButton } from '../ui/PrimaryButton';
import { bookingAPI } from '../../api/booking.api';
import { Card } from '../ui/Card';

const IncomingRequestModal = ({ isVisible, requestData, onAccept, onDecline }) => {
  const [timeLeft, setTimeLeft] = useState(30);
  const [fullData, setFullData] = useState(null);
  const [loadingData, setLoadingData] = useState(false);

  useEffect(() => {
    let timer;
    if (isVisible && requestData) {
      setTimeLeft(30);
      setFullData(null);
      setLoadingData(true);
      
      const fetchFull = async () => {
        try {
          const res = await bookingAPI.getById(requestData.bookingId || requestData._id);
          setFullData(res.data.data);
        } catch (e) {
          setFullData(requestData);
        } finally {
          setLoadingData(false);
        }
      };
      fetchFull();
      
      // Vibrate pattern
      Vibration.vibrate([0, 1000, 1000], true);

      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            Vibration.cancel();
            onDecline(requestData?.bookingId || requestData?._id); 
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      Vibration.cancel();
    }

    return () => {
      clearInterval(timer);
      Vibration.cancel();
    };
  }, [isVisible, requestData]);

  const handleAccept = () => {
    Vibration.cancel();
    onAccept(requestData?.bookingId || requestData?._id);
  };

  const handleDecline = () => {
    Vibration.cancel();
    onDecline(requestData?.bookingId || requestData?._id);
  };

  if (!requestData) return null;
  
  const displayData = fullData || requestData;
  const progressPercent = (timeLeft / 30) * 100;

  return (
    <Modal
      isVisible={isVisible}
      backdropOpacity={COLORS.overlay ? 0.6 : 0.8}
      backdropColor="#111827"
      animationIn="slideInUp"
      animationOut="slideOutDown"
      style={styles.modal}
      useNativeDriver
      hideModalContentWhileAnimating
    >
      <View style={styles.container}>
        {/* Close/Reject cross button */}
        <TouchableOpacity style={styles.closeBtn} onPress={handleDecline}>
          <X size={24} color={COLORS.textTertiary} />
        </TouchableOpacity>

        <View style={styles.header}>
          <View style={styles.iconContainer}>
            <Bell size={32} color={COLORS.white} />
          </View>
          <Text style={styles.title}>New Service Request!</Text>
        </View>
        
        {/* Distance/Address Info inside Premium Card */}
        <Card style={styles.infoCard} noPadding>
          {loadingData ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color={COLORS.primary} />
            </View>
          ) : (
            <View style={styles.infoContent}>
              <View style={styles.row}>
                <View style={styles.iconBox}>
                  <MapPin size={20} color={COLORS.primary} />
                </View>
                <Text style={styles.infoText} numberOfLines={2}>
                  {displayData?.address?.addressLine || displayData?.address?.city || 'Address not specified'}
                </Text>
              </View>
              <View style={styles.divider} />
              
              <View style={styles.row}>
                <View style={styles.iconBox}>
                  <Wrench size={20} color={COLORS.secondary} />
                </View>
                <Text style={styles.infoText}>
                  {displayData?.categoryId?.name 
                    ? `${displayData.categoryId.name} (${displayData?.subService?.name || 'General'})`
                    : displayData?.category || 'Service required'}
                </Text>
              </View>
              <View style={styles.divider} />

              <View style={styles.row}>
                <View style={styles.iconBox}>
                  <IndianRupee size={20} color={COLORS.success} />
                </View>
                <Text style={styles.priceText}>
                  ₹{displayData?.pricing?.totalAmount || displayData?.totalAmount || 0}
                </Text>
              </View>
            </View>
          )}
        </Card>

        {/* Minimalist Countdown Timer */}
        <View style={styles.timerWrapper}>
          <View style={[styles.timerContainer, { borderColor: timeLeft > 10 ? COLORS.primary : COLORS.danger }]}>
            <Text style={[styles.timerText, { color: timeLeft > 10 ? COLORS.primary : COLORS.danger }]}>{timeLeft}s</Text>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <PrimaryButton
            title="Decline"
            variant="outline"
            onPress={handleDecline}
            style={styles.btnOutline}
            textStyle={{ color: COLORS.textSecondary }}
          />
          <View style={{ width: SPACING.md }} />
          <PrimaryButton
            title="Accept Request"
            variant="primary"
            onPress={handleAccept}
            style={styles.btnPrimary}
          />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: BORDER_RADIUS.xxl,
    borderTopRightRadius: BORDER_RADIUS.xxl,
    padding: SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.lg,
  },
  closeBtn: {
    position: 'absolute',
    top: SPACING.lg,
    right: SPACING.lg,
    padding: SPACING.sm,
    zIndex: 10,
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.round,
  },
  header: {
    alignItems: 'center',
    marginBottom: SPACING.lg,
    marginTop: SPACING.sm,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.md,
  },
  title: {
    fontSize: FONT_SIZES.xxxl,
    fontWeight: '700',
    color: COLORS.textPrimary,
    letterSpacing: -0.5,
  },
  infoCard: {
    width: '100%',
    backgroundColor: COLORS.background,
    borderWidth: 0,
    marginBottom: SPACING.xl,
    minHeight: 120,
  },
  infoContent: {
    padding: SPACING.lg,
  },
  loaderContainer: {
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: COLORS.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: SPACING.md,
    ...SHADOWS.sm,
  },
  infoText: {
    fontSize: FONT_SIZES.lg,
    color: COLORS.textSecondary,
    flex: 1,
    fontWeight: '500',
  },
  priceText: {
    fontSize: FONT_SIZES.xxl,
    color: COLORS.textPrimary,
    fontWeight: '700',
    flex: 1,
  },
  divider: {
    height: 1,
    backgroundColor: COLORS.divider,
    marginVertical: SPACING.md,
    marginLeft: 52, // Align with text
  },
  timerWrapper: {
    marginBottom: SPACING.xl,
    alignItems: 'center',
  },
  timerContainer: {
    width: 72,
    height: 72,
    borderRadius: 36,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: COLORS.surface,
    ...SHADOWS.sm,
  },
  timerText: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: '800',
  },
  actionRow: {
    flexDirection: 'row',
    width: '100%',
  },
  btnOutline: {
    flex: 1,
    backgroundColor: COLORS.surface,
    borderWidth: 1.5,
    borderColor: COLORS.border,
  },
  btnPrimary: {
    flex: 1.5,
  },
});

export default IncomingRequestModal;
