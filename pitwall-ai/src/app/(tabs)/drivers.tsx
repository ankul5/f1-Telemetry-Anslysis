import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import {
  fetchDrivers,
  fetchDriverDetail,
  fetchDriverSeason,
  DriverListItem,
} from '../../services/api';
import { PitWallTheme } from '../../constants/theme';
import { TopBar } from '../../components/top-bar';

const TEAM_FILTERS = ['ALL', 'RED BULL', 'FERRARI', 'MERCEDES', 'MCLAREN'];

const TEAM_ACCENT: Record<string, string> = {
  'red bull': PitWallTheme.colors.teamRedBull,
  ferrari: PitWallTheme.colors.teamFerrari,
  mercedes: PitWallTheme.colors.teamMercedes,
  mclaren: PitWallTheme.colors.teamMcLaren,
};

function teamAccent(team: string | null) {
  if (!team) return PitWallTheme.colors.outlineVariant;
  const key = Object.keys(TEAM_ACCENT).find((k) => team.toLowerCase().includes(k));
  return key ? TEAM_ACCENT[key] : PitWallTheme.colors.outlineVariant;
}

function StatTile({ label, value, highlighted }: { label: string; value: string | number; highlighted?: boolean }) {
  return (
    <View style={[styles.statTile, highlighted && styles.statTileHighlighted]}>
      <Text style={styles.statLabel}>{label}</Text>
      <Text style={styles.statValue}>{value}</Text>
    </View>
  );
}

export default function DriversScreen() {
  const [search, setSearch] = useState('');
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // A team chip and the free-text box are the same backend query, so collapse them into one term.
  const effectiveSearch = useMemo(() => {
    if (search.trim()) return search.trim();
    return activeFilter === 'ALL' ? '' : activeFilter;
  }, [search, activeFilter]);

  const listQuery = useQuery({
    queryKey: ['drivers', effectiveSearch],
    queryFn: () => fetchDrivers(effectiveSearch || undefined),
    placeholderData: keepPreviousData,
  });

  const drivers = listQuery.data?.items ?? [];
  // Fall back to the first result so the profile panel is never empty on load.
  const activeId = selectedId ?? drivers[0]?.driverId ?? null;

  const detailQuery = useQuery({
    queryKey: ['driver', activeId],
    queryFn: () => fetchDriverDetail(activeId!),
    enabled: !!activeId,
  });

  const detail = detailQuery.data;
  const latestSeason = detail?.seasons?.[0];

  const seasonQuery = useQuery({
    queryKey: ['driverSeason', activeId, latestSeason],
    queryFn: () => fetchDriverSeason(activeId!, latestSeason!),
    enabled: !!activeId && !!latestSeason,
  });

  const renderDriverRow = (d: DriverListItem) => {
    const selected = d.driverId === activeId;
    return (
      <TouchableOpacity
        key={d.driverId}
        activeOpacity={0.75}
        onPress={() => setSelectedId(d.driverId)}
        style={[
          styles.driverRow,
          { borderLeftColor: selected ? PitWallTheme.colors.primaryContainer : teamAccent(d.team) },
          selected && styles.driverRowSelected,
        ]}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {(d.givenName?.[0] ?? '') + (d.familyName?.[0] ?? '')}
          </Text>
        </View>
        <View style={styles.driverRowText}>
          <Text style={styles.driverName} numberOfLines={1}>
            {d.givenName?.[0]}. {d.familyName?.toUpperCase()}
          </Text>
          <Text style={styles.driverTeamName} numberOfLines={1}>
            {d.team ?? 'Unknown team'}
          </Text>
        </View>
        <Text style={styles.driverNumber}>
          {d.permanentNumber ? String(d.permanentNumber).padStart(2, '0') : '--'}
        </Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <TopBar />
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        {/* Search */}
        <View style={styles.searchWrap}>
          <Ionicons
            name="search-outline"
            size={18}
            color={PitWallTheme.colors.outlineVariant}
            style={styles.searchIcon}
          />
          <TextInput
            value={search}
            onChangeText={setSearch}
            placeholder="Search drivers or teams"
            placeholderTextColor={`${PitWallTheme.colors.onSurfaceVariant}80`}
            style={styles.searchInput}
            autoCorrect={false}
            autoCapitalize="none"
          />
          {search.length > 0 && (
            <TouchableOpacity onPress={() => setSearch('')} hitSlop={10}>
              <Ionicons name="close-circle" size={18} color={PitWallTheme.colors.onSurfaceVariant} />
            </TouchableOpacity>
          )}
        </View>

        {/* Team filter chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.chipRow}
        >
          {TEAM_FILTERS.map((t) => {
            const active = activeFilter === t && !search.trim();
            return (
              <TouchableOpacity
                key={t}
                onPress={() => {
                  setActiveFilter(t);
                  setSearch('');
                  setSelectedId(null);
                }}
                style={[styles.chip, active && styles.chipActive]}
                activeOpacity={0.8}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{t}</Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>

        {/* Driver list */}
        {listQuery.isLoading ? (
          <View style={styles.stateBox}>
            <ActivityIndicator color={PitWallTheme.colors.primaryContainer} />
            <Text style={styles.stateText}>Loading drivers…</Text>
          </View>
        ) : listQuery.isError ? (
          <View style={styles.stateBox}>
            <Ionicons name="cloud-offline-outline" size={26} color={PitWallTheme.colors.error} />
            <Text style={[styles.stateText, { color: PitWallTheme.colors.error }]}>
              Can't reach the backend.
            </Text>
            <Text style={styles.stateHint}>Make sure the FastAPI server is running.</Text>
            <TouchableOpacity onPress={() => listQuery.refetch()} style={styles.retryButton}>
              <Text style={styles.retryText}>RETRY</Text>
            </TouchableOpacity>
          </View>
        ) : drivers.length === 0 ? (
          <View style={styles.stateBox}>
            <Ionicons name="search-outline" size={26} color={PitWallTheme.colors.onSurfaceVariant} />
            <Text style={styles.stateText}>No drivers match "{effectiveSearch}"</Text>
            <Text style={styles.stateHint}>Try a different name or team.</Text>
          </View>
        ) : (
          <View style={styles.driverList}>{drivers.map(renderDriverRow)}</View>
        )}

        {/* Profile panel */}
        {detail && (
          <>
            <View style={styles.profileHeader}>
              <Text style={styles.profileTeam}>
                {detail.teamHistory[detail.teamHistory.length - 1]?.name?.toUpperCase() ?? '—'}
              </Text>
              <View style={styles.profileNameRow}>
                <Text style={styles.profileNumber}>
                  {detail.permanentNumber ?? detail.code ?? ''}
                </Text>
                <Text style={styles.profileName}>{detail.familyName.toUpperCase()}</Text>
              </View>
              <Text style={styles.profileMeta}>
                {detail.nationality ?? '—'}
                {detail.dateOfBirth ? `  ·  b. ${detail.dateOfBirth}` : ''}
              </Text>
            </View>

            <View style={styles.statRow}>
              <StatTile label="WINS" value={detail.career.wins} />
              <StatTile label="PODIUMS" value={detail.career.podiums} highlighted />
              <StatTile label="POLES" value={detail.career.poles} />
            </View>
            <View style={styles.statRow}>
              <StatTile label="STARTS" value={detail.career.starts} />
              <StatTile label="POINTS" value={detail.career.points} />
              <StatTile label="TITLES" value={detail.career.championships} />
            </View>

            {/* Recent form */}
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="flag-outline" size={15} color={PitWallTheme.colors.primaryContainer} />
                <Text style={styles.cardTitle}>RECENT FORM {latestSeason ? `· ${latestSeason}` : ''}</Text>
              </View>
              {seasonQuery.isLoading ? (
                <ActivityIndicator color={PitWallTheme.colors.primaryContainer} style={{ marginTop: 12 }} />
              ) : (
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.formRow}>
                  {(seasonQuery.data?.races ?? []).slice(-6).map((r) => {
                    const dnf = r.position == null;
                    return (
                      <View key={r.round} style={[styles.formItem, dnf && styles.formItemDnf]}>
                        <Text style={styles.formLabel} numberOfLines={1}>
                          {r.raceName.replace(' Grand Prix', '').slice(0, 3).toUpperCase()}
                        </Text>
                        <Text
                          style={[
                            styles.formValue,
                            dnf && { color: PitWallTheme.colors.error },
                            r.position === 1 && { color: PitWallTheme.colors.primaryContainer },
                          ]}
                        >
                          {dnf ? 'DNF' : r.position}
                        </Text>
                      </View>
                    );
                  })}
                  {(seasonQuery.data?.races?.length ?? 0) === 0 && (
                    <Text style={styles.stateHint}>No races recorded for this season yet.</Text>
                  )}
                </ScrollView>
              )}
            </View>

            {/* Team history */}
            <View style={styles.card}>
              <View style={styles.cardTitleRow}>
                <Ionicons name="business-outline" size={15} color={PitWallTheme.colors.onSurfaceVariant} />
                <Text style={styles.cardTitle}>TEAM HISTORY</Text>
              </View>
              {detail.teamHistory.map((t) => (
                <View key={t.constructorId} style={styles.teamHistoryRow}>
                  <View style={[styles.teamDot, { backgroundColor: teamAccent(t.name) }]} />
                  <Text style={styles.teamHistoryName}>{t.name}</Text>
                  <Text style={styles.teamHistoryYears}>
                    {t.fromYear === t.toYear ? t.fromYear : `${t.fromYear}–${t.toYear}`}
                  </Text>
                  <Text style={styles.teamHistoryRaces}>{t.races} R</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: PitWallTheme.colors.background },
  scrollContent: { padding: PitWallTheme.spacing.md, gap: PitWallTheme.spacing.sm, paddingBottom: 32 },

  searchWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PitWallTheme.colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: `${PitWallTheme.colors.outline}66`,
    borderRadius: PitWallTheme.borderRadius.DEFAULT,
    paddingHorizontal: 10,
    height: 42,
    gap: 8,
  },
  searchIcon: { marginTop: 1 },
  searchInput: {
    flex: 1,
    fontFamily: PitWallTheme.fonts.body,
    fontSize: 14,
    color: PitWallTheme.colors.onSurface,
    padding: 0,
  },

  chipRow: { gap: 8, paddingVertical: 2 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: PitWallTheme.borderRadius.DEFAULT,
    backgroundColor: PitWallTheme.colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: `${PitWallTheme.colors.outlineVariant}66`,
  },
  chipActive: {
    backgroundColor: PitWallTheme.colors.primaryContainer,
    borderColor: PitWallTheme.colors.primaryContainer,
  },
  chipText: {
    fontFamily: PitWallTheme.fonts.headline,
    fontSize: 11,
    letterSpacing: 0.8,
    color: PitWallTheme.colors.onSurface,
  },
  chipTextActive: { color: '#FFFFFF' },

  driverList: { gap: 4, marginTop: 4 },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PitWallTheme.colors.surfaceContainerLow,
    padding: PitWallTheme.spacing.sm,
    borderLeftWidth: 3,
    borderRadius: PitWallTheme.borderRadius.sm,
    gap: 10,
  },
  driverRowSelected: { backgroundColor: PitWallTheme.colors.surfaceContainerHigh },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: PitWallTheme.borderRadius.DEFAULT,
    backgroundColor: PitWallTheme.colors.surfaceVariant,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontFamily: PitWallTheme.fonts.headline,
    fontSize: 15,
    color: PitWallTheme.colors.onSurfaceVariant,
  },
  driverRowText: { flex: 1 },
  driverName: {
    fontFamily: PitWallTheme.fonts.headline,
    fontSize: 17,
    color: PitWallTheme.colors.onSurface,
  },
  driverTeamName: {
    fontFamily: PitWallTheme.fonts.body,
    fontSize: 12,
    color: PitWallTheme.colors.onSurfaceVariant,
  },
  driverNumber: {
    fontFamily: PitWallTheme.fonts.dataMono,
    fontSize: 18,
    color: PitWallTheme.colors.primaryContainer,
  },

  stateBox: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 32,
    backgroundColor: PitWallTheme.colors.surfaceContainerLow,
    borderRadius: PitWallTheme.borderRadius.DEFAULT,
    marginTop: 4,
  },
  stateText: {
    fontFamily: PitWallTheme.fonts.body,
    fontSize: 14,
    color: PitWallTheme.colors.onSurface,
  },
  stateHint: {
    fontFamily: PitWallTheme.fonts.body,
    fontSize: 12,
    color: PitWallTheme.colors.onSurfaceVariant,
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: PitWallTheme.borderRadius.DEFAULT,
    backgroundColor: PitWallTheme.colors.primaryContainer,
  },
  retryText: {
    fontFamily: PitWallTheme.fonts.headline,
    fontSize: 12,
    letterSpacing: 1,
    color: '#FFFFFF',
  },

  profileHeader: {
    backgroundColor: PitWallTheme.colors.surfaceContainerHigh,
    borderRadius: PitWallTheme.borderRadius.DEFAULT,
    padding: PitWallTheme.spacing.md,
    marginTop: PitWallTheme.spacing.sm,
    borderLeftWidth: 3,
    borderLeftColor: PitWallTheme.colors.primaryContainer,
  },
  profileTeam: {
    fontFamily: PitWallTheme.fonts.headline,
    fontSize: 11,
    letterSpacing: 1.5,
    color: PitWallTheme.colors.primaryContainer,
  },
  profileNameRow: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 2 },
  profileNumber: {
    fontFamily: PitWallTheme.fonts.dataMono,
    fontSize: 26,
    color: PitWallTheme.colors.primaryContainer,
  },
  profileName: {
    fontFamily: PitWallTheme.fonts.headlineBold,
    fontSize: PitWallTheme.type.headlineXl.fontSize,
    color: PitWallTheme.colors.onSurface,
  },
  profileMeta: {
    fontFamily: PitWallTheme.fonts.dataMono,
    fontSize: 11,
    color: PitWallTheme.colors.onSurfaceVariant,
    marginTop: 4,
  },

  statRow: { flexDirection: 'row', gap: 4 },
  statTile: {
    flex: 1,
    backgroundColor: PitWallTheme.colors.surfaceContainerLow,
    paddingVertical: 12,
    alignItems: 'center',
    borderTopWidth: 2,
    borderTopColor: `${PitWallTheme.colors.outlineVariant}33`,
    borderRadius: PitWallTheme.borderRadius.sm,
  },
  statTileHighlighted: { borderTopColor: PitWallTheme.colors.primaryContainer },
  statLabel: {
    fontFamily: PitWallTheme.fonts.headline,
    fontSize: 10,
    letterSpacing: 1,
    color: PitWallTheme.colors.onSurfaceVariant,
  },
  statValue: {
    fontFamily: PitWallTheme.fonts.dataMono,
    fontSize: 18,
    color: PitWallTheme.colors.onSurface,
    marginTop: 3,
  },

  card: {
    backgroundColor: PitWallTheme.colors.surfaceContainerLow,
    borderRadius: PitWallTheme.borderRadius.DEFAULT,
    padding: PitWallTheme.spacing.md,
    marginTop: 4,
  },
  cardTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  cardTitle: {
    fontFamily: PitWallTheme.fonts.headline,
    fontSize: PitWallTheme.type.headlineMd.fontSize,
    color: PitWallTheme.colors.onSurface,
  },
  formRow: { gap: 8, paddingTop: 12, alignItems: 'center' },
  formItem: {
    minWidth: 58,
    backgroundColor: PitWallTheme.colors.surfaceContainerHigh,
    borderWidth: 1,
    borderColor: `${PitWallTheme.colors.outlineVariant}33`,
    borderRadius: PitWallTheme.borderRadius.DEFAULT,
    paddingVertical: 8,
    alignItems: 'center',
  },
  formItemDnf: { opacity: 0.6 },
  formLabel: {
    fontFamily: PitWallTheme.fonts.headline,
    fontSize: 10,
    letterSpacing: 0.8,
    color: PitWallTheme.colors.onSurfaceVariant,
  },
  formValue: {
    fontFamily: PitWallTheme.fonts.dataMono,
    fontSize: 14,
    color: PitWallTheme.colors.onSurface,
    marginTop: 2,
  },

  teamHistoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: `${PitWallTheme.colors.outlineVariant}22`,
  },
  teamDot: { width: 8, height: 8, borderRadius: 4 },
  teamHistoryName: {
    flex: 1,
    fontFamily: PitWallTheme.fonts.body,
    fontSize: 14,
    color: PitWallTheme.colors.onSurface,
  },
  teamHistoryYears: {
    fontFamily: PitWallTheme.fonts.dataMono,
    fontSize: 12,
    color: PitWallTheme.colors.onSurfaceVariant,
  },
  teamHistoryRaces: {
    fontFamily: PitWallTheme.fonts.dataMono,
    fontSize: 12,
    color: PitWallTheme.colors.onSurfaceVariant,
    width: 44,
    textAlign: 'right',
  },
});
