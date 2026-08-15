import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Animated, PanResponder, StyleSheet, Dimensions, ActivityIndicator } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { BORDER_RADIUS, FONT_SIZES, SPACING } from '../../theme/typography';
import { useTheme } from '../../theme/ThemeContext';

const SWIPE_WIDTH = Dimensions.get('window').width - SPACING.lg * 2;
const BUTTON_HEIGHT = 56;
const KNOB_SIZE = BUTTON_HEIGHT - 8;

export const SwipeButton = ({ title, onSwipeComplete, loading }) => {
  const { colors: COLORS } = useTheme();
  const pan = useRef(new Animated.ValueXY()).current;
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!loading && completed) {
      setCompleted(false);
      Animated.spring(pan, {
        toValue: { x: 0, y: 0 },
        useNativeDriver: false,
      }).start();
    }
  }, [loading]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (e, gesture) => {
        if (completed || loading) return;
        if (gesture.dx > 0 && gesture.dx < SWIPE_WIDTH - KNOB_SIZE - 8) {
          pan.setValue({ x: gesture.dx, y: 0 });
        }
      },
      onPanResponderRelease: (e, gesture) => {
        if (completed || loading) return;
        if (gesture.dx > (SWIPE_WIDTH * 0.65)) {
          Animated.spring(pan, {
            toValue: { x: SWIPE_WIDTH - KNOB_SIZE - 8, y: 0 },
            useNativeDriver: false,
          }).start(() => {
            setCompleted(true);
            onSwipeComplete();
          });
        } else {
          Animated.spring(pan, {
            toValue: { x: 0, y: 0 },
            useNativeDriver: false,
          }).start();
        }
      },
    })
  ).current;

  return (
    <View style={[styles.container, { backgroundColor: COLORS.primary }]}>
      <View style={styles.textContainer}>
        {loading ? (
          <ActivityIndicator color="#fff" size="small" />
        ) : (
          <Text style={styles.text}>{title}</Text>
        )}
      </View>
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.knob, { transform: [{ translateX: pan.x }] }]}
      >
        <ChevronRight size={20} color={COLORS.primary} style={{ marginLeft: 2 }} />
        <ChevronRight size={20} color={COLORS.primary} style={{ marginLeft: -8 }} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: BUTTON_HEIGHT,
    borderRadius: BORDER_RADIUS.xl,
    justifyContent: 'center',
    paddingHorizontal: 4,
    marginHorizontal: SPACING.lg,
    marginBottom: SPACING.lg,
  },
  textContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 30,
  },
  text: {
    color: '#fff',
    fontSize: FONT_SIZES.lg,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: BORDER_RADIUS.lg,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
});
