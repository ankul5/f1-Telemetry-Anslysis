// Design tokens for PitWall AI
// Simplified for SDK 54 compatibility — uses system fonts as fallback
export const PitWallTheme = {
  colors: {
    background: '#121414',
    surface: '#121414',
    surfaceDim: '#121414',
    surfaceContainerLowest: '#0C0F0F',
    surfaceContainerLow: '#1A1C1C',
    surfaceContainer: '#1E2020',
    surfaceContainerHigh: '#282A2B',
    surfaceContainerHighest: '#333535',
    surfaceVariant: '#333535',
    onBackground: '#E2E2E2',
    onSurface: '#E2E2E2',
    onSurfaceVariant: '#E9BCB5',

    primary: '#FFB4A8',
    primaryContainer: '#E10600', // Racing Red
    onPrimary: '#680200',
    onPrimaryContainer: '#FFF2F0',
    onPrimaryFixed: '#410100',
    inversePrimary: '#C00500',

    secondary: '#C8C6C8',
    onSecondaryContainer: '#B7B4B7',

    outline: '#AF8781',
    outlineVariant: '#5E3F3A',

    error: '#FFB4AB',
    errorContainer: '#93000A',
    onError: '#690005',
    onErrorContainer: '#FFDAD6',
    success: '#00E676',

    textPrimary: '#E2E2E2',
    textSecondary: '#8A8A8E',
    border: '#333535',
    tabBarBackground: '#0C0F0F',
    tabBarInactive: '#8A8A8E',
    tabBarActive: '#E10600',

    // Team colors
    teamRedBull: '#0600EF',
    teamFerrari: '#E8002D',
    teamMercedes: '#00D2BE',
    teamMcLaren: '#FF8700',

    // Tyre compounds
    tyreSoft: '#FF3333',
    tyreMedium: '#FFD700',
    tyreHard: '#FFFFFF',
  },
  spacing: {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  },
  borderRadius: {
    sm: 4,
    DEFAULT: 8,
    lg: 12,
    xl: 16,
    full: 999,
  },
  fonts: {
    // Use system default — custom fonts loaded optionally
    body: undefined,
    headline: undefined,
    headlineBold: undefined,
    mono: undefined,
  },
};
