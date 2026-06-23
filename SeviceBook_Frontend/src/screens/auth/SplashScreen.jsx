import React, { useEffect } from 'react';
import { View, StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import { loadStoredAuth } from '../../store/slices/authSlice';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const SplashScreen = () => {
  const dispatch = useDispatch();

  // Animation Values
  const houseTranslateY  = useSharedValue(-100);
  const houseOpacity     = useSharedValue(0);
  const wrenchTranslateX = useSharedValue(-150);
  const wrenchRotate     = useSharedValue('-90deg');
  const wrenchOpacity    = useSharedValue(0);
  
  const iconGroupScale   = useSharedValue(1);
  const iconGroupShadow  = useSharedValue(0);

  const textOpacity      = useSharedValue(0);
  const textTranslateY   = useSharedValue(20);
  const textScale        = useSharedValue(0.9);
  const textSpacing      = useSharedValue(1);

  const taglineOpacity   = useSharedValue(0);
  const taglineTranslateY= useSharedValue(10);
  
  const entireScale      = useSharedValue(1);

  const finishSplash = () => {
    dispatch(loadStoredAuth());
  };

  useEffect(() => {
    // Step 1: House drops down
    houseOpacity.value = withTiming(1, { duration: 400 });
    houseTranslateY.value = withSpring(0, { damping: 14, stiffness: 90, mass: 1 });

    // Step 2: Wrench slides and spins into place
    wrenchOpacity.value = withDelay(400, withTiming(1, { duration: 400 }));
    wrenchTranslateX.value = withDelay(
      400,
      withSpring(0, { damping: 14, stiffness: 80, mass: 1 })
    );
    wrenchRotate.value = withDelay(
      400,
      withTiming('-6deg', { duration: 800, easing: Easing.out(Easing.exp) })
    );

    // The moment the wrench locks, pop the icon group slightly
    iconGroupScale.value = withDelay(
      800,
      withSequence(
        withTiming(1.1, { duration: 150 }),
        withTiming(1.0, { duration: 250, easing: Easing.out(Easing.quad) })
      )
    );
    iconGroupShadow.value = withDelay(800, withTiming(0.12, { duration: 400 }));

    // Step 3: FIXIGO brand text smoothly animates in
    textOpacity.value = withDelay(1000, withTiming(1, { duration: 600 }));
    textTranslateY.value = withDelay(
      1000,
      withTiming(0, { duration: 600, easing: Easing.out(Easing.cubic) })
    );
    textScale.value = withDelay(
      1000,
      withTiming(1, { duration: 600, easing: Easing.out(Easing.back(1.5)) })
    );
    textSpacing.value = withDelay(
      1000,
      withTiming(3, { duration: 800, easing: Easing.out(Easing.quad) })
    );

    // Step 4: Tagline fades up
    taglineOpacity.value = withDelay(1300, withTiming(1, { duration: 500 }));
    taglineTranslateY.value = withDelay(
      1300,
      withTiming(0, { duration: 500, easing: Easing.out(Easing.cubic) })
    );

    // Step 5: Everything breathes and triggers finish
    entireScale.value = withDelay(
      2200,
      withSequence(
        withTiming(1.03, { duration: 400, easing: Easing.inOut(Easing.sin) }),
        withTiming(1.0, { duration: 400, easing: Easing.inOut(Easing.sin) }, (finished) => {
          if (finished) {
            runOnJS(finishSplash)();
          }
        })
      )
    );
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const houseStyle = useAnimatedStyle(() => ({
    opacity: houseOpacity.value,
    transform: [{ translateY: houseTranslateY.value }],
    position: 'absolute',
    width: 200,
    height: 200,
  }));

  const wrenchStyle = useAnimatedStyle(() => ({
    opacity: wrenchOpacity.value,
    transform: [
      { translateX: wrenchTranslateX.value },
      { rotate: wrenchRotate.value }
    ],
    position: 'absolute',
    width: 200,
    height: 200,
  }));

  const iconGroupStyle = useAnimatedStyle(() => ({
    transform: [{ scale: iconGroupScale.value }],
    shadowOpacity: iconGroupShadow.value,
  }));

  const textStyle = useAnimatedStyle(() => ({
    opacity: textOpacity.value,
    letterSpacing: textSpacing.value,
    transform: [
      { translateY: textTranslateY.value },
      { scale: textScale.value }
    ],
  }));

  const taglineStyle = useAnimatedStyle(() => ({
    opacity: taglineOpacity.value,
    transform: [{ translateY: taglineTranslateY.value }],
  }));

  const entireStyle = useAnimatedStyle(() => ({
    transform: [{ scale: entireScale.value }],
    alignItems: 'center',
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={entireStyle}>
        
        {/* Vector Logo Group */}
        <Animated.View style={[styles.iconWrapper, iconGroupStyle]}>
          
          {/* Blue House */}
          <Animated.View style={houseStyle}>
            <Svg width="100%" height="100%" viewBox="0 0 100 100">
              <Path 
                d="M 50 15 L 12 48 H 25 V 88 H 75 V 48 H 88 Z" 
                fill="#0095FF" 
              />
            </Svg>
          </Animated.View>

          {/* Orange Wrench with White Cutout Stroke */}
          <Animated.View style={wrenchStyle}>
            <Svg width="100%" height="100%" viewBox="0 0 100 100">
              <Path 
                d="M 5 41 L 60 41 C 65 25, 92 25, 96 38 L 92 43 C 85 44, 75 45, 75 48 C 75 51, 85 52, 92 53 L 96 58 C 92 71, 65 71, 60 55 L 5 55 A 7 7 0 0 1 5 41 Z" 
                fill="#FF7F00" 
                stroke="#FFFFFF" 
                strokeWidth="5" 
                strokeLinejoin="round"
              />
            </Svg>
          </Animated.View>

        </Animated.View>

        {/* Brand Text */}
        <Animated.Text style={[styles.brandText, textStyle]}>
          FIXIGO
        </Animated.Text>

        {/* Tagline */}
        <Animated.Text style={[styles.taglineText, taglineStyle]}>
          Home Services, Simplified
        </Animated.Text>

      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapper: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 200,
    height: 200,
    marginBottom: 16,
    shadowColor: '#0095FF',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0,
    shadowRadius: 30,
    elevation: 4,
  },
  brandText: {
    fontSize: 48,
    fontWeight: '900',
    color: '#0095FF', // Matches the logo blue
    marginBottom: 8,
  },
  taglineText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    letterSpacing: 0.5,
  },
});

export default SplashScreen;