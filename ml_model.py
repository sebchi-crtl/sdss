"""
Enhanced Flood Prediction ML Model with Real Data Processing
"""
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor, GradientBoostingRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.model_selection import train_test_split
from sklearn.metrics import mean_squared_error, r2_score
import joblib
import os
from datetime import datetime, timedelta
import json
from typing import Dict, List, Tuple, Any

class FloodPredictionModel:
    def __init__(self):
        self.rainfall_model = None
        self.river_level_model = None
        self.flood_risk_model = None
        self.scaler = StandardScaler()
        self.is_trained = False
        self.model_path = "models/"
        
        # Create models directory
        os.makedirs(self.model_path, exist_ok=True)
        
        # Load or create models
        self.load_models()
    
    def generate_synthetic_dataset(self, n_samples: int = 10000) -> pd.DataFrame:
        """Generate synthetic but realistic flood prediction dataset"""
        np.random.seed(42)
        
        data = []
        for i in range(n_samples):
            # Base environmental factors
            temperature = np.random.normal(25, 8)  # 25°C ± 8°C
            humidity = np.random.normal(65, 20)    # 65% ± 20%
            pressure = np.random.normal(1013, 20)  # 1013 hPa ± 20
            
            # Seasonal patterns
            day_of_year = np.random.randint(1, 365)
            seasonal_factor = 1 + 0.3 * np.sin(2 * np.pi * day_of_year / 365)
            
            # Historical rainfall (last 7 days)
            rainfall_7d = np.random.exponential(2) * seasonal_factor
            rainfall_24h = np.random.exponential(1) * seasonal_factor
            
            # River level (depends on rainfall and other factors)
            base_river_level = 2.0
            river_level = base_river_level + (rainfall_7d * 0.1) + np.random.normal(0, 0.3)
            
            # Soil moisture (depends on rainfall and temperature)
            soil_moisture = min(1.0, max(0.0, 0.3 + (rainfall_7d * 0.05) - (temperature - 25) * 0.01))
            
            # Wind speed and direction
            wind_speed = np.random.exponential(3)
            wind_direction = np.random.uniform(0, 360)
            
            # Calculate flood risk based on multiple factors
            risk_factors = {
                'rainfall_factor': min(1.0, rainfall_24h / 50),  # Normalize to 0-1
                'river_factor': min(1.0, max(0, river_level - 2) / 3),  # River above 2m
                'soil_factor': soil_moisture,
                'temperature_factor': max(0, (temperature - 30) / 10),  # High temp = more evaporation
                'humidity_factor': humidity / 100,
                'pressure_factor': abs(pressure - 1013) / 50,  # Pressure anomalies
            }
            
            # Weighted flood risk calculation
            flood_risk = (
                0.4 * risk_factors['rainfall_factor'] +
                0.3 * risk_factors['river_factor'] +
                0.15 * risk_factors['soil_factor'] +
                0.1 * risk_factors['temperature_factor'] +
                0.05 * risk_factors['humidity_factor']
            )
            
            # Add some noise and ensure 0-1 range
            flood_risk = min(1.0, max(0.0, flood_risk + np.random.normal(0, 0.1)))
            
            # Determine flood level
            if flood_risk > 0.8:
                flood_level = "EMERGENCY"
            elif flood_risk > 0.6:
                flood_level = "WARNING"
            elif flood_risk > 0.4:
                flood_level = "WATCH"
            else:
                flood_level = "INFO"
            
            data.append({
                'temperature': temperature,
                'humidity': humidity,
                'pressure': pressure,
                'rainfall_24h': rainfall_24h,
                'rainfall_7d': rainfall_7d,
                'river_level': river_level,
                'soil_moisture': soil_moisture,
                'wind_speed': wind_speed,
                'wind_direction': wind_direction,
                'day_of_year': day_of_year,
                'flood_risk': flood_risk,
                'flood_level': flood_level,
                'timestamp': datetime.now() - timedelta(days=np.random.randint(0, 365))
            })
        
        return pd.DataFrame(data)
    
    def prepare_features(self, df: pd.DataFrame) -> Tuple[np.ndarray, np.ndarray]:
        """Prepare features for training"""
        feature_columns = [
            'temperature', 'humidity', 'pressure', 'rainfall_24h', 'rainfall_7d',
            'river_level', 'soil_moisture', 'wind_speed', 'wind_direction', 'day_of_year'
        ]
        
        X = df[feature_columns].values
        y = df['flood_risk'].values
        
        return X, y
    
    def train_models(self, df: pd.DataFrame = None):
        """Train the flood prediction models"""
        if df is None:
            print("Generating synthetic dataset...")
            df = self.generate_synthetic_dataset()
        
        print(f"Training with {len(df)} samples...")
        
        # Prepare features
        X, y = self.prepare_features(df)
        
        # Split data
        X_train, X_test, y_train, y_test = train_test_split(
            X, y, test_size=0.2, random_state=42
        )
        
        # Scale features
        X_train_scaled = self.scaler.fit_transform(X_train)
        X_test_scaled = self.scaler.transform(X_test)
        
        # Train flood risk model
        print("Training flood risk model...")
        self.flood_risk_model = GradientBoostingRegressor(
            n_estimators=100,
            learning_rate=0.1,
            max_depth=6,
            random_state=42
        )
        self.flood_risk_model.fit(X_train_scaled, y_train)
        
        # Evaluate model
        y_pred = self.flood_risk_model.predict(X_test_scaled)
        mse = mean_squared_error(y_test, y_pred)
        r2 = r2_score(y_test, y_pred)
        
        print(f"Model Performance:")
        print(f"  MSE: {mse:.4f}")
        print(f"  R²: {r2:.4f}")
        
        self.is_trained = True
        
        # Save models
        self.save_models()
        
        return {
            'mse': mse,
            'r2': r2,
            'n_samples': len(df),
            'feature_importance': dict(zip([
                'temperature', 'humidity', 'pressure', 'rainfall_24h', 'rainfall_7d',
                'river_level', 'soil_moisture', 'wind_speed', 'wind_direction', 'day_of_year'
            ], self.flood_risk_model.feature_importances_))
        }
    
    def predict_flood_risk(self, conditions: Dict[str, Any]) -> Dict[str, Any]:
        """Predict flood risk for given conditions"""
        if not self.is_trained:
            # Fallback to simple calculation if model not trained
            return self._simple_flood_risk(conditions)
        
        # Prepare input features
        features = np.array([[
            conditions.get('temperature', 25),
            conditions.get('humidity', 65),
            conditions.get('pressure', 1013),
            conditions.get('rainfall_24h', 0),
            conditions.get('rainfall_7d', 0),
            conditions.get('river_level', 2.0),
            conditions.get('soil_moisture', 0.5),
            conditions.get('wind_speed', 3),
            conditions.get('wind_direction', 180),
            datetime.now().timetuple().tm_yday
        ]])
        
        # Scale features
        features_scaled = self.scaler.transform(features)
        
        # Predict flood risk
        flood_risk = self.flood_risk_model.predict(features_scaled)[0]
        flood_risk = max(0.0, min(1.0, flood_risk))  # Ensure 0-1 range
        
        # Calculate confidence based on feature completeness
        confidence = 0.8  # Base confidence
        missing_features = sum(1 for v in conditions.values() if v is None)
        confidence -= missing_features * 0.1
        confidence = max(0.3, confidence)
        
        # Determine risk level
        if flood_risk > 0.8:
            level = "EMERGENCY"
        elif flood_risk > 0.6:
            level = "WARNING"
        elif flood_risk > 0.4:
            level = "WATCH"
        else:
            level = "INFO"
        
        # Generate recommendations
        recommendations = self._generate_recommendations(flood_risk, conditions)
        
        return {
            'flood_risk': flood_risk,
            'confidence': confidence,
            'level': level,
            'recommendations': recommendations,
            'factors': {
                'rainfall_24h': conditions.get('rainfall_24h', 0),
                'river_level': conditions.get('river_level', 2.0),
                'soil_moisture': conditions.get('soil_moisture', 0.5),
                'temperature': conditions.get('temperature', 25),
                'humidity': conditions.get('humidity', 65)
            }
        }
    
    def _simple_flood_risk(self, conditions: Dict[str, Any]) -> Dict[str, Any]:
        """Simple flood risk calculation as fallback"""
        rainfall_24h = conditions.get('rainfall_24h', 0)
        river_level = conditions.get('river_level', 2.0)
        soil_moisture = conditions.get('soil_moisture', 0.5)
        temperature = conditions.get('temperature', 25)
        
        # Simple weighted calculation
        risk = (
            0.4 * min(1.0, rainfall_24h / 50) +
            0.3 * min(1.0, max(0, river_level - 2) / 3) +
            0.2 * soil_moisture +
            0.1 * max(0, (temperature - 25) / 10)
        )
        
        risk = max(0.0, min(1.0, risk))
        
        if risk > 0.8:
            level = "EMERGENCY"
        elif risk > 0.6:
            level = "WARNING"
        elif risk > 0.4:
            level = "WATCH"
        else:
            level = "INFO"
        
        return {
            'flood_risk': risk,
            'confidence': 0.6,
            'level': level,
            'recommendations': self._generate_recommendations(risk, conditions),
            'factors': conditions
        }
    
    def _generate_recommendations(self, risk: float, conditions: Dict[str, Any]) -> List[str]:
        """Generate recommendations based on risk level and conditions"""
        recommendations = []
        
        if risk > 0.8:
            recommendations.append("EMERGENCY: Evacuate low-lying areas immediately")
            recommendations.append("Activate emergency response protocols")
        elif risk > 0.6:
            recommendations.append("WARNING: Prepare for potential flooding")
            recommendations.append("Monitor river levels closely")
        elif risk > 0.4:
            recommendations.append("WATCH: Monitor conditions closely")
            recommendations.append("Prepare emergency supplies")
        else:
            recommendations.append("INFO: Normal conditions expected")
        
        # Specific recommendations based on conditions
        if conditions.get('rainfall_24h', 0) > 30:
            recommendations.append("High rainfall detected - monitor river levels")
        
        if conditions.get('river_level', 0) > 3:
            recommendations.append("River levels elevated - check flood defenses")
        
        if conditions.get('soil_moisture', 0) > 0.8:
            recommendations.append("High soil moisture - increased runoff risk")
        
        return recommendations
    
    def save_models(self):
        """Save trained models to disk"""
        if self.flood_risk_model:
            joblib.dump(self.flood_risk_model, f"{self.model_path}/flood_risk_model.pkl")
        if hasattr(self, 'scaler'):
            joblib.dump(self.scaler, f"{self.model_path}/scaler.pkl")
        
        # Save model metadata
        metadata = {
            'trained_at': datetime.now().isoformat(),
            'is_trained': self.is_trained,
            'model_type': 'GradientBoostingRegressor'
        }
        
        with open(f"{self.model_path}/metadata.json", 'w') as f:
            json.dump(metadata, f, indent=2)
    
    def load_models(self):
        """Load trained models from disk"""
        try:
            if os.path.exists(f"{self.model_path}/flood_risk_model.pkl"):
                self.flood_risk_model = joblib.load(f"{self.model_path}/flood_risk_model.pkl")
                print("Loaded trained flood risk model")
            
            if os.path.exists(f"{self.model_path}/scaler.pkl"):
                self.scaler = joblib.load(f"{self.model_path}/scaler.pkl")
                print("Loaded feature scaler")
            
            if os.path.exists(f"{self.model_path}/metadata.json"):
                with open(f"{self.model_path}/metadata.json", 'r') as f:
                    metadata = json.load(f)
                    self.is_trained = metadata.get('is_trained', False)
                    print(f"Model trained at: {metadata.get('trained_at', 'Unknown')}")
            
        except Exception as e:
            print(f"Error loading models: {e}")
            self.is_trained = False

# Global model instance
flood_model = FloodPredictionModel()

# Train model if not already trained
if not flood_model.is_trained:
    print("Training flood prediction model...")
    training_results = flood_model.train_models()
    print("Model training completed!")
    print(f"Training results: {training_results}")
else:
    print("Using pre-trained flood prediction model")
