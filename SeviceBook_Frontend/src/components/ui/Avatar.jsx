import { useTheme } from '../../theme/ThemeContext';
import React from 'react';
import { View, Text, Image } from 'react-native';

export const Avatar = ({ name, url, size = 48, style }) => {
  const { colors: COLORS } = useTheme();

  const getInitials = (n) => {
    if (!n) return 'U';
    const parts = n.split(' ');
    if (parts.length > 1) return (parts[0][0] + parts[1][0]).toUpperCase();
    return n.substring(0, 2).toUpperCase();
  };

  const dynamicStyle = {
    width:        size,
    height:       size,
    borderRadius: size / 2,
    alignItems:   'center',
    justifyContent: 'center',
    overflow:     'hidden',
  };

  if (url) {
    return <Image source={{ uri: url }} style={[dynamicStyle, style]} />;
  }

  return (
    <View style={[dynamicStyle, { backgroundColor: COLORS.primaryLight }, style]}>
      <Text style={{ fontSize: size * 0.4, color: COLORS.primary, fontWeight: '700' }}>
        {getInitials(name)}
      </Text>
    </View>
  );
};
