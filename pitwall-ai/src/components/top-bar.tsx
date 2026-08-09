import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PitWallTheme } from '../constants/theme';

export function TopBar() {
  return (
    <View style={styles.header}>
      <TouchableOpacity hitSlop={10} style={styles.iconButton}>
        <Ionicons name="menu-outline" size={22} color={PitWallTheme.colors.primaryContainer} />
      </TouchableOpacity>
      <Text style={styles.wordmark}>PITWALL AI</Text>
      <TouchableOpacity hitSlop={10} style={styles.iconButton}>
        <Ionicons name="settings-outline" size={20} color={PitWallTheme.colors.primaryContainer} />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: PitWallTheme.spacing.md,
    backgroundColor: PitWallTheme.colors.surfaceDim,
    borderBottomWidth: 1,
    borderBottomColor: PitWallTheme.colors.surfaceContainerHighest,
  },
  iconButton: {
    padding: 6,
    borderRadius: PitWallTheme.borderRadius.DEFAULT,
  },
  wordmark: {
    fontSize: 20,
    fontWeight: '700',
    letterSpacing: 1,
    color: PitWallTheme.colors.primaryContainer,
    textTransform: 'uppercase',
  },
});
