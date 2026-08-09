import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery } from '@tanstack/react-query';
import Svg, { Path, Circle } from 'react-native-svg';
import { Ionicons } from '@expo/vector-icons';
import { fetchHealthStatus } from '../../services/api';
import { PitWallTheme } from '../../constants/theme';
import { TopBar } from '../../components/top-bar';

// Mock timing data mirroring the Stitch "live_leaderboard" mockup (Monaco GP).
// Phase 2 replaces this with a real session/replay feed from the backend.
const TIMING_TOWER = [
  { pos: 1, num: 1, code: 'VER', team: 'RED BULL RACING', teamColor: PitWallTheme.colors.teamRedBull, gap: 'Leader', tyre: 'M', pits: 1 },
  { pos: 2, num: 11, code: 'PER', team: 'RED BULL RACING', teamColor: PitWallTheme.colors.teamRedBull, gap: '+2.345', tyre: 'H', pits: 1 },
  { pos: 3, num: 16, code: 'LEC', team: 'FERRARI', teamColor: PitWallTheme.colors.teamFerrari, gap: '+4.102', tyre: 'H', pits: 1 },
  { pos: 4, num: 4, code: 'NOR', team: 'MCLAREN', teamColor: PitWallTheme.colors.teamMcLaren, gap: '+12.890', tyre: 'M', pits: 2 },
  { pos: 5, num: 55, code: 'SAI', team: 'FERRARI', teamColor: PitWallTheme.colors.teamFerrari, gap: '+14.233', tyre: 'H', pits: 1 },
  { pos: 6, num: 44, code: 'HAM', team: 'MERCEDES', teamColor: PitWallTheme.colors.teamMercedes, gap: '+18.001', tyre: 'S', pits: 2 },
];

const TYRE_COLOR: Record<string, string> = {
  S: PitWallTheme.colors.tyreSoft,
  M: PitWallTheme.colors.tyreMedium,
  H: PitWallTheme.colors.tyreHard,
};

function SectorChip({ label, status, color }: { label: string; status: string; color: string }) {
  return (
    <View style={styles.sectorChip}>
      <Text style={styles.sectorLabel}>{label}</Text>
      <Text style={[styles.sectorStatus, { color }]}>{status}</Text>
    </View>
  );
}

export default function LiveScreen() {
  const { data, isError } = useQuery({
    queryKey: ['health'],
    queryFn: fetchHealthStatus,
    refetchInterval: 15000,
  });
  const connected = !!data && !isError;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TopBar />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Race status banner */}
        <View style={styles.banner}>
          <View style={styles.bannerTopRow}>
            <View style={styles.liveBadge}>
              <Text style={styles.liveBadgeText}>LIVE</Text>
            </View>
            <View
              style={[
                styles.connDot,
                { backgroundColor: connected ? PitWallTheme.colors.success : PitWallTheme.colors.error },
              ]}
            />
            <Text style={styles.connText}>{connected ? 'BACKEND ONLINE' : 'BACKEND OFFLINE'}</Text>
          </View>
          <Text style={styles.raceTitle}>MONACO GRAND PRIX</Text>
          <View style={styles.bannerMetaRow}>
            <View style={styles.metaItem}>
              <Ionicons name="timer-outline" size={13} color={PitWallTheme.colors.onSurfaceVariant} />
              <Text style={styles.metaText}>LAP 45/78</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Ionicons name="cloud-outline" size={13} color={PitWallTheme.colors.onSurfaceVariant} />
              <Text style={styles.metaText}>CLOUDY / 22°C</Text>
            </View>
            <View style={styles.metaDivider} />
            <View style={styles.metaItem}>
              <Ionicons name="warning-outline" size={13} color={PitWallTheme.colors.primaryContainer} />
              <Text style={[styles.metaText, { color: PitWallTheme.colors.primaryContainer }]}>SC DEPLOYED</Text>
            </View>
          </View>
          <View style={styles.sectorRow}>
            <SectorChip label="SECTOR 1" status="YELLOW" color={PitWallTheme.colors.tyreMedium} />
            <SectorChip label="SECTOR 2" status="CLEAR" color={PitWallTheme.colors.onBackground} />
            <SectorChip label="SECTOR 3" status="CLEAR" color={PitWallTheme.colors.onBackground} />
          </View>
        </View>

        {/* Timing tower */}
        <View style={styles.towerCard}>
          <View style={styles.towerHeader}>
            <Text style={[styles.towerHeaderCell, styles.colPos]}>POS</Text>
            <Text style={[styles.towerHeaderCell, styles.colNum]}>#</Text>
            <Text style={[styles.towerHeaderCell, styles.colDriver]}>DRIVER</Text>
            <Text style={[styles.towerHeaderCell, styles.colGap]}>GAP</Text>
            <Text style={[styles.towerHeaderCell, styles.colTyre]}>TYRE</Text>
            <Text style={[styles.towerHeaderCell, styles.colPits]}>PITS</Text>
          </View>
          {TIMING_TOWER.map((row, i) => (
            <TouchableOpacity
              key={row.pos}
              activeOpacity={0.7}
              style={[
                styles.towerRow,
                { borderLeftColor: row.teamColor },
                i % 2 === 1 && styles.zebraOdd,
              ]}
            >
              <Text style={[styles.posCell, styles.colPos]}>{row.pos}</Text>
              <Text style={[styles.numCell, styles.colNum]}>{row.num}</Text>
              <View style={styles.colDriver}>
                <Text style={styles.driverCode}>{row.code}</Text>
                <Text style={styles.driverTeam}>{row.team}</Text>
              </View>
              <Text style={[styles.gapCell, styles.colGap]}>{row.gap}</Text>
              <View style={[styles.colTyre, styles.tyreCell]}>
                <View style={[styles.tyreBadge, { borderColor: TYRE_COLOR[row.tyre] }]}>
                  <Text style={[styles.tyreBadgeText, { color: TYRE_COLOR[row.tyre] }]}>{row.tyre}</Text>
                </View>
              </View>
              <Text style={[styles.pitsCell, styles.colPits]}>{row.pits}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Track map */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>TRACK MAP</Text>
          <Text style={styles.cardSubtitle}>CIRCUIT DE MONACO</Text>
          <View style={styles.trackMapBox}>
            <Svg width="100%" height="100%" viewBox="0 0 200 120">
              <Path
                d="M28 92 C14 64 30 34 62 34 L118 34 C146 34 148 14 128 12 C108 10 108 26 88 42 C62 62 42 72 44 92 C46 106 66 112 96 106 C132 99 158 98 172 80 C182 66 172 52 154 57 C140 61 140 76 120 82 C98 88 62 98 28 92 Z"
                stroke="#6FD3FF"
                strokeWidth={2.5}
                fill="none"
                opacity={0.9}
              />
              <Circle cx={62} cy={34} r={4} fill={PitWallTheme.colors.teamRedBull} />
              <Circle cx={92} cy={40} r={3.5} fill={PitWallTheme.colors.teamFerrari} />
            </Svg>
          </View>
        </View>

        {/* Key telemetry */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>KEY TELEMETRY</Text>
          <View style={styles.telemetryRow}>
            <View style={styles.telemetryTile}>
              <Text style={styles.telemetryLabel}>FASTEST LAP</Text>
              <Text style={[styles.telemetryValue, { color: PitWallTheme.colors.primaryContainer }]}>1:14.356</Text>
              <Text style={styles.telemetrySub}>VER - LAP 42</Text>
            </View>
            <View style={styles.telemetryTile}>
              <Text style={styles.telemetryLabel}>PIT WINDOW</Text>
              <Text style={styles.telemetryValue}>CLOSED</Text>
              <Text style={styles.telemetrySub}>LAPS 25-35</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.ctaButton} activeOpacity={0.85}>
            <Ionicons name="analytics-outline" size={18} color="#FFFFFF" />
            <Text style={styles.ctaText}>FULL TELEMETRY</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PitWallTheme.colors.background },
  scrollContent: { padding: PitWallTheme.spacing.md, gap: PitWallTheme.spacing.md, paddingBottom: 32 },

  banner: {
    backgroundColor: PitWallTheme.colors.surfaceContainerLow,
    borderRadius: PitWallTheme.borderRadius.DEFAULT,
    borderLeftWidth: 4,
    borderLeftColor: PitWallTheme.colors.primaryContainer,
    padding: PitWallTheme.spacing.md,
    gap: 8,
  },
  bannerTopRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  liveBadge: {
    backgroundColor: PitWallTheme.colors.primaryContainer,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: PitWallTheme.borderRadius.sm,
  },
  liveBadgeText: {
    fontFamily: PitWallTheme.fonts.headline,
    fontSize: 10,
    letterSpacing: 1.2,
    color: '#FFFFFF',
  },
  connDot: { width: 7, height: 7, borderRadius: 4, marginLeft: 4 },
  connText: {
    fontFamily: PitWallTheme.fonts.dataMono,
    fontSize: 9,
    letterSpacing: 0.5,
    color: PitWallTheme.colors.onSurfaceVariant,
  },
  raceTitle: {
    fontFamily: PitWallTheme.fonts.headlineBold,
    fontSize: PitWallTheme.type.headlineXl.fontSize,
    lineHeight: PitWallTheme.type.headlineXl.lineHeight,
    color: PitWallTheme.colors.onBackground,
  },
  bannerMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  metaItem: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: {
    fontFamily: PitWallTheme.fonts.dataMono,
    fontSize: 11,
    color: PitWallTheme.colors.onSurfaceVariant,
  },
  metaDivider: { width: 1, height: 12, backgroundColor: `${PitWallTheme.colors.outlineVariant}99` },
  sectorRow: { flexDirection: 'row', gap: 8, marginTop: 2 },
  sectorChip: {
    flex: 1,
    backgroundColor: PitWallTheme.colors.surfaceContainer,
    borderRadius: PitWallTheme.borderRadius.DEFAULT,
    paddingVertical: 8,
    alignItems: 'center',
  },
  sectorLabel: {
    fontFamily: PitWallTheme.fonts.headline,
    fontSize: 10,
    letterSpacing: 1,
    color: PitWallTheme.colors.onSurfaceVariant,
  },
  sectorStatus: { fontFamily: PitWallTheme.fonts.dataMono, fontSize: 12, marginTop: 2 },

  towerCard: {
    backgroundColor: PitWallTheme.colors.surfaceContainerLow,
    borderRadius: PitWallTheme.borderRadius.DEFAULT,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: `${PitWallTheme.colors.outlineVariant}26`,
  },
  towerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PitWallTheme.colors.surfaceContainerHighest,
    paddingHorizontal: PitWallTheme.spacing.sm,
    paddingVertical: 8,
    paddingLeft: PitWallTheme.spacing.sm + 4,
  },
  towerHeaderCell: {
    fontFamily: PitWallTheme.fonts.headline,
    fontSize: 10,
    letterSpacing: 1,
    color: PitWallTheme.colors.onSurfaceVariant,
  },
  towerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: PitWallTheme.spacing.sm,
    paddingVertical: 10,
    borderLeftWidth: 4,
  },
  zebraOdd: { backgroundColor: 'rgba(255,255,255,0.03)' },
  colPos: { width: 32, textAlign: 'center' },
  colNum: { width: 26, textAlign: 'center' },
  colDriver: { flex: 1, paddingLeft: 8 },
  colGap: { width: 74, textAlign: 'right' },
  colTyre: { width: 44 },
  colPits: { width: 30, textAlign: 'center' },
  tyreCell: { alignItems: 'center' },
  posCell: {
    fontFamily: PitWallTheme.fonts.dataMono,
    fontSize: 16,
    color: PitWallTheme.colors.onBackground,
  },
  numCell: {
    fontFamily: PitWallTheme.fonts.dataMono,
    fontSize: 11,
    color: PitWallTheme.colors.onSurfaceVariant,
  },
  driverCode: {
    fontFamily: PitWallTheme.fonts.headline,
    fontSize: 17,
    color: PitWallTheme.colors.onBackground,
  },
  driverTeam: {
    fontFamily: PitWallTheme.fonts.dataMono,
    fontSize: 8,
    letterSpacing: 0.3,
    color: PitWallTheme.colors.onSurfaceVariant,
  },
  gapCell: {
    fontFamily: PitWallTheme.fonts.dataMono,
    fontSize: 13,
    color: PitWallTheme.colors.onBackground,
  },
  tyreBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tyreBadgeText: { fontFamily: PitWallTheme.fonts.dataMono, fontSize: 10 },
  pitsCell: {
    fontFamily: PitWallTheme.fonts.dataMono,
    fontSize: 12,
    color: PitWallTheme.colors.onSurfaceVariant,
  },

  card: {
    backgroundColor: PitWallTheme.colors.surfaceContainerLow,
    borderRadius: PitWallTheme.borderRadius.DEFAULT,
    padding: PitWallTheme.spacing.md,
    borderWidth: 1,
    borderColor: `${PitWallTheme.colors.outlineVariant}26`,
  },
  cardTitle: {
    fontFamily: PitWallTheme.fonts.headline,
    fontSize: PitWallTheme.type.headlineMd.fontSize,
    color: PitWallTheme.colors.onBackground,
  },
  cardSubtitle: {
    fontFamily: PitWallTheme.fonts.dataMono,
    fontSize: 10,
    letterSpacing: 0.5,
    color: PitWallTheme.colors.onSurfaceVariant,
    marginTop: 2,
    marginBottom: 10,
  },
  trackMapBox: {
    aspectRatio: 1.6,
    backgroundColor: PitWallTheme.colors.surfaceContainerLowest,
    borderRadius: PitWallTheme.borderRadius.DEFAULT,
    overflow: 'hidden',
  },
  telemetryRow: { flexDirection: 'row', gap: 8, marginTop: 10 },
  telemetryTile: {
    flex: 1,
    backgroundColor: PitWallTheme.colors.surfaceContainer,
    borderRadius: PitWallTheme.borderRadius.DEFAULT,
    padding: 10,
  },
  telemetryLabel: {
    fontFamily: PitWallTheme.fonts.headline,
    fontSize: 10,
    letterSpacing: 1,
    color: PitWallTheme.colors.onSurfaceVariant,
  },
  telemetryValue: {
    fontFamily: PitWallTheme.fonts.dataMono,
    fontSize: 18,
    color: PitWallTheme.colors.onBackground,
    marginTop: 4,
  },
  telemetrySub: {
    fontFamily: PitWallTheme.fonts.dataMono,
    fontSize: 9,
    color: PitWallTheme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  ctaButton: {
    marginTop: 12,
    backgroundColor: PitWallTheme.colors.primaryContainer,
    borderRadius: PitWallTheme.borderRadius.DEFAULT,
    paddingVertical: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaText: {
    fontFamily: PitWallTheme.fonts.headline,
    fontSize: 15,
    letterSpacing: 1,
    color: '#FFFFFF',
  },
});
