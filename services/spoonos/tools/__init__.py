"""
SpoonOS Tools for Music Generation Agent
"""

from .coingecko import CoinGeckoHistoricalDataTool
from .market_analysis import MarketAnalysisTool
from .music_mapping import MusicParameterMappingTool
from .elevenlabs import ElevenLabsMusicGenerationTool

__all__ = [
    'CoinGeckoHistoricalDataTool',
    'MarketAnalysisTool',
    'MusicParameterMappingTool',
    'ElevenLabsMusicGenerationTool',
]

