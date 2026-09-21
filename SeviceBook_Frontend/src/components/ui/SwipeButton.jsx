import React, { useRef, useState, useEffect } from 'react';
import { View, Text, Animated, PanResponder, StyleSheet, ActivityIndicator, Dimensions } from 'react-native';
import { ChevronsRight, CheckCircle2 } from 'lucide-react-native';
import { FONT_SIZES, SPACING } from '../../theme/typography';
import { useTheme } from '../../theme/ThemeContext';

const BUTTON_HEIGHT = 64;
const KNOB_SIZE = BUTTON_HEIGHT - 12; 
const SCREEN_WIDTH = Dimensions.get('window').width;

export const SwipeButton = ({ title, onSwipeComplete, loading }) => {
  const { colors: COLORS } = useTheme();
  const pan = useRef(new Animated.Value(0)).current;
  const pulseAnim = useRef(new Animated.Value(0.5)).current;
  const [completed, setCompleted] = useState(false);
  
  const [containerWidth, setContainerWidth] = useState(SCREEN_WIDTH - (SPACING.lg * 2));

  useEffect(() => {
    // Pulse animation for the arrows
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 800, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.5, duration: 800, useNativeDriver: true })
      ])
    ).start();
  }, []);

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

  const bgTranslateX = pan.interpolate({
    inputRange: [0, 1000],
    outputRange: [0, 1000],
    extrapolate: 'extend'
  });

  return (
    <View 
      style={[
        styles.container, 
        { 
          backgroundColor: 'rgba(0,0,0,0.03)', 
          borderColor: COLORS.primary 
        }
      ]}
      onLayout={(e) => {
        if (e.nativeEvent.layout.width > 0) {
          setContainerWidth(e.nativeEvent.layout.width);
        }
      }}
    >
      <Animated.View style={[
        styles.fillBackground, 
        { 
          backgroundColor: COLORS.primary,
          width: containerWidth,
          left: -containerWidth + KNOB_SIZE + 12, 
          transform: [{ translateX: bgTranslateX }]
        }
      ]} />
      
      <View style={styles.textContainer}>
        {loading || completed ? (
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {completed && !loading ? (
               <CheckCircle2 color={COLORS.white} size={20} style={{ marginRight: SPACING.sm }} />
            ) : (
               <ActivityIndicator color={COLORS.white} size="small" style={{ marginRight: SPACING.sm }} />
            )}
            <Text style={[styles.text, { color: COLORS.white }]}>
              {completed && !loading ? 'Done' : 'Updating...'}
            </Text>
          </View>
        ) : (
          <Text style={[styles.text, { color: COLORS.primary }]}>
            {title}
          </Text>
        )}
      </View>
      
      <Animated.View
        {...panResponder.panHandlers}
        style={[styles.knob, { transform: [{ translateX: pan }] }]}
      >
        <Animated.View style={{ opacity: completed || loading ? 0.3 : pulseAnim }}>
          <ChevronsRight size={26} color={COLORS.primary} style={{ marginLeft: 2 }} />
        </Animated.View>
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
    left: 4,
    zIndex: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 5,
    elevation: 6,
  },
});
