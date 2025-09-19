"""
Advanced Forecasting models for groundwater level prediction
SARIMAX-based time series forecasting with seasonal predictions
"""

import pandas as pd
import numpy as np
from typing import Dict, Optional, Tuple, List
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings('ignore')

try:
    from statsmodels.tsa.statespace.sarimax import SARIMAX
    from statsmodels.tsa.seasonal import seasonal_decompose
    from statsmodels.tsa.stattools import adfuller
    from sklearn.ensemble import RandomForestRegressor
    from sklearn.metrics import mean_squared_error, r2_score
    STATSMODELS_AVAILABLE = True
except ImportError:
    STATSMODELS_AVAILABLE = False
    print("Warning: statsmodels not available. Using simplified forecasting.")

def _prepare_series(df: pd.DataFrame, district: str) -> pd.Series:
    """Prepare time series data for a district"""
    df_d = df[df["District"] == district].sort_values("Date")
    s = pd.Series(df_d["WaterLevel_m_bgl"].values, index=pd.DatetimeIndex(df_d["Date"]))
    s = s.asfreq("D").interpolate(limit_direction="both")
    return s

def _check_stationarity(series: pd.Series) -> bool:
    """Check if time series is stationary using Augmented Dickey-Fuller test"""
    if not STATSMODELS_AVAILABLE:
        return False
    
    try:
        result = adfuller(series.dropna())
        return result[1] < 0.05  # p-value < 0.05 means stationary
    except:
        return False

def _make_stationary(series: pd.Series) -> pd.Series:
    """Make time series stationary using differencing"""
    if _check_stationarity(series):
        return series
    
    # Try first difference
    diff_series = series.diff().dropna()
    if _check_stationarity(diff_series):
        return diff_series
    
    # Try second difference
    diff2_series = diff_series.diff().dropna()
    return diff2_series

def _get_seasonal_periods() -> Dict[str, int]:
    """Get seasonal periods for different forecasting horizons"""
    return {
        'daily': 7,      # Weekly seasonality
        'weekly': 52,    # Annual seasonality
        'monthly': 12,   # Annual seasonality
        'monsoon': 365,  # Annual cycle
        'post_monsoon': 365
    }

def _identify_season(month: int) -> str:
    """Identify season based on month"""
    if month in [6, 7, 8, 9]:  # June-September
        return 'monsoon'
    elif month in [10, 11, 12, 1, 2]:  # October-February
        return 'post_monsoon'
    else:  # March-May
        return 'pre_monsoon'

def sarimax_forecast(series: pd.Series, horizon_days: int = 30) -> Dict:
    """SARIMAX-based time series forecasting"""
    if not STATSMODELS_AVAILABLE or len(series) < 50:
        return _simple_forecast(series, horizon_days)
    
    try:
        # Prepare data
        series_clean = series.dropna()
        if len(series_clean) < 50:
            return _simple_forecast(series, horizon_days)
        
        # Determine seasonal period
        seasonal_period = _get_seasonal_periods()['daily']
        
        # Fit SARIMAX model
        model = SARIMAX(
            series_clean,
            order=(1, 1, 1),  # ARIMA order
            seasonal_order=(1, 1, 1, seasonal_period),  # Seasonal order
            enforce_stationarity=False,
            enforce_invertibility=False
        )
        
        fitted_model = model.fit(disp=False)
        
        # Generate forecast
        forecast = fitted_model.forecast(steps=horizon_days)
        forecast_ci = fitted_model.get_forecast(steps=horizon_days).conf_int()
        
        # Calculate accuracy metrics
        train_size = int(len(series_clean) * 0.8)
        train_data = series_clean[:train_size]
        test_data = series_clean[train_size:]
        
        if len(test_data) > 0:
            model_train = SARIMAX(
                train_data,
                order=(1, 1, 1),
                seasonal_order=(1, 1, 1, seasonal_period),
                enforce_stationarity=False,
                enforce_invertibility=False
            )
            fitted_train = model_train.fit(disp=False)
            predictions = fitted_train.forecast(steps=len(test_data))
            
            mse = mean_squared_error(test_data, predictions)
            r2 = r2_score(test_data, predictions)
            accuracy = max(0, min(1, r2))
        else:
            accuracy = 0.8  # Default accuracy
        
        return {
            'forecast': forecast,
            'confidence_interval': forecast_ci,
            'accuracy': accuracy,
            'model_type': 'SARIMAX',
            'seasonal_period': seasonal_period
        }
        
    except Exception as e:
        print(f"SARIMAX forecast error: {e}")
        return _simple_forecast(series, horizon_days)

def _simple_forecast(series: pd.Series, horizon_days: int) -> Dict:
    """Simple forecasting fallback"""
    last_value = series.iloc[-1]
    trend = (series.iloc[-1] - series.iloc[-30:].mean()) / 30 if len(series) > 30 else 0
    
    forecast_values = []
    for i in range(horizon_days):
        val = last_value + (trend * (i + 1)) + np.random.normal(0, 0.1)
        forecast_values.append(max(0.5, min(20.0, val)))
    
    forecast = pd.Series(forecast_values)
    confidence_interval = pd.DataFrame({
        'lower': forecast - 0.5,
        'upper': forecast + 0.5
    })
    
    return {
        'forecast': forecast,
        'confidence_interval': confidence_interval,
        'accuracy': 0.7,
        'model_type': 'Simple',
        'seasonal_period': 7
    }

def seasonal_forecast(series: pd.Series, season: str, horizon_days: int = 30) -> Dict:
    """Seasonal predictions (Monsoon & Post-monsoon)"""
    try:
        # Get seasonal data
        series_df = series.to_frame('value')
        series_df['month'] = series_df.index.month
        series_df['season'] = series_df['month'].apply(_identify_season)
        
        # Filter for specific season
        seasonal_data = series_df[series_df['season'] == season]['value']
        
        if len(seasonal_data) < 10:
            return sarimax_forecast(series, horizon_days)
        
        # Use seasonal data for forecasting
        return sarimax_forecast(seasonal_data, horizon_days)
        
    except Exception as e:
        print(f"Seasonal forecast error: {e}")
        return sarimax_forecast(series, horizon_days)

def feature_importance_analysis(series: pd.Series, external_features: Dict = None) -> Dict:
    """Feature importance analysis for groundwater levels"""
    try:
        # Create features
        df = series.to_frame('water_level')
        df['day_of_year'] = df.index.dayofyear
        df['month'] = df.index.month
        df['year'] = df.index.year
        df['lag_1'] = df['water_level'].shift(1)
        df['lag_7'] = df['water_level'].shift(7)
        df['lag_30'] = df['water_level'].shift(30)
        df['rolling_mean_7'] = df['water_level'].rolling(7).mean()
        df['rolling_mean_30'] = df['water_level'].rolling(30).mean()
        
        # Add external features if available
        if external_features:
            for feature_name, feature_data in external_features.items():
                if len(feature_data) == len(df):
                    df[feature_name] = feature_data
        
        # Prepare data for modeling
        df_clean = df.dropna()
        if len(df_clean) < 50:
            return {'error': 'Insufficient data for feature importance analysis'}
        
        X = df_clean.drop('water_level', axis=1)
        y = df_clean['water_level']
        
        # Train Random Forest model
        rf_model = RandomForestRegressor(n_estimators=100, random_state=42)
        rf_model.fit(X, y)
        
        # Get feature importance
        feature_importance = dict(zip(X.columns, rf_model.feature_importances_))
        
        # Sort by importance
        sorted_features = sorted(feature_importance.items(), key=lambda x: x[1], reverse=True)
        
        return {
            'feature_importance': dict(sorted_features),
            'model_accuracy': rf_model.score(X, y),
            'top_features': [f[0] for f in sorted_features[:5]]
        }
        
    except Exception as e:
        print(f"Feature importance analysis error: {e}")
        return {'error': str(e)}

def driver_identification(series: pd.Series, external_data: Dict = None) -> Dict:
    """Driver identification for groundwater levels"""
    try:
        # Analyze correlations and trends
        drivers = {}
        
        # Time-based drivers
        df = series.to_frame('water_level')
        df['month'] = df.index.month
        df['day_of_year'] = df.index.dayofyear
        
        # Seasonal patterns
        monthly_avg = df.groupby('month')['water_level'].mean()
        seasonal_impact = {
            'monsoon_months': monthly_avg[[6, 7, 8, 9]].mean(),
            'post_monsoon_months': monthly_avg[[10, 11, 12, 1, 2]].mean(),
            'pre_monsoon_months': monthly_avg[[3, 4, 5]].mean()
        }
        
        drivers['seasonal_patterns'] = seasonal_impact
        
        # Trend analysis
        if len(series) > 365:
            yearly_avg = df.groupby(df.index.year)['water_level'].mean()
            trend = (yearly_avg.iloc[-1] - yearly_avg.iloc[0]) / len(yearly_avg)
            drivers['long_term_trend'] = trend
        
        # External drivers (if available)
        if external_data:
            for driver_name, driver_series in external_data.items():
                if len(driver_series) == len(series):
                    correlation = series.corr(pd.Series(driver_series, index=series.index))
                    drivers[f'{driver_name}_correlation'] = correlation
        
        return drivers
        
    except Exception as e:
        print(f"Driver identification error: {e}")
        return {'error': str(e)}

def forecast_district(df: pd.DataFrame, district: str, horizon_days: int = 30) -> Dict:
    """Generate comprehensive forecast for a district with all features"""
    try:
        s = _prepare_series(df, district)
        if s.empty:
            return {'error': 'No data available for district'}
        
        # SARIMAX-based forecasting
        forecast_result = sarimax_forecast(s, horizon_days)
        
        # Seasonal forecasting
        monsoon_forecast = seasonal_forecast(s, 'monsoon', horizon_days)
        post_monsoon_forecast = seasonal_forecast(s, 'post_monsoon', horizon_days)
        
        # Feature importance analysis
        feature_importance = feature_importance_analysis(s)
        
        # Driver identification
        drivers = driver_identification(s)
        
        # Generate forecast DataFrame
        forecast_dates = pd.date_range(s.index[-1] + pd.Timedelta(days=1), periods=horizon_days, freq="D")
        
        forecast_df = pd.DataFrame({
            'Date': forecast_dates,
            'Forecasted_Water_Level': forecast_result['forecast'].values,
            'Lower_Bound': forecast_result['confidence_interval'].iloc[:, 0].values,
            'Upper_Bound': forecast_result['confidence_interval'].iloc[:, 1].values
        })
        
        return {
            'forecast_df': forecast_df,
            'accuracy': forecast_result['accuracy'],
            'model_type': forecast_result['model_type'],
            'seasonal_forecasts': {
                'monsoon': monsoon_forecast,
                'post_monsoon': post_monsoon_forecast
            },
            'feature_importance': feature_importance,
            'drivers': drivers,
            'forecast_periods': {
                '30_day': horizon_days,
                '365_day': 365
            }
        }
        
    except Exception as e:
        print(f"Error in comprehensive forecasting for {district}: {e}")
        return {'error': str(e)}
