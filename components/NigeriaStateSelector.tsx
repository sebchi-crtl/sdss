"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface NigeriaState {
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

interface NigeriaStateSelectorProps {
  onStateSelect?: (state: NigeriaState) => void;
  onCoordinatesUpdate?: (stateCode: string, lat: number, lon: number) => void;
  selectedState?: string;
}

export default function NigeriaStateSelector({ 
  onStateSelect, 
  onCoordinatesUpdate, 
  selectedState 
}: NigeriaStateSelectorProps) {
  const [states, setStates] = useState<NigeriaState[]>([]);
  const [selectedStateCode, setSelectedStateCode] = useState<string>(selectedState || "");
  const [editingCoordinates, setEditingCoordinates] = useState(false);
  const [tempLatitude, setTempLatitude] = useState<string>("");
  const [tempLongitude, setTempLongitude] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>("");
  const [viewMode, setViewMode] = useState<'selector' | 'list'>('list');
  const [editingState, setEditingState] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newState, setNewState] = useState({
    code: '',
    name: '',
    region: '',
    capital: '',
    latitude: '',
    longitude: '',
    population: '',
    area_km2: '',
    flood_risk_level: 'medium' as 'low' | 'medium' | 'high' | 'critical',
    major_rivers: '',
    climate_zone: ''
  });
  const [calculatingRisk, setCalculatingRisk] = useState(false);
  const [riskCalculationResults, setRiskCalculationResults] = useState<any[]>([]);

  // Load Nigeria states from API
  useEffect(() => {
    async function loadStates() {
      try {
        // First try to load from database
        const dbResponse = await fetch("/api/nigeria?endpoint=coordinates");
        let statesFromDb = [];
        
        if (dbResponse.ok) {
          const dbData = await dbResponse.json();
          if (dbData.success && dbData.data && Array.isArray(dbData.data)) {
            statesFromDb = dbData.data;
          }
        }

        // If we have states from database, use them
        if (statesFromDb.length > 0) {
          const statesArray = statesFromDb.map((state: any) => ({
            code: state.code,
            name: state.name,
            region: state.region,
            capital: state.capital || "Unknown",
            latitude: state.latitude || 0,
            longitude: state.longitude || 0,
            population: state.population || 0,
            area_km2: state.area_km2 || 0,
            flood_risk_level: state.flood_risk_level || "medium",
            major_rivers: state.major_rivers || [],
            climate_zone: state.climate_zone || "Unknown"
          }));
          
          setStates(statesArray);
          setLoading(false);
          return;
        }

        // Fallback to Python API if no database data
        const response = await fetch("/api/nigeria?endpoint=states");
        if (!response.ok) {
          throw new Error("Failed to load Nigeria states");
        }
        
        const data = await response.json();
        if (data.success && data.data.states) {
          // Convert the states object to array format
          const statesArray = Object.entries(data.data.states).map(([code, stateInfo]: [string, any]) => ({
            code,
            name: stateInfo.name,
            region: stateInfo.region,
            capital: stateInfo.capital || "Unknown",
            latitude: stateInfo.latitude || 0,
            longitude: stateInfo.longitude || 0,
            population: stateInfo.population || 0,
            area_km2: stateInfo.area_km2 || 0,
            flood_risk_level: stateInfo.flood_risk_level || "medium",
            major_rivers: stateInfo.major_rivers || [],
            climate_zone: stateInfo.climate_zone || "Unknown"
          }));
          
          setStates(statesArray);
        } else {
          // Fallback to hardcoded states if API fails
          setStates(getFallbackStates());
        }
      } catch (err) {
        console.error("Error loading states:", err);
        setError("Failed to load Nigeria states. Using fallback data.");
        setStates(getFallbackStates());
      } finally {
        setLoading(false);
      }
    }

    loadStates();
  }, []);

  // Fallback states data
  function getFallbackStates(): NigeriaState[] {
    return [
      {
        code: "LA",
        name: "Lagos",
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
        code: "FCT",
        name: "Abuja (FCT)",
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
        code: "RI",
        name: "Rivers",
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
      {
        code: "KN",
        name: "Kano",
        region: "North West",
        capital: "Kano",
        latitude: 12.0000,
        longitude: 8.5167,
        population: 9902000,
        area_km2: 20131,
        flood_risk_level: "low",
        major_rivers: ["Kano River", "Chalawa River"],
        climate_zone: "Semi-arid"
      }
    ];
  }

  const selectedStateData = states.find(state => state.code === selectedStateCode);

  const handleStateSelect = (stateCode: string) => {
    setSelectedStateCode(stateCode);
    const state = states.find(s => s.code === stateCode);
    if (state) {
      setTempLatitude(state.latitude.toString());
      setTempLongitude(state.longitude.toString());
      onStateSelect?.(state);
    }
  };

  const handleEditCoordinates = () => {
    setEditingCoordinates(true);
  };

  const handleSaveCoordinates = async () => {
    const lat = parseFloat(tempLatitude);
    const lon = parseFloat(tempLongitude);
    
    if (isNaN(lat) || isNaN(lon)) {
      setError("Please enter valid coordinates");
      return;
    }
    
    if (lat < -90 || lat > 90) {
      setError("Latitude must be between -90 and 90");
      return;
    }
    
    if (lon < -180 || lon > 180) {
      setError("Longitude must be between -180 and 180");
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Save coordinates to database
      const response = await fetch('/api/nigeria/coordinates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          state_code: selectedStateCode,
          latitude: lat,
          longitude: lon,
          name: selectedStateData?.name,
          region: selectedStateData?.region,
          capital: selectedStateData?.capital,
          population: selectedStateData?.population,
          area_km2: selectedStateData?.area_km2,
          flood_risk_level: selectedStateData?.flood_risk_level,
          major_rivers: selectedStateData?.major_rivers,
          climate_zone: selectedStateData?.climate_zone
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to save coordinates');
      }

      // Update the state in the local array
      setStates(prevStates => 
        prevStates.map(state => 
          state.code === selectedStateCode 
            ? { ...state, latitude: lat, longitude: lon }
            : state
        )
      );

      setEditingCoordinates(false);
      onCoordinatesUpdate?.(selectedStateCode, lat, lon);
      
      // Show success message
      console.log(`Coordinates saved successfully: ${result.message}`);
      
    } catch (err) {
      console.error('Error saving coordinates:', err);
      setError(err instanceof Error ? err.message : 'Failed to save coordinates');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelEdit = () => {
    if (selectedStateData) {
      setTempLatitude(selectedStateData.latitude.toString());
      setTempLongitude(selectedStateData.longitude.toString());
    }
    setEditingCoordinates(false);
    setError("");
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "critical": return "bg-red-500";
      case "high": return "bg-orange-500";
      case "medium": return "bg-yellow-500";
      case "low": return "bg-green-500";
      default: return "bg-gray-500";
    }
  };

  const handleAddState = async () => {
    try {
      setLoading(true);
      setError("");

      const response = await fetch('/api/nigeria/coordinates', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          state_code: newState.code,
          name: newState.name,
          region: newState.region,
          capital: newState.capital,
          latitude: parseFloat(newState.latitude),
          longitude: parseFloat(newState.longitude),
          population: parseInt(newState.population) || 0,
          area_km2: parseFloat(newState.area_km2) || 0,
          flood_risk_level: newState.flood_risk_level,
          major_rivers: newState.major_rivers.split(',').map(r => r.trim()).filter(r => r),
          climate_zone: newState.climate_zone
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to add state');
      }

      // Reload states
      const dbResponse = await fetch("/api/nigeria?endpoint=coordinates");
      if (dbResponse.ok) {
        const dbData = await dbResponse.json();
        if (dbData.success && dbData.data && Array.isArray(dbData.data)) {
          const statesArray = dbData.data.map((state: any) => ({
            code: state.code,
            name: state.name,
            region: state.region,
            capital: state.capital || "Unknown",
            latitude: state.latitude || 0,
            longitude: state.longitude || 0,
            population: state.population || 0,
            area_km2: state.area_km2 || 0,
            flood_risk_level: state.flood_risk_level || "medium",
            major_rivers: state.major_rivers || [],
            climate_zone: state.climate_zone || "Unknown"
          }));
          setStates(statesArray);
        }
      }

      // Reset form
      setNewState({
        code: '',
        name: '',
        region: '',
        capital: '',
        latitude: '',
        longitude: '',
        population: '',
        area_km2: '',
        flood_risk_level: 'medium',
        major_rivers: '',
        climate_zone: ''
      });
      setShowAddForm(false);
      
      console.log(`State added successfully: ${result.message}`);
      
    } catch (err) {
      console.error('Error adding state:', err);
      setError(err instanceof Error ? err.message : 'Failed to add state');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteState = async (stateCode: string) => {
    if (!confirm(`Are you sure you want to delete ${stateCode}?`)) {
      return;
    }

    try {
      setLoading(true);
      setError("");

      // Note: We'll need to add a DELETE endpoint to the API
      const response = await fetch(`/api/nigeria/coordinates?state_code=${stateCode}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || 'Failed to delete state');
      }

      // Remove from local state
      setStates(prevStates => prevStates.filter(state => state.code !== stateCode));
      
      console.log(`State ${stateCode} deleted successfully`);
      
    } catch (err) {
      console.error('Error deleting state:', err);
      setError(err instanceof Error ? err.message : 'Failed to delete state');
    } finally {
      setLoading(false);
    }
  };

  const handleCalculateRiskLevels = async (stateCode?: string) => {
    try {
      setCalculatingRisk(true);
      setError("");

      const response = await fetch('/api/nigeria/risk-calculation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          state_code: stateCode,
          force_update: true,
          use_ml_prediction: true
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to calculate risk levels');
      }

      // Ensure result.data is an array
      const riskData = Array.isArray(result.data) ? result.data : [];
      setRiskCalculationResults(riskData);
      
      // Reload states to get updated risk levels
      const dbResponse = await fetch("/api/nigeria?endpoint=coordinates");
      if (dbResponse.ok) {
        const dbData = await dbResponse.json();
        if (dbData.success && dbData.data && Array.isArray(dbData.data)) {
          const statesArray = dbData.data.map((state: any) => ({
            code: state.code,
            name: state.name,
            region: state.region,
            capital: state.capital || "Unknown",
            latitude: state.latitude || 0,
            longitude: state.longitude || 0,
            population: state.population || 0,
            area_km2: state.area_km2 || 0,
            flood_risk_level: state.flood_risk_level || "medium",
            major_rivers: state.major_rivers || [],
            climate_zone: state.climate_zone || "Unknown"
          }));
          setStates(statesArray);
        }
      }

      console.log(`Risk levels calculated successfully for ${result.count} states`);
      
    } catch (err) {
      console.error('Error calculating risk levels:', err);
      setError(err instanceof Error ? err.message : 'Failed to calculate risk levels');
    } finally {
      setCalculatingRisk(false);
    }
  };

  const handleGetRiskAnalysis = async (stateCode?: string) => {
    try {
      setCalculatingRisk(true);
      setError("");

      const url = stateCode 
        ? `/api/nigeria/risk-calculation?state_code=${stateCode}&include_ml=true`
        : `/api/nigeria/risk-calculation?include_ml=true`;

      const response = await fetch(url);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to get risk analysis');
      }

      // Ensure result.data is an array
      const riskData = Array.isArray(result.data) ? result.data : [];
      setRiskCalculationResults(riskData);
      console.log(`Risk analysis retrieved for ${result.count || 0} states`);
      
    } catch (err) {
      console.error('Error getting risk analysis:', err);
      setError(err instanceof Error ? err.message : 'Failed to get risk analysis');
    } finally {
      setCalculatingRisk(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Nigeria State Selector</CardTitle>
          <CardDescription>Loading Nigeria states...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with View Toggle */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>Nigeria States Management</CardTitle>
              <CardDescription>
                {viewMode === 'list' ? 'View and manage all Nigeria states' : 'Select a state to view details'}
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                List View
              </Button>
              <Button
                variant={viewMode === 'selector' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('selector')}
              >
                Selector View
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {error && (
        <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      {viewMode === 'list' ? (
        /* List View */
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle>All Nigeria States ({states.length})</CardTitle>
              <div className="flex gap-2">
                <Button 
                  onClick={() => handleCalculateRiskLevels()} 
                  size="sm" 
                  variant="outline"
                  disabled={calculatingRisk}
                >
                  {calculatingRisk ? 'Calculating...' : 'Calculate Risk Levels'}
                </Button>
                <Button 
                  onClick={() => handleGetRiskAnalysis()} 
                  size="sm" 
                  variant="outline"
                  disabled={calculatingRisk}
                >
                  Risk Analysis
                </Button>
                <Button onClick={() => setShowAddForm(true)} size="sm">
                  Add New State
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse border border-gray-300">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="border border-gray-300 p-2 text-left">Code</th>
                    <th className="border border-gray-300 p-2 text-left">Name</th>
                    <th className="border border-gray-300 p-2 text-left">Region</th>
                    <th className="border border-gray-300 p-2 text-left">Capital</th>
                    <th className="border border-gray-300 p-2 text-left">Coordinates</th>
                    <th className="border border-gray-300 p-2 text-left">Population</th>
                    <th className="border border-gray-300 p-2 text-left">Risk Level</th>
                    <th className="border border-gray-300 p-2 text-left">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {states.map((state) => (
                    <tr key={state.code} className="hover:bg-gray-50">
                      <td className="border border-gray-300 p-2 font-mono text-sm">{state.code}</td>
                      <td className="border border-gray-300 p-2 font-medium">{state.name}</td>
                      <td className="border border-gray-300 p-2">{state.region}</td>
                      <td className="border border-gray-300 p-2">{state.capital}</td>
                      <td className="border border-gray-300 p-2 text-sm">
                        {state.latitude}, {state.longitude}
                      </td>
                      <td className="border border-gray-300 p-2 text-sm">
                        {state.population.toLocaleString()}
                      </td>
                      <td className="border border-gray-300 p-2">
                        <Badge className={`${getRiskColor(state.flood_risk_level)} text-white text-xs`}>
                          {state.flood_risk_level.toUpperCase()}
                        </Badge>
                      </td>
                      <td className="border border-gray-300 p-2">
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedStateCode(state.code);
                              setViewMode('selector');
                            }}
                          >
                            View
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              navigator.clipboard.writeText(`${state.latitude}, ${state.longitude}`);
                            }}
                          >
                            Copy
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const url = `https://www.google.com/maps?q=${state.latitude},${state.longitude}`;
                              window.open(url, '_blank');
                            }}
                          >
                            Map
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteState(state.code)}
                            className="text-red-600 hover:text-red-700"
                          >
                            Delete
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Selector View */
        <Card>
          <CardHeader>
            <CardTitle>State Details</CardTitle>
            <CardDescription>
              Select a Nigeria state to view and edit its details
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <Label htmlFor="state-select">Select State</Label>
                <select
                  id="state-select"
                  value={selectedStateCode}
                  onChange={(e) => handleStateSelect(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Choose a state...</option>
                  {states.map((state) => (
                    <option key={state.code} value={state.code}>
                      {state.name} ({state.code}) - {state.region}
                    </option>
                  ))}
                </select>
              </div>

              {selectedStateData && (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>State Information</Label>
                      <div className="p-3 bg-gray-50 rounded-md space-y-2">
                        <div><strong>Name:</strong> {selectedStateData.name}</div>
                        <div><strong>Code:</strong> {selectedStateData.code}</div>
                        <div><strong>Region:</strong> {selectedStateData.region}</div>
                        <div><strong>Capital:</strong> {selectedStateData.capital}</div>
                        <div><strong>Population:</strong> {selectedStateData.population.toLocaleString()}</div>
                        <div><strong>Area:</strong> {selectedStateData.area_km2.toLocaleString()} km²</div>
                        <div className="flex items-center gap-2">
                          <strong>Flood Risk:</strong>
                          <Badge className={`${getRiskColor(selectedStateData.flood_risk_level)} text-white`}>
                            {selectedStateData.flood_risk_level.toUpperCase()}
                          </Badge>
                        </div>
                      </div>
                    </div>

                    <div>
                      <Label>Coordinates</Label>
                      <div className="p-3 bg-gray-50 rounded-md space-y-3">
                        {editingCoordinates ? (
                          <div className="space-y-3">
                            <div>
                              <Label htmlFor="latitude">Latitude</Label>
                              <Input
                                id="latitude"
                                type="number"
                                step="any"
                                value={tempLatitude}
                                onChange={(e) => setTempLatitude(e.target.value)}
                                placeholder="Enter latitude"
                              />
                            </div>
                            <div>
                              <Label htmlFor="longitude">Longitude</Label>
                              <Input
                                id="longitude"
                                type="number"
                                step="any"
                                value={tempLongitude}
                                onChange={(e) => setTempLongitude(e.target.value)}
                                placeholder="Enter longitude"
                              />
                            </div>
                            <div className="flex gap-2">
                              <Button onClick={handleSaveCoordinates} size="sm">
                                Save
                              </Button>
                              <Button onClick={handleCancelEdit} variant="outline" size="sm">
                                Cancel
                              </Button>
                            </div>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <div><strong>Latitude:</strong> {selectedStateData.latitude}</div>
                            <div><strong>Longitude:</strong> {selectedStateData.longitude}</div>
                            <Button onClick={handleEditCoordinates} size="sm" variant="outline">
                              Edit Coordinates
                            </Button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {selectedStateData.major_rivers.length > 0 && (
                    <div>
                      <Label>Major Rivers</Label>
                      <div className="p-3 bg-blue-50 rounded-md">
                        <div className="flex flex-wrap gap-2">
                          {selectedStateData.major_rivers.map((river, index) => (
                            <Badge key={index} variant="secondary">
                              {river}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="flex gap-2">
                    <Button 
                      onClick={() => {
                        if (selectedStateData) {
                          navigator.clipboard.writeText(`${selectedStateData.latitude}, ${selectedStateData.longitude}`);
                        }
                      }}
                      variant="outline"
                      size="sm"
                    >
                      Copy Coordinates
                    </Button>
                    <Button 
                      onClick={() => {
                        if (selectedStateData) {
                          const url = `https://www.google.com/maps?q=${selectedStateData.latitude},${selectedStateData.longitude}`;
                          window.open(url, '_blank');
                        }
                      }}
                      variant="outline"
                      size="sm"
                    >
                      View on Map
                    </Button>
                    <Button 
                      onClick={() => handleCalculateRiskLevels(selectedStateData?.code)}
                      variant="outline"
                      size="sm"
                      disabled={calculatingRisk}
                    >
                      {calculatingRisk ? 'Calculating...' : 'Calculate Risk'}
                    </Button>
                    <Button 
                      onClick={() => handleGetRiskAnalysis(selectedStateData?.code)}
                      variant="outline"
                      size="sm"
                      disabled={calculatingRisk}
                    >
                      Risk Analysis
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Risk Analysis Results */}
      {riskCalculationResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Risk Analysis Results</CardTitle>
            <CardDescription>
              Current flood risk calculations based on ML predictions and real-time data
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {riskCalculationResults.map((result, index) => (
                <div key={index} className="p-4 border rounded-lg">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-semibold">{result.state_name} ({result.state_code})</h4>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-sm text-gray-600">Current:</span>
                        <Badge className={`${getRiskColor(result.current_risk_level || 'medium')} text-white text-xs`}>
                          {(result.current_risk_level || 'medium').toUpperCase()}
                        </Badge>
                        <span className="text-sm text-gray-600">Calculated:</span>
                        <Badge className={`${getRiskColor(result.calculated_risk_level || 'medium')} text-white text-xs`}>
                          {(result.calculated_risk_level || 'medium').toUpperCase()}
                        </Badge>
                        <span className="text-sm text-gray-600">Score: {result.risk_score || 0}</span>
                        <span className="text-sm text-gray-600">Confidence: {result.confidence || 0}</span>
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleCalculateRiskLevels(result.state_code)}
                      disabled={calculatingRisk}
                    >
                      Recalculate
                    </Button>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-3">
                    <div className="text-sm">
                      <div className="font-medium">Weather Risk</div>
                      <div className="text-gray-600">{result.factors?.weather_risk || 0}</div>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">Historical Risk</div>
                      <div className="text-gray-600">{result.factors?.historical_risk || 0}</div>
                    </div>
                    <div className="text-sm">
                      <div className="font-medium">Geographic Risk</div>
                      <div className="text-gray-600">{result.factors?.geographic_risk || 0}</div>
                    </div>
                    {result.factors?.ml_prediction_risk && (
                      <div className="text-sm">
                        <div className="font-medium">ML Prediction</div>
                        <div className="text-gray-600">{result.factors.ml_prediction_risk}</div>
                      </div>
                    )}
                  </div>

                  {result.recommendations && Array.isArray(result.recommendations) && result.recommendations.length > 0 && (
                    <div className="mt-3">
                      <div className="font-medium text-sm mb-1">Recommendations:</div>
                      <ul className="text-sm text-gray-600 space-y-1">
                        {result.recommendations.slice(0, 3).map((rec: string, i: number) => (
                          <li key={i}>• {rec || 'No recommendation available'}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Add New State Modal */}
      {showAddForm && (
        <Card>
          <CardHeader>
            <CardTitle>Add New State</CardTitle>
            <CardDescription>Enter the details for the new Nigeria state</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="new-code">State Code</Label>
                <Input
                  id="new-code"
                  value={newState.code}
                  onChange={(e) => setNewState({...newState, code: e.target.value.toUpperCase()})}
                  placeholder="e.g., AB"
                  maxLength={3}
                />
              </div>
              <div>
                <Label htmlFor="new-name">State Name</Label>
                <Input
                  id="new-name"
                  value={newState.name}
                  onChange={(e) => setNewState({...newState, name: e.target.value})}
                  placeholder="e.g., Abia"
                />
              </div>
              <div>
                <Label htmlFor="new-region">Region</Label>
                <select
                  id="new-region"
                  value={newState.region}
                  onChange={(e) => setNewState({...newState, region: e.target.value})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="">Select region...</option>
                  <option value="North Central">North Central</option>
                  <option value="North East">North East</option>
                  <option value="North West">North West</option>
                  <option value="South East">South East</option>
                  <option value="South South">South South</option>
                  <option value="South West">South West</option>
                </select>
              </div>
              <div>
                <Label htmlFor="new-capital">Capital</Label>
                <Input
                  id="new-capital"
                  value={newState.capital}
                  onChange={(e) => setNewState({...newState, capital: e.target.value})}
                  placeholder="e.g., Umuahia"
                />
              </div>
              <div>
                <Label htmlFor="new-latitude">Latitude</Label>
                <Input
                  id="new-latitude"
                  type="number"
                  step="any"
                  value={newState.latitude}
                  onChange={(e) => setNewState({...newState, latitude: e.target.value})}
                  placeholder="e.g., 5.5333"
                />
              </div>
              <div>
                <Label htmlFor="new-longitude">Longitude</Label>
                <Input
                  id="new-longitude"
                  type="number"
                  step="any"
                  value={newState.longitude}
                  onChange={(e) => setNewState({...newState, longitude: e.target.value})}
                  placeholder="e.g., 7.4833"
                />
              </div>
              <div>
                <Label htmlFor="new-population">Population</Label>
                <Input
                  id="new-population"
                  type="number"
                  value={newState.population}
                  onChange={(e) => setNewState({...newState, population: e.target.value})}
                  placeholder="e.g., 2845380"
                />
              </div>
              <div>
                <Label htmlFor="new-area">Area (km²)</Label>
                <Input
                  id="new-area"
                  type="number"
                  step="any"
                  value={newState.area_km2}
                  onChange={(e) => setNewState({...newState, area_km2: e.target.value})}
                  placeholder="e.g., 6320"
                />
              </div>
              <div>
                <Label htmlFor="new-risk">Flood Risk Level</Label>
                <select
                  id="new-risk"
                  value={newState.flood_risk_level}
                  onChange={(e) => setNewState({...newState, flood_risk_level: e.target.value as any})}
                  className="w-full p-2 border border-gray-300 rounded-md"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div>
                <Label htmlFor="new-rivers">Major Rivers (comma-separated)</Label>
                <Input
                  id="new-rivers"
                  value={newState.major_rivers}
                  onChange={(e) => setNewState({...newState, major_rivers: e.target.value})}
                  placeholder="e.g., Imo River, Abia River"
                />
              </div>
              <div className="md:col-span-2">
                <Label htmlFor="new-climate">Climate Zone</Label>
                <Input
                  id="new-climate"
                  value={newState.climate_zone}
                  onChange={(e) => setNewState({...newState, climate_zone: e.target.value})}
                  placeholder="e.g., Tropical Rainforest"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={handleAddState} disabled={loading}>
                {loading ? 'Adding...' : 'Add State'}
              </Button>
              <Button onClick={() => setShowAddForm(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
