"""
Market Analysis Tool
Analyzes historical market data to identify patterns, trends, and features
"""

from typing import Dict, List, Any
import statistics


class MarketAnalysisTool:
    """Tool for analyzing market data patterns and extracting features"""
    
    def analyze_patterns(self, historical_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze historical market data to identify patterns
        
        Args:
            historical_data: Dictionary from CoinGeckoHistoricalDataTool
            
        Returns:
            Dictionary with analyzed patterns, trends, and features
        """
        prices = [d["price"] for d in historical_data.get("historical_prices", [])]
        daily_changes = historical_data.get("daily_changes", [])
        volumes = [d["volume"] for d in historical_data.get("historical_prices", [])]
        
        if not prices:
            raise ValueError("No price data provided for analysis")
        
        # Price trend analysis
        price_trend = self._analyze_trend(prices)
        
        # Volatility analysis
        volatility_patterns = self._analyze_volatility(daily_changes)
        
        # Volume analysis
        volume_patterns = self._analyze_volume(volumes)
        
        # Identify spikes and significant movements
        spikes = self._identify_spikes(daily_changes)
        
        # Calculate momentum
        momentum = self._calculate_momentum(prices)
        
        return {
            "price_trend": price_trend,
            "volatility_patterns": volatility_patterns,
            "volume_patterns": volume_patterns,
            "spikes": spikes,
            "momentum": momentum,
            "overall_sentiment": self._determine_sentiment(price_trend, volatility_patterns, spikes),
        }
    
    def _analyze_trend(self, prices: List[float]) -> Dict[str, Any]:
        """Analyze price trend direction and strength"""
        if len(prices) < 2:
            return {"direction": "stable", "strength": 0.0}
        
        first_half = prices[:len(prices)//2]
        second_half = prices[len(prices)//2:]
        
        first_avg = statistics.mean(first_half)
        second_avg = statistics.mean(second_half)
        
        change_pct = ((second_avg - first_avg) / first_avg) * 100
        
        if change_pct > 2:
            direction = "rising"
        elif change_pct < -2:
            direction = "falling"
        else:
            direction = "stable"
        
        strength = min(abs(change_pct) / 10, 1.0)  # Normalize to 0-1
        
        return {
            "direction": direction,
            "strength": strength,
            "change_percent": change_pct,
        }
    
    def _analyze_volatility(self, daily_changes: List[float]) -> Dict[str, Any]:
        """Analyze volatility patterns"""
        if not daily_changes:
            return {"level": "low", "consistency": 1.0}
        
        abs_changes = [abs(c) for c in daily_changes]
        avg_volatility = statistics.mean(abs_changes)
        vol_std = statistics.stdev(abs_changes) if len(abs_changes) > 1 else 0
        
        if avg_volatility > 5:
            level = "high"
        elif avg_volatility > 2:
            level = "medium"
        else:
            level = "low"
        
        # Consistency: lower std means more consistent volatility
        consistency = max(0, 1 - (vol_std / avg_volatility)) if avg_volatility > 0 else 1.0
        
        return {
            "level": level,
            "average": avg_volatility,
            "consistency": consistency,
            "has_spikes": max(abs_changes) > avg_volatility * 2,
        }
    
    def _analyze_volume(self, volumes: List[float]) -> Dict[str, Any]:
        """Analyze volume patterns"""
        if not volumes:
            return {"trend": "stable", "relative_level": 0.5}
        
        first_half = volumes[:len(volumes)//2]
        second_half = volumes[len(volumes)//2:]
        
        first_avg = statistics.mean(first_half)
        second_avg = statistics.mean(second_half)
        
        if second_avg > first_avg * 1.2:
            trend = "increasing"
        elif second_avg < first_avg * 0.8:
            trend = "decreasing"
        else:
            trend = "stable"
        
        # Normalize volume level (0-1)
        max_vol = max(volumes)
        min_vol = min(volumes)
        relative_level = (statistics.mean(volumes) - min_vol) / (max_vol - min_vol) if max_vol > min_vol else 0.5
        
        return {
            "trend": trend,
            "relative_level": relative_level,
            "average": statistics.mean(volumes),
        }
    
    def _identify_spikes(self, daily_changes: List[float], threshold: float = 3.0) -> List[Dict[str, Any]]:
        """Identify significant price spikes"""
        if not daily_changes:
            return []
        
        abs_changes = [abs(c) for c in daily_changes]
        avg_change = statistics.mean(abs_changes)
        std_change = statistics.stdev(abs_changes) if len(abs_changes) > 1 else 0
        
        spikes = []
        for i, change in enumerate(daily_changes):
            if abs(change) > max(threshold, avg_change + 2 * std_change):
                spikes.append({
                    "day": i,
                    "change_percent": change,
                    "magnitude": abs(change) / avg_change if avg_change > 0 else 0,
                })
        
        return spikes
    
    def _calculate_momentum(self, prices: List[float]) -> float:
        """Calculate price momentum (rate of change)"""
        if len(prices) < 3:
            return 0.0
        
        # Use recent prices to calculate momentum
        recent = prices[-3:]
        momentum = ((recent[-1] - recent[0]) / recent[0]) * 100
        
        # Normalize to 0-1
        return max(-1.0, min(1.0, momentum / 10))
    
    def _determine_sentiment(
        self, 
        price_trend: Dict[str, Any],
        volatility: Dict[str, Any],
        spikes: List[Dict[str, Any]]
    ) -> str:
        """Determine overall market sentiment"""
        direction = price_trend.get("direction", "stable")
        strength = price_trend.get("strength", 0.0)
        has_spikes = len(spikes) > 0
        
        if direction == "rising" and strength > 0.5:
            return "bullish"
        elif direction == "falling" and strength > 0.5:
            return "bearish"
        elif has_spikes:
            return "volatile"
        else:
            return "neutral"
    
    def __call__(self, historical_data: Dict[str, Any]) -> Dict[str, Any]:
        """Make the tool callable"""
        return self.analyze_patterns(historical_data)

