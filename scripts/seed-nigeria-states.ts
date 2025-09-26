import { createClient } from '@supabase/supabase-js';

// Nigeria states data with coordinates
const nigeriaStates = [
  { code: 'AB', name: 'Abia', region: 'South East', capital: 'Umuahia', latitude: 5.5333, longitude: 7.4833, population: 2845380, area_km2: 6320, flood_risk_level: 'high', major_rivers: ['Imo River', 'Abia River'], climate_zone: 'Tropical Rainforest' },
  { code: 'AD', name: 'Adamawa', region: 'North East', capital: 'Yola', latitude: 9.2000, longitude: 12.4833, population: 3178950, area_km2: 36917, flood_risk_level: 'medium', major_rivers: ['Benue River', 'Gongola River'], climate_zone: 'Tropical Savanna' },
  { code: 'AK', name: 'Akwa Ibom', region: 'South South', capital: 'Uyo', latitude: 5.0333, longitude: 7.9167, population: 3902080, area_km2: 7081, flood_risk_level: 'critical', major_rivers: ['Cross River', 'Kwa Ibo River'], climate_zone: 'Tropical Rainforest' },
  { code: 'AN', name: 'Anambra', region: 'South East', capital: 'Awka', latitude: 6.2107, longitude: 7.0743, population: 4178020, area_km2: 4844, flood_risk_level: 'critical', major_rivers: ['Niger River', 'Anambra River'], climate_zone: 'Tropical Rainforest' },
  { code: 'BA', name: 'Bauchi', region: 'North East', capital: 'Bauchi', latitude: 10.3158, longitude: 9.8442, population: 4650390, area_km2: 45837, flood_risk_level: 'low', major_rivers: ['Gongola River', 'Komadugu Yobe'], climate_zone: 'Tropical Savanna' },
  { code: 'BY', name: 'Bayelsa', region: 'South South', capital: 'Yenagoa', latitude: 4.9167, longitude: 6.2667, population: 1733920, area_km2: 10773, flood_risk_level: 'critical', major_rivers: ['Niger River', 'Forcados River'], climate_zone: 'Tropical Rainforest' },
  { code: 'BE', name: 'Benue', region: 'North Central', capital: 'Makurdi', latitude: 7.7322, longitude: 8.5391, population: 4255170, area_km2: 34059, flood_risk_level: 'high', major_rivers: ['Benue River', 'Katsina Ala River'], climate_zone: 'Tropical Savanna' },
  { code: 'BO', name: 'Borno', region: 'North East', capital: 'Maiduguri', latitude: 11.8333, longitude: 13.1500, population: 4161680, area_km2: 70898, flood_risk_level: 'low', major_rivers: ['Komadugu Yobe', 'Ngadda River'], climate_zone: 'Semi-Arid' },
  { code: 'CR', name: 'Cross River', region: 'South South', capital: 'Calabar', latitude: 4.9500, longitude: 8.3167, population: 2768960, area_km2: 20156, flood_risk_level: 'high', major_rivers: ['Cross River', 'Calabar River'], climate_zone: 'Tropical Rainforest' },
  { code: 'DE', name: 'Delta', region: 'South South', capital: 'Asaba', latitude: 6.2000, longitude: 6.7333, population: 4113160, area_km2: 17698, flood_risk_level: 'critical', major_rivers: ['Niger River', 'Forcados River'], climate_zone: 'Tropical Rainforest' },
  { code: 'EB', name: 'Ebonyi', region: 'South East', capital: 'Abakaliki', latitude: 6.3333, longitude: 8.1000, population: 2160060, area_km2: 5670, flood_risk_level: 'high', major_rivers: ['Cross River', 'Ebonyi River'], climate_zone: 'Tropical Rainforest' },
  { code: 'ED', name: 'Edo', region: 'South South', capital: 'Benin City', latitude: 6.3333, longitude: 5.6167, population: 3233660, area_km2: 17802, flood_risk_level: 'high', major_rivers: ['Benin River', 'Ovia River'], climate_zone: 'Tropical Rainforest' },
  { code: 'EK', name: 'Ekiti', region: 'South West', capital: 'Ado-Ekiti', latitude: 7.6167, longitude: 5.2167, population: 2212120, area_km2: 6353, flood_risk_level: 'medium', major_rivers: ['Osun River', 'Ero River'], climate_zone: 'Tropical Rainforest' },
  { code: 'EN', name: 'Enugu', region: 'South East', capital: 'Enugu', latitude: 6.4500, longitude: 7.5000, population: 3236660, area_km2: 7161, flood_risk_level: 'high', major_rivers: ['Anambra River', 'Oji River'], climate_zone: 'Tropical Rainforest' },
  { code: 'FCT', name: 'Abuja', region: 'North Central', capital: 'Abuja', latitude: 9.0765, longitude: 7.3986, population: 3564120, area_km2: 1764, flood_risk_level: 'medium', major_rivers: ['Gurara River', 'Usuma River'], climate_zone: 'Tropical Savanna' },
  { code: 'GO', name: 'Gombe', region: 'North East', capital: 'Gombe', latitude: 10.2894, longitude: 11.1717, population: 2659500, area_km2: 18768, flood_risk_level: 'low', major_rivers: ['Gongola River', 'Hawal River'], climate_zone: 'Tropical Savanna' },
  { code: 'IM', name: 'Imo', region: 'South East', capital: 'Owerri', latitude: 5.4833, longitude: 7.0333, population: 4080000, area_km2: 5530, flood_risk_level: 'high', major_rivers: ['Imo River', 'Otamiri River'], climate_zone: 'Tropical Rainforest' },
  { code: 'JI', name: 'Jigawa', region: 'North West', capital: 'Dutse', latitude: 12.0000, longitude: 9.5000, population: 4598330, area_km2: 23154, flood_risk_level: 'low', major_rivers: ['Hadejia River', 'Kano River'], climate_zone: 'Semi-Arid' },
  { code: 'KD', name: 'Kaduna', region: 'North West', capital: 'Kaduna', latitude: 10.5200, longitude: 7.4383, population: 6104000, area_km2: 46053, flood_risk_level: 'medium', major_rivers: ['Kaduna River', 'Gurara River'], climate_zone: 'Tropical Savanna' },
  { code: 'KN', name: 'Kano', region: 'North West', capital: 'Kano', latitude: 12.0000, longitude: 8.5167, population: 9930000, area_km2: 20131, flood_risk_level: 'low', major_rivers: ['Kano River', 'Chalawa River'], climate_zone: 'Semi-Arid' },
  { code: 'KT', name: 'Katsina', region: 'North West', capital: 'Katsina', latitude: 12.9833, longitude: 7.6000, population: 5822000, area_km2: 24192, flood_risk_level: 'low', major_rivers: ['Sokoto River', 'Rima River'], climate_zone: 'Semi-Arid' },
  { code: 'KE', name: 'Kebbi', region: 'North West', capital: 'Birnin Kebbi', latitude: 12.4500, longitude: 4.2000, population: 3380000, area_km2: 36800, flood_risk_level: 'low', major_rivers: ['Sokoto River', 'Rima River'], climate_zone: 'Semi-Arid' },
  { code: 'KO', name: 'Kogi', region: 'North Central', capital: 'Lokoja', latitude: 7.8000, longitude: 6.7333, population: 3313000, area_km2: 29833, flood_risk_level: 'high', major_rivers: ['Niger River', 'Benue River'], climate_zone: 'Tropical Savanna' },
  { code: 'KW', name: 'Kwara', region: 'North Central', capital: 'Ilorin', latitude: 8.5000, longitude: 4.5500, population: 2362000, area_km2: 36825, flood_risk_level: 'medium', major_rivers: ['Niger River', 'Oyun River'], climate_zone: 'Tropical Savanna' },
  { code: 'LA', name: 'Lagos', region: 'South West', capital: 'Ikeja', latitude: 6.5244, longitude: 3.3792, population: 9113600, area_km2: 3345, flood_risk_level: 'critical', major_rivers: ['Lagos Lagoon', 'Ogun River'], climate_zone: 'Tropical Rainforest' },
  { code: 'NA', name: 'Nasarawa', region: 'North Central', capital: 'Lafia', latitude: 8.5000, longitude: 8.5000, population: 1869000, area_km2: 27117, flood_risk_level: 'medium', major_rivers: ['Benue River', 'Farin Ruwa'], climate_zone: 'Tropical Savanna' },
  { code: 'NI', name: 'Niger', region: 'North Central', capital: 'Minna', latitude: 9.6000, longitude: 6.5500, population: 3955000, area_km2: 76363, flood_risk_level: 'medium', major_rivers: ['Niger River', 'Kaduna River'], climate_zone: 'Tropical Savanna' },
  { code: 'OG', name: 'Ogun', region: 'South West', capital: 'Abeokuta', latitude: 7.1500, longitude: 3.3500, population: 3750000, area_km2: 16762, flood_risk_level: 'high', major_rivers: ['Ogun River', 'Yewa River'], climate_zone: 'Tropical Rainforest' },
  { code: 'ON', name: 'Ondo', region: 'South West', capital: 'Akure', latitude: 7.2500, longitude: 5.2000, population: 3466000, area_km2: 15500, flood_risk_level: 'high', major_rivers: ['Ondo River', 'Ose River'], climate_zone: 'Tropical Rainforest' },
  { code: 'OS', name: 'Osun', region: 'South West', capital: 'Oshogbo', latitude: 7.7667, longitude: 4.5667, population: 3417000, area_km2: 9251, flood_risk_level: 'medium', major_rivers: ['Osun River', 'Oba River'], climate_zone: 'Tropical Rainforest' },
  { code: 'OY', name: 'Oyo', region: 'South West', capital: 'Ibadan', latitude: 7.4000, longitude: 3.9000, population: 5582000, area_km2: 28454, flood_risk_level: 'medium', major_rivers: ['Ogun River', 'Oba River'], climate_zone: 'Tropical Rainforest' },
  { code: 'PL', name: 'Plateau', region: 'North Central', capital: 'Jos', latitude: 9.9167, longitude: 8.9000, population: 3200000, area_km2: 30913, flood_risk_level: 'low', major_rivers: ['Benue River', 'Kaduna River'], climate_zone: 'Tropical Savanna' },
  { code: 'RI', name: 'Rivers', region: 'South South', capital: 'Port Harcourt', latitude: 4.7500, longitude: 7.0000, population: 5195000, area_km2: 11077, flood_risk_level: 'critical', major_rivers: ['Niger River', 'Bonny River'], climate_zone: 'Tropical Rainforest' },
  { code: 'SO', name: 'Sokoto', region: 'North West', capital: 'Sokoto', latitude: 13.0667, longitude: 5.2333, population: 3700000, area_km2: 25973, flood_risk_level: 'low', major_rivers: ['Sokoto River', 'Rima River'], climate_zone: 'Semi-Arid' },
  { code: 'TA', name: 'Taraba', region: 'North East', capital: 'Jalingo', latitude: 8.9000, longitude: 11.3667, population: 2200000, area_km2: 54473, flood_risk_level: 'high', major_rivers: ['Benue River', 'Taraba River'], climate_zone: 'Tropical Savanna' },
  { code: 'YO', name: 'Yobe', region: 'North East', capital: 'Damaturu', latitude: 11.7500, longitude: 11.9667, population: 2300000, area_km2: 45502, flood_risk_level: 'low', major_rivers: ['Komadugu Yobe', 'Hadejia River'], climate_zone: 'Semi-Arid' },
  { code: 'ZA', name: 'Zamfara', region: 'North West', capital: 'Gusau', latitude: 12.1667, longitude: 6.6667, population: 3200000, area_km2: 39762, flood_risk_level: 'low', major_rivers: ['Sokoto River', 'Rima River'], climate_zone: 'Semi-Arid' }
];

async function seedNigeriaStates() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  
  if (!supabaseUrl || !supabaseKey) {
    console.error('Missing Supabase environment variables');
    process.exit(1);
  }

  const supabase = createClient(supabaseUrl, supabaseKey);

  console.log('Starting to seed Nigeria states...');

  try {
    // Clear existing data
    const { error: deleteError } = await supabase
      .from('nigeria_states')
      .delete()
      .neq('id', 0); // Delete all records

    if (deleteError) {
      console.error('Error clearing existing data:', deleteError);
    } else {
      console.log('Cleared existing Nigeria states data');
    }

    // Insert new data
    const { data, error } = await supabase
      .from('nigeria_states')
      .insert(nigeriaStates.map(state => ({
        ...state,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })));

    if (error) {
      console.error('Error inserting Nigeria states:', error);
      process.exit(1);
    }

    console.log(`Successfully seeded ${nigeriaStates.length} Nigeria states`);
    console.log('States seeded:', nigeriaStates.map(s => s.name).join(', '));

  } catch (error) {
    console.error('Unexpected error:', error);
    process.exit(1);
  }
}

// Run the seed function
seedNigeriaStates();
