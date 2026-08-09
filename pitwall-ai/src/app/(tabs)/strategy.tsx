import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { PitWallTheme } from '../../constants/theme';
import { TopBar } from '../../components/top-bar';

type Compound = 'S' | 'M' | 'H';

const COMPOUND_COLOR: Record<Compound, string> = {
  S: PitWallTheme.colors.tyreSoft,
  M: PitWallTheme.colors.tyreMedium,
  H: PitWallTheme.colors.tyreHard,
};

const CIRCUITS = [
  { id: 'silverstone', name: 'Silverstone Circuit', laps: 52 },
  { id: 'monza', name: 'Monza', laps: 53 },
  { id: 'suzuka', name: 'Suzuka', laps: 53 },
];

interface Stint {
  compound: Compound;
  laps: number;
}

const INITIAL_STINTS: Stint[] = [
  { compound: 'S', laps: 18 },
  { compound: 'M', laps: 24 },
  { compound: 'H', laps: 10 },
];

const NEXT_COMPOUND: Record<Compound, Compound> = { S: 'M', M: 'H', H: 'S' };

export default function StrategyScreen() {
  const [circuitIndex, setCircuitIndex] = useState(0);
  const [stints, setStints] = useState<Stint[]>(INITIAL_STINTS);
  const [hasRun, setHasRun] = useState(false);

  const circuit = CIRCUITS[circuitIndex];
  const totalLaps = useMemo(() => stints.reduce((sum, s) => sum + s.laps, 0), [stints]);

  // Lap ranges are derived rather than stored, so edits can't desync them.
  const lapRanges = useMemo(() => {
    let cursor = 1;
    return stints.map((s) => {
      const range = { from: cursor, to: cursor + s.laps - 1 };
      cursor += s.laps;
      return range;
    });
  }, [stints]);

  const cycleCompound = (i: number) =>
    setStints((prev) =>
      prev.map((s, idx) => (idx === i ? { ...s, compound: NEXT_COMPOUND[s.compound] } : s)),
    );

  const adjustLaps = (i: number, delta: number) =>
    setStints((prev) =>
      prev.map((s, idx) =>
        idx === i ? { ...s, laps: Math.max(1, Math.min(60, s.laps + delta)) } : s,
      ),
    );

  const addStint = () =>
    setStints((prev) => (prev.length >= 4 ? prev : [...prev, { compound: 'M', laps: 10 }]));

  const removeStint = (i: number) =>
    setStints((prev) => (prev.length <= 1 ? prev : prev.filter((_, idx) => idx !== i)));

  // Placeholder model until the Phase 3 simulation engine lands: each pit stop costs
  // ~22s, and softer compounds are quicker per lap but degrade faster.
  const results = useMemo(() => {
    const PIT_LOSS = 22.0;
    const BASE_LAP = 92.5;
    const PACE: Record<Compound, number> = { S: -0.55, M: 0, H: 0.42 };
    const DEG: Record<Compound, number> = { S: 0.085, M: 0.048, H: 0.028 };

    let total = 0;
    stints.forEach((s) => {
      for (let lap = 0; lap < s.laps; lap++) {
        total += BASE_LAP + PACE[s.compound] + DEG[s.compound] * lap;
      }
    });
    total += PIT_LOSS * Math.max(0, stints.length - 1);

    const baseline = (BASE_LAP + 0.1) * totalLaps + PIT_LOSS * 2;
    const delta = total - baseline;
    const lapDeficit = Math.abs(totalLaps - circuit.laps);
    const confidence = Math.max(35, 92 - lapDeficit * 4 - Math.max(0, stints.length - 3) * 8);

    const h = Math.floor(total / 3600);
    const m = Math.floor((total % 3600) / 60);
    const sec = total % 60;

    return {
      delta,
      totalTime: `${h}:${String(m).padStart(2, '0')}:${sec.toFixed(3).padStart(6, '0')}`,
      pitStops: Math.max(0, stints.length - 1),
      confidence: Math.round(confidence),
    };
  }, [stints, totalLaps, circuit.laps]);

  const lapsMatch = totalLaps === circuit.laps;

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TopBar />
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View>
          <Text style={styles.pageTitle}>STRATEGY MAKER</Text>
          <Text style={styles.pageSubtitle}>Configure stint simulation parameters</Text>
        </View>

        {/* Circuit picker */}
        <TouchableOpacity
          style={styles.picker}
          activeOpacity={0.8}
          onPress={() => setCircuitIndex((i) => (i + 1) % CIRCUITS.length)}
        >
          <Text style={styles.pickerText}>{circuit.name}</Text>
          <Ionicons name="chevron-down" size={18} color={PitWallTheme.colors.onSurfaceVariant} />
        </TouchableOpacity>

        {/* Stint builder */}
        <View style={styles.card}>
          <View style={styles.cardHeaderRow}>
            <Text style={styles.cardTitle}>STINT BUILDER</Text>
            <Text style={[styles.lapCount, !lapsMatch && { color: PitWallTheme.colors.error }]}>
              {totalLaps} / {circuit.laps} LAPS
            </Text>
          </View>
          <View style={styles.divider} />

          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.stintRow}>
            {stints.map((s, i) => (
              <View key={i} style={styles.stintCol}>
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => cycleCompound(i)}
                  onLongPress={() => removeStint(i)}
                  style={[styles.compoundBlock, { backgroundColor: COMPOUND_COLOR[s.compound] }]}
                >
                  <Text
                    style={[
                      styles.compoundText,
                      { color: s.compound === 'S' ? '#FFFFFF' : '#000000' },
                    ]}
                  >
                    {s.compound}
                  </Text>
                </TouchableOpacity>
                <Text style={styles.stintRange}>
                  L{lapRanges[i].from} - L{lapRanges[i].to}
                </Text>
                <View style={styles.stepperRow}>
                  <TouchableOpacity onPress={() => adjustLaps(i, -1)} hitSlop={8} style={styles.stepperButton}>
                    <Ionicons name="remove" size={13} color={PitWallTheme.colors.onSurfaceVariant} />
                  </TouchableOpacity>
                  <Text style={styles.stintLaps}>{s.laps}</Text>
                  <TouchableOpacity onPress={() => adjustLaps(i, 1)} hitSlop={8} style={styles.stepperButton}>
                    <Ionicons name="add" size={13} color={PitWallTheme.colors.onSurfaceVariant} />
                  </TouchableOpacity>
                </View>
              </View>
            ))}
            {stints.length < 4 && (
              <TouchableOpacity onPress={addStint} style={styles.addStint} activeOpacity={0.7}>
                <Ionicons name="add" size={20} color={PitWallTheme.colors.onSurfaceVariant} />
              </TouchableOpacity>
            )}
          </ScrollView>

          <Text style={styles.hint}>Tap a compound to cycle S → M → H · long-press to remove</Text>

          {/* START → FINISH bar */}
          <View style={styles.scrubberHeader}>
            <Text style={styles.scrubberLabel}>START</Text>
            <Text style={styles.scrubberLabel}>FINISH</Text>
          </View>
          <View style={styles.scrubberTrack}>
            {stints.map((s, i) => (
              <View
                key={i}
                style={{
                  flex: s.laps,
                  backgroundColor: COMPOUND_COLOR[s.compound],
                  height: '100%',
                }}
              />
            ))}
          </View>
          <View style={styles.scrubberFooter}>
            <Ionicons name="flag-outline" size={14} color={PitWallTheme.colors.onSurfaceVariant} />
            <Ionicons name="flag" size={14} color={PitWallTheme.colors.onSurface} />
          </View>
        </View>

        {/* Run simulation */}
        <TouchableOpacity style={styles.runButton} activeOpacity={0.85} onPress={() => setHasRun(true)}>
          <Ionicons name="play" size={18} color="#FFFFFF" />
          <Text style={styles.runButtonText}>RUN SIMULATION</Text>
        </TouchableOpacity>

        {/* Results */}
        <View style={styles.resultsCard}>
          <Text style={styles.cardTitle}>SIMULATION RESULTS</Text>
          {!hasRun ? (
            <View style={styles.emptyResults}>
              <Ionicons name="speedometer-outline" size={26} color={PitWallTheme.colors.onSurfaceVariant} />
              <Text style={styles.emptyResultsText}>Run a simulation to see predicted race time.</Text>
            </View>
          ) : (
            <>
              <View style={styles.deltaBlock}>
                <Text style={styles.deltaLabel}>PREDICTED RACE TIME DELTA</Text>
                <Text
                  style={[
                    styles.deltaValue,
                    { color: results.delta <= 0 ? PitWallTheme.colors.primary : PitWallTheme.colors.error },
                  ]}
                >
                  {results.delta > 0 ? '+' : ''}
                  {results.delta.toFixed(1)}s
                </Text>
                <Text style={styles.deltaSub}>vs Baseline Strategy</Text>
              </View>

              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Total Race Time</Text>
                <Text style={styles.resultValue}>{results.totalTime}</Text>
              </View>
              <View style={styles.resultRow}>
                <Text style={styles.resultLabel}>Pit Stops</Text>
                <Text style={styles.resultValue}>{results.pitStops}</Text>
              </View>
              <View style={[styles.resultRow, { borderBottomWidth: 0 }]}>
                <Text style={styles.resultLabel}>Confidence</Text>
                <View style={styles.confidenceWrap}>
                  <View style={styles.confidenceTrack}>
                    <View style={[styles.confidenceFill, { width: `${results.confidence}%` }]} />
                  </View>
                  <Text style={styles.resultValue}>{results.confidence}%</Text>
                </View>
              </View>

              {!lapsMatch && (
                <Text style={styles.warning}>
                  Stint laps ({totalLaps}) don't match race distance ({circuit.laps}) — confidence reduced.
                </Text>
              )}
              <Text style={styles.disclaimer}>
                Estimates from a placeholder degradation model. Phase 3 replaces this with the real engine.
              </Text>
            </>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PitWallTheme.colors.background },
  scrollContent: { padding: PitWallTheme.spacing.md, gap: PitWallTheme.spacing.md, paddingBottom: 32 },

  pageTitle: {
    fontFamily: PitWallTheme.fonts.headlineBold,
    fontSize: PitWallTheme.type.headlineXl.fontSize,
    color: PitWallTheme.colors.onSurface,
  },
  pageSubtitle: {
    fontFamily: PitWallTheme.fonts.body,
    fontSize: 13,
    color: PitWallTheme.colors.onSurfaceVariant,
    marginTop: 2,
  },

  picker: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: PitWallTheme.colors.surfaceContainerLow,
    borderWidth: 1,
    borderColor: `${PitWallTheme.colors.outline}66`,
    borderRadius: PitWallTheme.borderRadius.DEFAULT,
    paddingHorizontal: 14,
    paddingVertical: 13,
  },
  pickerText: {
    fontFamily: PitWallTheme.fonts.body,
    fontSize: 15,
    color: PitWallTheme.colors.onSurface,
  },

  card: {
    backgroundColor: PitWallTheme.colors.surfaceContainerLow,
    borderRadius: PitWallTheme.borderRadius.lg,
    padding: PitWallTheme.spacing.md,
  },
  cardHeaderRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardTitle: {
    fontFamily: PitWallTheme.fonts.headline,
    fontSize: PitWallTheme.type.headlineMd.fontSize,
    color: PitWallTheme.colors.onSurface,
  },
  lapCount: {
    fontFamily: PitWallTheme.fonts.dataMono,
    fontSize: 13,
    color: PitWallTheme.colors.onSurfaceVariant,
  },
  divider: {
    height: 1,
    backgroundColor: PitWallTheme.colors.surfaceContainerHighest,
    marginTop: 12,
    marginBottom: 16,
  },

  stintRow: { gap: 10, alignItems: 'flex-start' },
  stintCol: { alignItems: 'center', minWidth: 92 },
  compoundBlock: {
    width: 92,
    height: 46,
    borderRadius: PitWallTheme.borderRadius.DEFAULT,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.25)',
  },
  compoundText: { fontFamily: PitWallTheme.fonts.headlineBold, fontSize: 20 },
  stintRange: {
    fontFamily: PitWallTheme.fonts.headline,
    fontSize: 11,
    letterSpacing: 0.8,
    color: PitWallTheme.colors.onSurface,
    marginTop: 6,
  },
  stepperRow: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 2 },
  stepperButton: {
    width: 20,
    height: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: PitWallTheme.colors.surfaceContainerHigh,
    borderRadius: PitWallTheme.borderRadius.sm,
  },
  stintLaps: {
    fontFamily: PitWallTheme.fonts.dataMono,
    fontSize: 12,
    color: PitWallTheme.colors.onSurfaceVariant,
    minWidth: 20,
    textAlign: 'center',
  },
  addStint: {
    width: 52,
    height: 46,
    borderRadius: PitWallTheme.borderRadius.DEFAULT,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: PitWallTheme.colors.outlineVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    fontFamily: PitWallTheme.fonts.body,
    fontSize: 11,
    color: PitWallTheme.colors.onSurfaceVariant,
    marginTop: 14,
  },

  scrubberHeader: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 18, marginBottom: 6 },
  scrubberLabel: {
    fontFamily: PitWallTheme.fonts.dataMono,
    fontSize: 10,
    color: PitWallTheme.colors.onSurfaceVariant,
  },
  scrubberTrack: {
    flexDirection: 'row',
    height: 8,
    borderRadius: PitWallTheme.borderRadius.full,
    overflow: 'hidden',
    backgroundColor: PitWallTheme.colors.surfaceDim,
  },
  scrubberFooter: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 6 },

  runButton: {
    backgroundColor: PitWallTheme.colors.primaryContainer,
    borderRadius: PitWallTheme.borderRadius.DEFAULT,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  runButtonText: {
    fontFamily: PitWallTheme.fonts.headlineBold,
    fontSize: 17,
    letterSpacing: 1.2,
    color: '#FFFFFF',
  },

  resultsCard: {
    backgroundColor: PitWallTheme.colors.surfaceContainerLow,
    borderRadius: PitWallTheme.borderRadius.lg,
    padding: PitWallTheme.spacing.md,
    borderTopWidth: 2,
    borderTopColor: PitWallTheme.colors.primary,
  },
  emptyResults: { alignItems: 'center', gap: 8, paddingVertical: 28 },
  emptyResultsText: {
    fontFamily: PitWallTheme.fonts.body,
    fontSize: 13,
    color: PitWallTheme.colors.onSurfaceVariant,
    textAlign: 'center',
  },
  deltaBlock: { alignItems: 'center', paddingVertical: 24 },
  deltaLabel: {
    fontFamily: PitWallTheme.fonts.headline,
    fontSize: 11,
    letterSpacing: 1.2,
    color: PitWallTheme.colors.onSurfaceVariant,
  },
  deltaValue: {
    fontFamily: PitWallTheme.fonts.dataMono,
    fontSize: 42,
    marginTop: 6,
  },
  deltaSub: {
    fontFamily: PitWallTheme.fonts.body,
    fontSize: 12,
    color: PitWallTheme.colors.onSurfaceVariant,
    marginTop: 2,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 11,
    borderBottomWidth: 1,
    borderBottomColor: PitWallTheme.colors.surfaceContainerHighest,
  },
  resultLabel: {
    fontFamily: PitWallTheme.fonts.body,
    fontSize: 14,
    color: PitWallTheme.colors.onSurfaceVariant,
  },
  resultValue: {
    fontFamily: PitWallTheme.fonts.dataMono,
    fontSize: 14,
    color: PitWallTheme.colors.onSurface,
  },
  confidenceWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  confidenceTrack: {
    width: 64,
    height: 6,
    borderRadius: PitWallTheme.borderRadius.full,
    backgroundColor: PitWallTheme.colors.surfaceDim,
    overflow: 'hidden',
  },
  confidenceFill: { height: '100%', backgroundColor: PitWallTheme.colors.success },
  warning: {
    fontFamily: PitWallTheme.fonts.body,
    fontSize: 11,
    color: PitWallTheme.colors.error,
    marginTop: 12,
  },
  disclaimer: {
    fontFamily: PitWallTheme.fonts.body,
    fontSize: 10,
    color: PitWallTheme.colors.onSurfaceVariant,
    marginTop: 8,
  },
});
