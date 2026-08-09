import axios from 'axios';
import { Platform } from 'react-native';

// Default to localhost for web/iOS, 10.0.2.2 for Android emulator, or process.env.EXPO_PUBLIC_API_URL
const getBaseUrl = () => {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:8000';
  }
  return 'http://localhost:8000';
};

export const API_BASE_URL = getBaseUrl();

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  timeout: 8000,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface HealthResponse {
  status: string;
  database: string;
}

export const fetchHealthStatus = async (): Promise<HealthResponse> => {
  const response = await apiClient.get<HealthResponse>('/api/health');
  return response.data;
};

export interface DriverListItem {
  driverId: string;
  givenName: string;
  familyName: string;
  code: string | null;
  permanentNumber: string | null;
  nationality: string | null;
  team: string | null;
  lastSeason: number | null;
  wins: number;
}

export interface DriverListResponse {
  items: DriverListItem[];
  total: number;
  page: number;
  pageSize: number;
  hasMore: boolean;
}

export const fetchDrivers = async (search?: string): Promise<DriverListResponse> => {
  const response = await apiClient.get<DriverListResponse>('/api/drivers', {
    params: search ? { search } : undefined,
  });
  return response.data;
};

export interface DriverCareer {
  starts: number;
  wins: number;
  podiums: number;
  poles: number;
  points: number;
  championships: number;
}

export interface TeamHistoryEntry {
  constructorId: string;
  name: string;
  fromYear: number;
  toYear: number;
  races: number;
}

export interface DriverDetail {
  driverId: string;
  givenName: string;
  familyName: string;
  code: string | null;
  permanentNumber: string | null;
  dateOfBirth: string | null;
  nationality: string | null;
  career: DriverCareer;
  teamHistory: TeamHistoryEntry[];
  seasons: number[];
}

export const fetchDriverDetail = async (driverId: string): Promise<DriverDetail> => {
  const response = await apiClient.get<DriverDetail>(`/api/drivers/${driverId}`);
  return response.data;
};

export interface SeasonRace {
  round: number;
  raceName: string;
  circuitName: string | null;
  date: string | null;
  team: string;
  grid: number | null;
  position: number | null;
  points: number | null;
  status: string | null;
}

export interface DriverSeason {
  driverId: string;
  season: number;
  standing: { position: number | null; points: number | null; wins: number | null } | null;
  races: SeasonRace[];
}

export const fetchDriverSeason = async (driverId: string, year: number): Promise<DriverSeason> => {
  const response = await apiClient.get<DriverSeason>(`/api/drivers/${driverId}/seasons/${year}`);
  return response.data;
};
