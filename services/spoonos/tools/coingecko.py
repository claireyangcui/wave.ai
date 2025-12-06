"""
CoinGecko Historical Data Tool
Fetches historical price data from CoinGecko API
"""

import os
import requests
from typing import Dict, List, Any
from datetime import datetime, timedelta


class CoinGeckoHistoricalDataTool:
    """Tool for fetching historical cryptocurrency price data from CoinGecko"""
    
    BASE_URL = "https://api.coingecko.com/api/v3"
    
    # Map instrument symbols to CoinGecko IDs
    INSTRUMENT_MAP = {
        "BTC": "bitcoin",
        "ETH": "ethereum",
        "SOL": "solana",
        "AVAX": "avalanche-2",
        "MATIC": "matic-network",
    }
    
    def __init__(self):
        self.api_key = os.getenv("COINGECKO_API_KEY")
    
    def get_historical_data(
        self, 
        instrument: str, 
        days: int = 7
    ) -> Dict[str, Any]:
        """
        Fetch historical price data for an instrument
        
        Args:
            instrument: Cryptocurrency symbol (BTC, ETH, etc.)
            days: Number of days of historical data to fetch
            
        Returns:
            Dictionary with historical price data, daily changes, volume, and volatility
        """
        coin_id = self.INSTRUMENT_MAP.get(instrument.upper())
        if not coin_id:
            raise ValueError(f"Unsupported instrument: {instrument}")
        
        # Build request URL
        url = f"{self.BASE_URL}/coins/{coin_id}/market_chart"
        params = {
            "vs_currency": "usd",
            "days": days,
            "interval": "daily" if days > 7 else "hourly",
        }
        
        headers = {}
        if self.api_key:
            headers["x-cg-demo-api-key"] = self.api_key
        
        try:
            response = requests.get(url, params=params, headers=headers, timeout=10)
            response.raise_for_status()
            data = response.json()
            
            # Extract price data
            prices = data.get("prices", [])
            volumes = data.get("total_volumes", [])
            
            if not prices:
                raise ValueError(f"No price data returned for {instrument}")
            
            # Process historical data
            historical_data = []
            daily_changes = []
            volumes_list = []
            
            for i in range(len(prices)):
                timestamp = prices[i][0]
                price = prices[i][1]
                volume = volumes[i][1] if i < len(volumes) else 0
                
                historical_data.append({
                    "timestamp": timestamp,
                    "price": price,
                    "volume": volume,
                })
                
                # Calculate daily change
                if i > 0:
                    prev_price = prices[i - 1][1]
                    change = ((price - prev_price) / prev_price) * 100
                    daily_changes.append(change)
                    volumes_list.append(volume)
            
            # Calculate current metrics
            current_price = prices[-1][1]
            first_price = prices[0][1]
            total_change_pct = ((current_price - first_price) / first_price) * 100
            
            # Calculate volatility (standard deviation of daily changes)
            import statistics
            volatility = statistics.stdev(daily_changes) if len(daily_changes) > 1 else 0
            
            # Calculate average volume
            avg_volume = statistics.mean(volumes_list) if volumes_list else 0
            
            return {
                "instrument": instrument.upper(),
                "current_price": current_price,
                "historical_prices": historical_data,
                "daily_changes": daily_changes,
                "total_change_percent": total_change_pct,
                "volatility": abs(volatility),
                "average_volume": avg_volume,
                "current_volume": volumes[-1][1] if volumes else 0,
                "days_analyzed": days,
                "data_points": len(prices),
            }
            
        except requests.exceptions.RequestException as e:
            raise Exception(f"CoinGecko API error: {str(e)}")
        except Exception as e:
            raise Exception(f"Error processing CoinGecko data: {str(e)}")
    
    def __call__(self, instrument: str, days: int = 7) -> Dict[str, Any]:
        """Make the tool callable"""
        return self.get_historical_data(instrument, days)

