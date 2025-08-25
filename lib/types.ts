export type Role = "admin" | "operator" | "viewer";

export type Sensor = {
  id: string;
  name: string;
  type: "RAIN" | "RIVER" | "WATER_LEVEL" | "WIND" | "TEMP" | "HUMIDITY";
  lat: number;
  lon: number;
  elevation?: number | null;
  installed_at?: string;
};

export type Reading = {
  id: number;
  sensor_id: string;
  ts: string;
  value: number;
  status?: "OK" | "WARN" | "CRIT" | null;
  raw?: Record<string, unknown> | null;
  lat?: number | null;
  lon?: number | null;
};

export type Alert = {
  id: number;
  type: "FLOOD" | "RAIN" | "RIVER_RISE" | "SYSTEM";
  level: "INFO" | "WATCH" | "WARNING" | "EMERGENCY";
  message: string;
  created_at: string;
};
