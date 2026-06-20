import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { COLORS, FONT_SIZES } from '../../theme/typography';

export const Avatar = ({ name, url, size = 48, style }) => {
  const getInitials = (n) => {
    if (!n) return 'U';
    const parts = n.split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return n.substring(0, 2).toUpperCase();
  };

  const dynamicStyle = {
    width: size,
    height: size,
    borderRadius: size / 2,
  };

  if (url) {
    return <Image source={{ uri: url }} style={[styles.container, dynamicStyle, style]} />;
  }

  return (
    <View style={[styles.container, styles.placeholder, dynamicStyle, style]}>
      <Text style={[styles.text, { fontSize: size * 0.4 }]}>{getInitials(name)}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: COLORS.border,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  placeholder: {
    backgroundColor: COLORS.primaryLight,
  },
  text: {
    color: COLORS.primaryDark,
    fontWeight: '700',
  }
});
