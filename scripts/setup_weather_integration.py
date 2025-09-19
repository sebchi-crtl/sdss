#!/usr/bin/env python3
"""
Setup script for weather data integration
Configures environment variables and tests the integration
"""
import os
import sys
import subprocess
from pathlib import Path

def check_environment():
    """Check if required environment variables are set"""
    print("🔍 Checking environment configuration...")
    
    required_vars = [
        'NEXT_PUBLIC_SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY'
    ]
    
    missing_vars = []
    for var in required_vars:
        if not os.getenv(var):
            missing_vars.append(var)
    
    if missing_vars:
        print("❌ Missing required environment variables:")
        for var in missing_vars:
            print(f"   - {var}")
        print("\nPlease set these variables in your .env file or environment")
        return False
    else:
        print("✅ All required environment variables are set")
        return True

def install_dependencies():
    """Install required Python dependencies"""
    print("📦 Installing Python dependencies...")
    
    try:
        subprocess.run([sys.executable, "-m", "pip", "install", "-r", "requirements.txt"], 
                      check=True, capture_output=True, text=True)
        print("✅ Dependencies installed successfully")
        return True
    except subprocess.CalledProcessError as e:
        print(f"❌ Failed to install dependencies: {e}")
        print(f"Error output: {e.stderr}")
        return False

def test_weather_service():
    """Test the weather service integration"""
    print("🌤️ Testing weather service integration...")
    
    try:
        # Import the weather service
        sys.path.append(str(Path(__file__).parent.parent))
        from lib.weather_service import weather_ingestion
        
        # Test with Berlin coordinates
        latitude, longitude = 52.52, 13.41
        
        print(f"  - Testing weather data fetch for {latitude}, {longitude}...")
        weather_data = weather_ingestion.ingest_current_weather(latitude, longitude)
        
        print(f"  ✅ Weather data fetched successfully:")
        print(f"     Temperature: {weather_data.temperature}°C")
        print(f"     Humidity: {weather_data.humidity}%")
        print(f"     Pressure: {weather_data.pressure} hPa")
        print(f"     Wind Speed: {weather_data.wind_speed} m/s")
        print(f"     Precipitation: {weather_data.precipitation} mm")
        
        return True
        
    except Exception as e:
        print(f"❌ Weather service test failed: {e}")
        return False

def test_ml_model():
    """Test the ML model with real data"""
    print("🤖 Testing ML model integration...")
    
    try:
        sys.path.append(str(Path(__file__).parent.parent))
        from ml_model import flood_model
        
        # Test model training with real data
        print("  - Testing model training with real weather data...")
        results = flood_model.train_models(
            use_real_data=True,
            latitude=52.52,
            longitude=13.41,
            days_back=7
        )
        
        print(f"  ✅ Model training successful:")
        print(f"     R² Score: {results['r2']:.4f}")
        print(f"     MSE: {results['mse']:.4f}")
        print(f"     Samples: {results['n_samples']}")
        
        return True
        
    except Exception as e:
        print(f"❌ ML model test failed: {e}")
        return False

def create_cron_setup():
    """Create setup instructions for cron job"""
    print("⏰ Setting up automated data collection...")
    
    script_path = Path(__file__).parent / "weather_cron.py"
    cron_script = f"""#!/bin/bash
# Weather Data Collection Cron Job
# Add this to your crontab to run every hour:
# 0 * * * * cd {Path(__file__).parent.parent} && python {script_path} >> weather_cron.log 2>&1

cd {Path(__file__).parent.parent}
python {script_path}
"""
    
    cron_setup_file = Path(__file__).parent / "setup_cron.sh"
    with open(cron_setup_file, 'w') as f:
        f.write(cron_script)
    
    # Make it executable
    os.chmod(cron_setup_file, 0o755)
    
    print(f"✅ Cron setup script created: {cron_setup_file}")
    print("   To set up automated data collection, run:")
    print(f"   crontab -e")
    print("   Then add this line:")
    print(f"   0 * * * * cd {Path(__file__).parent.parent} && python {script_path} >> weather_cron.log 2>&1")

def main():
    """Main setup function"""
    print("🌊 SDSS Weather Integration Setup")
    print("=" * 50)
    
    success = True
    
    # Check environment
    if not check_environment():
        success = False
    
    # Install dependencies
    if not install_dependencies():
        success = False
    
    # Test weather service
    if not test_weather_service():
        success = False
    
    # Test ML model
    if not test_ml_model():
        success = False
    
    # Create cron setup
    create_cron_setup()
    
    print("\n" + "=" * 50)
    if success:
        print("🎉 Weather integration setup completed successfully!")
        print("\nNext steps:")
        print("1. Set up automated data collection using the cron script")
        print("2. Monitor the weather_cron.log file for data collection status")
        print("3. Use the API endpoints to ingest weather data and train models")
    else:
        print("❌ Setup completed with errors. Please check the issues above.")
        sys.exit(1)

if __name__ == "__main__":
    main()
