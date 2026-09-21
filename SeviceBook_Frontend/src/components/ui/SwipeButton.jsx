import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Animated, PanResponder, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { ChevronRight } from 'lucide-react-native';
import { FONT_SIZES, SPACING } from '../../theme/typography';
import { useTheme } from '../../theme/ThemeContext';

const BUTTON_HEIGHT = 60;
const KNOB_SIZE = BUTTON_HEIGHT - 12; // 48
const SCREEN_WIDTH = Dimensions.get('window').width;

export const SwipeButton = ({ title, onSwipeComplete, loading }) => {
  const { colors: COLORS } = useTheme();
  const pan = useRef(new Animated.Value(0)).current;
  const [completed, setCompleted] = useState(false);
  
  // Fallback to Dimensions if onLayout fails or is delayed
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH - (SPACING.lg * 2));

  useEffect(() => {
    if (!loading && completed) {
      setCompleted(false);
      Animated.spring(pan, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    }
  }, [loading]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onPanResponderMove: (e, gesture) => {
        if (completed || loading) return;
        const maxSwipe = containerWidth - KNOB_SIZE - 12;
        if (gesture.dx > 0 && gesture.dx < maxSwipe) {
          pan.setValue(gesture.dx);
        } else if (gesture.dx >= maxSwipe) {
          pan.setValue(maxSwipe);
        }
      },
      onPanResponderRelease: (e, gesture) => {
        if (completed || loading) return;
        const maxSwipe = containerWidth - KNOB_SIZE - 12;
        if (gesture.dx > (containerWidth * 0.6)) {
          Animated.spring(pan, {
            toValue: maxSwipe,
            tension: 40,
            friction: 5,
            useNativeDriver: true,
          }).start(() => {
            setCompleted(true);
            onSwipeComplete();
          });
        } else {
          Animated.spring(pan, {
            toValue: 0,
            tension: 40,
            friction: 5,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  // Background filler using 60FPS transform instead of layout width
  const bgTranslateX = pan.interpolate({
    inputRange: [0, 1000],
    outputRange: [0, 1000],
    extrapolate: 'extend'
  });

  return (
    <View 
      style={[styles.container, { backgroundColor: COLORS.surface, borderColor: COLORS.primary }]}
      onLayout={(e) => {
        if (e.nativeEvent.layout.width > 0) {
          setContainerWidth(e.nativeEvent.layout.width);
        }
      }}
    >
      {/* The background is 2x the width, shifted left. As pan increases, it slides right instantly. */}
      <Animated.View style={[
        styles.fillBackground, 
        { 
          backgroundColor: COLORS.primary,
          width: containerWidth,
          left: -containerWidth + KNOB_SIZE + 12, // Initially only the left part behind the knob is visible
          transform: [{ translateX: bgTranslateX }]
        }
      ]} />
      
      <View style={styles.textContainer}>
        {loading ? (
          <ActivityIndicator color={COLORS.white} size="small" />
        ) : (
          <Text style={[styles.text, { color: completed ? COLORS.white : COLORS.primary }]}>
            {completed ? 'Processing...' : title}
          </Text>
        )}
      </View>
      
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.knob, { transform: [{ translateX: pan }] }]}
      >
        <ChevronRight size={24} color={COLORS.primary} style={{ marginLeft: 2 }} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: BUTTON_HEIGHT,
    borderRadius: BUTTON_HEIGHT / 2,
    justifyContent: 'center',
    borderWidth: 2,
    overflow: 'hidden',
    position: 'relative',
    width: '100%',
  },
  fillBackground: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    borderRadius: BUTTON_HEIGHT / 2,
  },
  textContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    paddingLeft: KNOB_SIZE, 
    paddingRight: SPACING.md,
    zIndex: 1,
    pointerEvents: 'none',
  },
  text: {
    fontSize: FONT_SIZES.md,
    fontWeight: '800',
    letterSpacing: 0.5,
    textAlign: 'center',
  },
  knob: {
    width: KNOB_SIZE,
    height: KNOB_SIZE,
    borderRadius: KNOB_SIZE / 2,
    backgroundColor: '#fff',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    left: 6,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
});
