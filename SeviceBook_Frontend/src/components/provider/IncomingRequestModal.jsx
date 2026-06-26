import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Vibration, Platform, ActivityIndicator } from 'react-native';
import Modal from 'react-native-modal';
import { COLORS, FONT_SIZES, SPACING, SHADOWS, BORDER_RADIUS } from '../../theme/typography';
import { PrimaryButton } from '../ui/PrimaryButton';
import { bookingAPI } from '../../api/booking.api';

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
      
      // Vibrate pattern: wait 0, vibrate 1s, pause 1s
      Vibration.vibrate([0, 1000, 1000], true);

      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timer);
            Vibration.cancel();
            onDecline(requestData?.bookingId || requestData?._id); // Auto-decline if timeout
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

  return (
    <Modal
      isVisible={isVisible}
      backdropOpacity={0.8}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      style={styles.modal}
      useNativeDriver
      hideModalContentWhileAnimating
    >
      <View style={styles.container}>
        {/* Close/Reject cross button */}
        <TouchableOpacity style={styles.closeBtn} onPress={handleDecline}>
          <Text style={{ fontSize: 24, color: COLORS.textSecondary }}>✖</Text>
        </TouchableOpacity>

        {/* Pulsing Bell Icon (or any Icon) */}
        <View style={styles.iconContainer}>
          <Text style={{ fontSize: 36 }}>🔔</Text>
        </View>

        <Text style={styles.title}>New Service Request!</Text>
        
        {/* Distance/Address Info */}
        <View style={styles.card}>
          {loadingData ? (
            <ActivityIndicator size="small" color={COLORS.primary} style={{ marginVertical: SPACING.md }} />
          ) : (
            <>
              <View style={styles.row}>
                <Text style={{ fontSize: 20 }}>📍</Text>
                <Text style={styles.infoText} numberOfLines={2}>
                  {displayData?.address?.addressLine || displayData?.address?.city || 'Address not specified'}
                </Text>
              </View>
              <View style={[styles.row, { marginTop: SPACING.md }]}>
                <Text style={{ fontSize: 20 }}>🛠️</Text>
                <Text style={styles.infoText}>
                  {displayData?.categoryId?.name 
                    ? `${displayData.categoryId.name} (${displayData?.subService?.name || 'General'})`
                    : displayData?.category || 'Service required'}
                </Text>
              </View>
              <View style={[styles.row, { marginTop: SPACING.md }]}>
                <Text style={{ fontSize: 20 }}>💵</Text>
                <Text style={[styles.infoText, { fontWeight: 'bold' }]}>
                  ₹{displayData?.pricing?.totalAmount || displayData?.totalAmount || 0}
                </Text>
              </View>
            </>
          )}
        </View>

        {/* Circular Countdown Timer */}
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{timeLeft}s</Text>
        </View>

        {/* Action Buttons */}
        <View style={styles.actionRow}>
          <PrimaryButton
            title="Decline"
            variant="outline"
            onPress={handleDecline}
            style={styles.btn}
            textStyle={{ color: COLORS.textSecondary }}
          />
          <View style={{ width: SPACING.md }} />
          <PrimaryButton
            title="Accept"
            variant="primary"
            onPress={handleAccept}
            style={[styles.btn, { backgroundColor: COLORS.success, borderColor: COLORS.success }]}
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
    backgroundColor: COLORS.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: SPACING.xl,
    paddingBottom: Platform.OS === 'ios' ? 40 : SPACING.xl,
    alignItems: 'center',
    ...SHADOWS.large,
  },
  closeBtn: {
    position: 'absolute',
    top: SPACING.lg,
    right: SPACING.lg,
    padding: SPACING.sm,
    zIndex: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: COLORS.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.md,
    ...SHADOWS.medium,
  },
  title: {
    fontSize: FONT_SIZES.xxl,
    fontWeight: 'bold',
    color: COLORS.textPrimary,
    marginBottom: SPACING.lg,
  },
  card: {
    width: '100%',
    backgroundColor: COLORS.background,
    borderRadius: BORDER_RADIUS.md,
    padding: SPACING.md,
    marginBottom: SPACING.lg,
    minHeight: 120,
    justifyContent: 'center'
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoText: {
    fontSize: FONT_SIZES.md,
    color: COLORS.textPrimary,
    marginLeft: SPACING.sm,
    flex: 1,
  },
  timerContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    borderWidth: 3,
    borderColor: COLORS.danger,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: SPACING.lg,
  },
  timerText: {
    fontSize: FONT_SIZES.lg,
    fontWeight: 'bold',
    color: COLORS.danger,
  },
  actionRow: {
    flexDirection: 'row',
    width: '100%',
  },
  btn: {
    flex: 1,
    height: 56,
  },
});

export default IncomingRequestModal;
