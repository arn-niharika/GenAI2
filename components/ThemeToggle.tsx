import * as  React from 'react';
import { View, Switch, Text, StyleSheet } from 'react-native';
import { useTheme } from './ThemeProvider';

export const ThemeToggle = () => {
  const { isDark, toggleTheme, colors } = useTheme();

  return (
    <View style={styles.container}>
      <Text style={[styles.text,
         { color: colors.text }]}>
        {isDark ? 'Dark Mode' : 'Light Mode'}
      </Text>
      <Switch
        value={isDark}
        onValueChange={toggleTheme}
        trackColor={{ false: '#767577', true: colors.primary }}
        thumbColor={isDark ? '#f4f3f4' : '#f4f3f4'}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  text: {
    fontSize: 14,
    marginRight: 10,

  },
});
