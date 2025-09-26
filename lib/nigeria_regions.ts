/**
 * Nigeria States and Regions Mapping
 * Comprehensive mapping of Nigeria's 36 states and FCT with coordinates
 */

export interface NigeriaState {
  name: string;
  code: string;
  region: string;
  capital: string;
  latitude: number;
  longitude: number;
  population: number;
  area_km2: number;
  flood_risk_level: 'low' | 'medium' | 'high' | 'critical';
  major_rivers: string[];
  climate_zone: string;
}

export interface NigeriaRegion {
  name: string;
  states: string[];
  center_lat: number;
  center_lon: number;
  total_population: number;
  total_area_km2: number;
  avg_flood_risk: 'low' | 'medium' | 'high' | 'critical';
}

export const NIGERIA_STATES: NigeriaState[] = [
  // North Central
  {
    name: "Abuja (FCT)",
    code: "FCT",
    region: "North Central",
    capital: "Abuja",
    latitude: 9.0765,
    longitude: 7.3986,
    population: 356412,
    area_km2: 1769,
    flood_risk_level: "medium",
    major_rivers: ["River Gurara", "River Usuma"],
    climate_zone: "Tropical savanna"
  },
  {
    name: "Benue",
    code: "BE",
    region: "North Central",
    capital: "Makurdi",
    latitude: 7.7322,
    longitude: 8.5391,
    population: 4735123,
    area_km2: 34059,
    flood_risk_level: "high",
    major_rivers: ["Benue River", "Katsina-Ala River"],
    climate_zone: "Tropical savanna"
  },
  {
    name: "Kogi",
    code: "KO",
    region: "North Central",
    capital: "Lokoja",
    latitude: 7.8019,
    longitude: 6.7446,
    population: 3514406,
    area_km2: 29833,
    flood_risk_level: "high",
    major_rivers: ["Niger River", "Benue River"],
    climate_zone: "Tropical savanna"
  },
  {
    name: "Kwara",
    code: "KW",
    region: "North Central",
    capital: "Ilorin",
    latitude: 8.5000,
    longitude: 4.5500,
    population: 2362089,
    area_km2: 36825,
    flood_risk_level: "medium",
    major_rivers: ["Niger River", "Oyun River"],
    climate_zone: "Tropical savanna"
  },
  {
    name: "Nasarawa",
    code: "NA",
    region: "North Central",
    capital: "Lafia",
    latitude: 8.5000,
    longitude: 8.2000,
    population: 1869315,
    area_km2: 27117,
    flood_risk_level: "medium",
    major_rivers: ["Benue River", "Farin Ruwa River"],
    climate_zone: "Tropical savanna"
  },
  {
    name: "Niger",
    code: "NI",
    region: "North Central",
    capital: "Minna",
    latitude: 9.6000,
    longitude: 6.5500,
    population: 3954772,
    area_km2: 76363,
    flood_risk_level: "medium",
    major_rivers: ["Niger River", "Kaduna River"],
    climate_zone: "Tropical savanna"
  },
  {
    name: "Plateau",
    code: "PL",
    region: "North Central",
    capital: "Jos",
    latitude: 9.9167,
    longitude: 8.9000,
    population: 3194601,
    area_km2: 30913,
    flood_risk_level: "low",
    major_rivers: ["Delimi River", "Rayfield River"],
    climate_zone: "Tropical savanna"
  },

  // North East
  {
    name: "Adamawa",
    code: "AD",
    region: "North East",
    capital: "Yola",
    latitude: 9.2000,
    longitude: 12.4833,
    population: 3178950,
    area_km2: 36917,
    flood_risk_level: "high",
    major_rivers: ["Benue River", "Gongola River"],
    climate_zone: "Tropical savanna"
  },
  {
    name: "Bauchi",
    code: "BA",
    region: "North East",
    capital: "Bauchi",
    latitude: 10.3158,
    longitude: 9.8442,
    population: 4650399,
    area_km2: 45837,
    flood_risk_level: "medium",
    major_rivers: ["Gongola River", "Komadugu Yobe"],
    climate_zone: "Tropical savanna"
  },
  {
    name: "Borno",
    code: "BO",
    region: "North East",
    capital: "Maiduguri",
    latitude: 11.8333,
    longitude: 13.1500,
    population: 4161689,
    area_km2: 70898,
    flood_risk_level: "low",
    major_rivers: ["Komadugu Yobe", "Ngadda River"],
    climate_zone: "Semi-arid"
  },
  {
    name: "Gombe",
    code: "GO",
    region: "North East",
    capital: "Gombe",
    latitude: 10.2894,
    longitude: 11.1717,
    population: 2564000,
    area_km2: 18768,
    flood_risk_level: "medium",
    major_rivers: ["Gongola River", "Hawal River"],
    climate_zone: "Tropical savanna"
  },
  {
    name: "Taraba",
    code: "TA",
    region: "North East",
    capital: "Jalingo",
    latitude: 8.9000,
    longitude: 11.3667,
    population: 2471499,
    area_km2: 54473,
    flood_risk_level: "high",
    major_rivers: ["Benue River", "Taraba River"],
    climate_zone: "Tropical savanna"
  },
  {
    name: "Yobe",
    code: "YO",
    region: "North East",
    capital: "Damaturu",
    latitude: 11.7500,
    longitude: 11.9667,
    population: 2334000,
    area_km2: 45502,
    flood_risk_level: "low",
    major_rivers: ["Komadugu Yobe", "Hadejia River"],
    climate_zone: "Semi-arid"
  },

  // North West
  {
    name: "Kaduna",
    code: "KD",
    region: "North West",
    capital: "Kaduna",
    latitude: 10.5200,
    longitude: 7.4383,
    population: 6105400,
    area_km2: 46053,
    flood_risk_level: "medium",
    major_rivers: ["Kaduna River", "Gurara River"],
    climate_zone: "Tropical savanna"
  },
  {
    name: "Kano",
    code: "KN",
    region: "North West",
    capital: "Kano",
    latitude: 12.0000,
    longitude: 8.5167,
    population: 9902000,
    area_km2: 20131,
    flood_risk_level: "low",
    major_rivers: ["Kano River", "Chalawa River"],
    climate_zone: "Semi-arid"
  },
  {
    name: "Katsina",
    code: "KT",
    region: "North West",
    capital: "Katsina",
    latitude: 12.9908,
    longitude: 7.6019,
    population: 5820000,
    area_km2: 24192,
    flood_risk_level: "low",
    major_rivers: ["Sokoto River", "Rima River"],
    climate_zone: "Semi-arid"
  },
  {
    name: "Kebbi",
    code: "KE",
    region: "North West",
    capital: "Birnin Kebbi",
    latitude: 12.4500,
    longitude: 4.2000,
    population: 3400000,
    area_km2: 36800,
    flood_risk_level: "medium",
    major_rivers: ["Sokoto River", "Rima River"],
    climate_zone: "Tropical savanna"
  },
  {
    name: "Sokoto",
    code: "SO",
    region: "North West",
    capital: "Sokoto",
    latitude: 13.0667,
    longitude: 5.2333,
    population: 3700000,
    area_km2: 25973,
    flood_risk_level: "low",
    major_rivers: ["Sokoto River", "Rima River"],
    climate_zone: "Semi-arid"
  },
  {
    name: "Zamfara",
    code: "ZA",
    region: "North West",
    capital: "Gusau",
    latitude: 12.1700,
    longitude: 6.6600,
    population: 3200000,
    area_km2: 39762,
    flood_risk_level: "low",
    major_rivers: ["Sokoto River", "Rima River"],
    climate_zone: "Semi-arid"
  },

  // South East
  {
    name: "Abia",
    code: "AB",
    region: "South East",
    capital: "Umuahia",
    latitude: 5.5333,
    longitude: 7.4833,
    population: 2845380,
    area_km2: 6324,
    flood_risk_level: "high",
    major_rivers: ["Imo River", "Abia River"],
    climate_zone: "Tropical rainforest"
  },
  {
    name: "Anambra",
    code: "AN",
    region: "South East",
    capital: "Awka",
    latitude: 6.2107,
    longitude: 7.0743,
    population: 4178000,
    area_km2: 4844,
    flood_risk_level: "critical",
    major_rivers: ["Niger River", "Anambra River"],
    climate_zone: "Tropical rainforest"
  },
  {
    name: "Ebonyi",
    code: "EB",
    region: "South East",
    capital: "Abakaliki",
    latitude: 6.3333,
    longitude: 8.1000,
    population: 2100000,
    area_km2: 5670,
    flood_risk_level: "high",
    major_rivers: ["Cross River", "Ebonyi River"],
    climate_zone: "Tropical rainforest"
  },
  {
    name: "Enugu",
    code: "EN",
    region: "South East",
    capital: "Enugu",
    latitude: 6.4500,
    longitude: 7.5000,
    population: 3230000,
    area_km2: 7161,
    flood_risk_level: "medium",
    major_rivers: ["Ekulu River", "Nyaba River"],
    climate_zone: "Tropical rainforest"
  },
  {
    name: "Imo",
    code: "IM",
    region: "South East",
    capital: "Owerri",
    latitude: 5.4833,
    longitude: 7.0333,
    population: 4000000,
    area_km2: 5530,
    flood_risk_level: "high",
    major_rivers: ["Imo River", "Otamiri River"],
    climate_zone: "Tropical rainforest"
  },

  // South South
  {
    name: "Akwa Ibom",
    code: "AK",
    region: "South South",
    capital: "Uyo",
    latitude: 5.0333,
    longitude: 7.9167,
    population: 3600000,
    area_km2: 7081,
    flood_risk_level: "high",
    major_rivers: ["Cross River", "Kwa Ibo River"],
    climate_zone: "Tropical rainforest"
  },
  {
    name: "Bayelsa",
    code: "BY",
    region: "South South",
    capital: "Yenagoa",
    latitude: 4.9167,
    longitude: 6.2667,
    population: 1734000,
    area_km2: 10773,
    flood_risk_level: "critical",
    major_rivers: ["Niger River", "Forcados River"],
    climate_zone: "Tropical rainforest"
  },
  {
    name: "Cross River",
    code: "CR",
    region: "South South",
    capital: "Calabar",
    latitude: 4.9500,
    longitude: 8.3167,
    population: 2700000,
    area_km2: 20156,
    flood_risk_level: "high",
    major_rivers: ["Cross River", "Calabar River"],
    climate_zone: "Tropical rainforest"
  },
  {
    name: "Delta",
    code: "DE",
    region: "South South",
    capital: "Asaba",
    latitude: 6.2000,
    longitude: 6.7333,
    population: 4200000,
    area_km2: 17698,
    flood_risk_level: "critical",
    major_rivers: ["Niger River", "Forcados River"],
    climate_zone: "Tropical rainforest"
  },
  {
    name: "Edo",
    code: "ED",
    region: "South South",
    capital: "Benin City",
    latitude: 6.3333,
    longitude: 5.6167,
    population: 3200000,
    area_km2: 17802,
    flood_risk_level: "high",
    major_rivers: ["Benin River", "Ovia River"],
    climate_zone: "Tropical rainforest"
  },
  {
    name: "Rivers",
    code: "RI",
    region: "South South",
    capital: "Port Harcourt",
    latitude: 4.7500,
    longitude: 7.0000,
    population: 5200000,
    area_km2: 11077,
    flood_risk_level: "critical",
    major_rivers: ["Niger River", "Bonny River"],
    climate_zone: "Tropical rainforest"
  },

  // South West
  {
    name: "Ekiti",
    code: "EK",
    region: "South West",
    capital: "Ado-Ekiti",
    latitude: 7.6167,
    longitude: 5.2167,
    population: 2200000,
    area_km2: 6353,
    flood_risk_level: "medium",
    major_rivers: ["Osun River", "Ero River"],
    climate_zone: "Tropical rainforest"
  },
  {
    name: "Lagos",
    code: "LA",
    region: "South West",
    capital: "Ikeja",
    latitude: 6.5244,
    longitude: 3.3792,
    population: 12000000,
    area_km2: 3345,
    flood_risk_level: "critical",
    major_rivers: ["Lagos Lagoon", "Ogun River"],
    climate_zone: "Tropical rainforest"
  },
  {
    name: "Ogun",
    code: "OG",
    region: "South West",
    capital: "Abeokuta",
    latitude: 7.1500,
    longitude: 3.3500,
    population: 3800000,
    area_km2: 16762,
    flood_risk_level: "high",
    major_rivers: ["Ogun River", "Yewa River"],
    climate_zone: "Tropical rainforest"
  },
  {
    name: "Ondo",
    code: "ON",
    region: "South West",
    capital: "Akure",
    latitude: 7.2500,
    longitude: 5.2000,
    population: 3400000,
    area_km2: 15500,
    flood_risk_level: "medium",
    major_rivers: ["Ondo River", "Ose River"],
    climate_zone: "Tropical rainforest"
  },
  {
    name: "Osun",
    code: "OS",
    region: "South West",
    capital: "Oshogbo",
    latitude: 7.7667,
    longitude: 4.5667,
    population: 3400000,
    area_km2: 9251,
    flood_risk_level: "medium",
    major_rivers: ["Osun River", "Oba River"],
    climate_zone: "Tropical rainforest"
  },
  {
    name: "Oyo",
    code: "OY",
    region: "South West",
    capital: "Ibadan",
    latitude: 7.3833,
    longitude: 3.9000,
    population: 5500000,
    area_km2: 28454,
    flood_risk_level: "medium",
    major_rivers: ["Ogun River", "Oba River"],
    climate_zone: "Tropical rainforest"
  }
];

export const NIGERIA_REGIONS: NigeriaRegion[] = [
  {
    name: "North Central",
    states: ["FCT", "BE", "KO", "KW", "NA", "NI", "PL"],
    center_lat: 8.5,
    center_lon: 7.5,
    total_population: 20000000,
    total_area_km2: 250000,
    avg_flood_risk: "medium"
  },
  {
    name: "North East",
    states: ["AD", "BA", "BO", "GO", "TA", "YO"],
    center_lat: 11.0,
    center_lon: 12.0,
    total_population: 18000000,
    total_area_km2: 300000,
    avg_flood_risk: "medium"
  },
  {
    name: "North West",
    states: ["KD", "KN", "KT", "KE", "SO", "ZA"],
    center_lat: 12.0,
    center_lon: 6.5,
    total_population: 35000000,
    total_area_km2: 200000,
    avg_flood_risk: "low"
  },
  {
    name: "South East",
    states: ["AB", "AN", "EB", "EN", "IM"],
    center_lat: 6.0,
    center_lon: 7.5,
    total_population: 15000000,
    total_area_km2: 30000,
    avg_flood_risk: "high"
  },
  {
    name: "South South",
    states: ["AK", "BY", "CR", "DE", "ED", "RI"],
    center_lat: 5.5,
    center_lon: 6.5,
    total_population: 20000000,
    total_area_km2: 80000,
    avg_flood_risk: "critical"
  },
  {
    name: "South West",
    states: ["EK", "LA", "OG", "ON", "OS", "OY"],
    center_lat: 7.0,
    center_lon: 4.0,
    total_population: 30000000,
    total_area_km2: 80000,
    avg_flood_risk: "high"
  }
];

// Helper functions
export function getStateByCode(code: string): NigeriaState | undefined {
  return NIGERIA_STATES.find(state => state.code === code);
}

export function getStateByName(name: string): NigeriaState | undefined {
  return NIGERIA_STATES.find(state => 
    state.name.toLowerCase().includes(name.toLowerCase())
  );
}

export function getStatesByRegion(region: string): NigeriaState[] {
  return NIGERIA_STATES.filter(state => state.region === region);
}

export function getRegionByName(name: string): NigeriaRegion | undefined {
  return NIGERIA_REGIONS.find(region => region.name === name);
}

export function findNearestState(latitude: number, longitude: number): NigeriaState | undefined {
  let nearest: NigeriaState | undefined;
  let minDistance = Infinity;

  for (const state of NIGERIA_STATES) {
    const distance = Math.sqrt(
      Math.pow(state.latitude - latitude, 2) + 
      Math.pow(state.longitude - longitude, 2)
    );
    
    if (distance < minDistance) {
      minDistance = distance;
      nearest = state;
    }
  }

  return nearest;
}

export function getStatesByFloodRisk(riskLevel: 'low' | 'medium' | 'high' | 'critical'): NigeriaState[] {
  return NIGERIA_STATES.filter(state => state.flood_risk_level === riskLevel);
}

export function getHighRiskStates(): NigeriaState[] {
  return NIGERIA_STATES.filter(state => 
    state.flood_risk_level === 'high' || state.flood_risk_level === 'critical'
  );
}

// Export default for easy importing
export default {
  NIGERIA_STATES,
  NIGERIA_REGIONS,
  getStateByCode,
  getStateByName,
  getStatesByRegion,
  getRegionByName,
  findNearestState,
  getStatesByFloodRisk,
  getHighRiskStates
};
