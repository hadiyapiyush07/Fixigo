import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Animated, PanResponder, StyleSheet, ActivityIndicator } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { BORDER_RADIUS, FONT_SIZES, SPACING } from '../../theme/typography';
import { useTheme } from '../../theme/ThemeContext';

const BUTTON_HEIGHT = 56;
const KNOB_SIZE = BUTTON_HEIGHT - 8;

export const SwipeButton = ({ title, onSwipeComplete, loading }) => {
  const { colors: COLORS } = useTheme();
  const pan = useRef(new Animated.ValueXY()).current;
  const [completed, setCompleted] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

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
        if (completed || loading || containerWidth === 0) return;
        const maxSwipe = containerWidth - KNOB_SIZE - 8;
        if (gesture.dx > 0 && gesture.dx < maxSwipe) {
          pan.setValue({ x: gesture.dx, y: 0 });
        }
      },
      onPanResponderRelease: (e, gesture) => {
        if (completed || loading || containerWidth === 0) return;
        const maxSwipe = containerWidth - KNOB_SIZE - 8;
        if (gesture.dx > (containerWidth * 0.65)) {
          Animated.spring(pan, {
            toValue: { x: maxSwipe, y: 0 },
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

  // Background filler animation based on pan.x
  const fillWidth = pan.x.interpolate({
    inputRange: [0, containerWidth ? containerWidth - KNOB_SIZE - 8 : 100],
    outputRange: [KNOB_SIZE + 8, containerWidth ? containerWidth : 100],
    extrapolate: 'clamp'
  });

  return (
    <View 
      style={[styles.container, { backgroundColor: COLORS.surface, borderColor: COLORS.primary }]}
      onLayout={(e) => setContainerWidth(e.nativeEvent.layout.width)}
    >
      <Animated.View style={[styles.fillBackground, { width: fillWidth, backgroundColor: COLORS.primary }]} />
      
      <View style={styles.textContainer}>
        {loading ? (
          <ActivityIndicator color={COLORS.primary} size="small" />
        ) : (
          <Text style={[styles.text, { color: completed ? '#fff' : COLORS.primaryDark }]}>
            {completed ? 'Processing...' : title}
          </Text>
        )}
      </View>
      
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.knob, { transform: [{ translateX: pan.x }] }]}
      >
        <ChevronRight size={24} color={COLORS.primary} style={{ marginLeft: 2 }} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: BUTTON_HEIGHT,
    borderRadius: BORDER_RADIUS.xl,
    justifyContent: 'center',
    borderWidth: 1.5,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  fillBackground: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    borderRadius: BORDER_RADIUS.xl,
  },
  textContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: 30,
    zIndex: 1,
    pointerEvents: 'none',
  },
  text: {
    fontSize: FONT_SIZES.lg,
    fontWeight: '800',
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
    position: 'absolute',
    left: 4,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 4,
  },
});
