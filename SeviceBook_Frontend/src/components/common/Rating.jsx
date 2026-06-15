import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { COLORS, FONT_SIZES } from '../../theme/typography';

export const Rating = ({ rating = 0, count, size = 'sm', showCount = true }) => {
  const stars = Array.from({ length: 5 }, (_, i) =>
    i < Math.round(rating) ? '★' : '☆'
  );
  return (
    <View style={styles.row}>
      <Text style={[styles.stars, styles[size]]}>
        {stars.join('')}
      </Text>
      {showCount && (
        <Text style={[styles.text, styles[size]]}>
          {rating.toFixed(1)}{count ? ` (${count})` : ''}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  row:  { flexDirection: 'row', alignItems: 'center' },
  stars:{ color: '#F39C12' },
  text: { color: '#6C757D', marginLeft: 4 },
  xs:   { fontSize: 10 },
  sm:   { fontSize: 12 },
  md:   { fontSize: 14 },
});