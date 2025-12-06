"""
ElevenLabs Music Generation Tool
Calls ElevenLabs API to generate music from prompts
"""

import os
import requests
import uuid
from typing import Dict, Any
from pathlib import Path


class ElevenLabsMusicGenerationTool:
    """Tool for generating music using ElevenLabs API"""
    
    BASE_URL = "https://api.elevenlabs.io/v1/music-generation"
    
    def __init__(self, output_dir: str = None):
        self.api_key = os.getenv("ELEVENLABS_API_KEY")
        if not self.api_key:
            raise ValueError("ELEVENLABS_API_KEY not set")
        
        # Use absolute path for output directory
        if output_dir is None:
            # Default to temp directory relative to service root
            service_root = Path(__file__).parent.parent
            output_dir = service_root / "temp"
        else:
            output_dir = Path(output_dir)
        
        self.output_dir = Path(output_dir).resolve()
        self.output_dir.mkdir(parents=True, exist_ok=True)
    
    def generate_music(
        self,
        prompt: str,
        duration_seconds: int = 8,
        prompt_influence: float = 0.7
    ) -> Dict[str, Any]:
        """
        Generate music using ElevenLabs API
        
        Args:
            prompt: Music description prompt
            duration_seconds: Duration of the music in seconds
            prompt_influence: How much the prompt influences output (0-1)
            
        Returns:
            Dictionary with audio file path and metadata
        """
        headers = {
            "xi-api-key": self.api_key,
            "Content-Type": "application/json",
        }
        
        payload = {
            "text": prompt,
            "duration_seconds": duration_seconds,
            "prompt_influence": prompt_influence,
        }
        
        try:
            print(f"📻 Calling ElevenLabs Music API...")
            print(f"📝 Prompt: {prompt[:100]}...")
            
            response = requests.post(
                self.BASE_URL,
                json=payload,
                headers=headers,
                timeout=120  # 2 minutes timeout
            )
            
            response.raise_for_status()
            
            # Save audio file
            audio_data = response.content
            filename = f"audio_{uuid.uuid4().hex[:8]}.mp3"
            filepath = self.output_dir / filename
            
            with open(filepath, "wb") as f:
                f.write(audio_data)
            
            print(f"✅ ElevenLabs audio saved: {filename}")
            
            return {
                "success": True,
                "audio_file": str(filepath),
                "audio_url": f"/api/audio/{filename}",
                "filename": filename,
                "duration": duration_seconds,
                "size_bytes": len(audio_data),
            }
            
        except requests.exceptions.RequestException as e:
            error_msg = f"ElevenLabs API error: {str(e)}"
            if hasattr(e, 'response') and e.response is not None:
                try:
                    error_detail = e.response.json()
                    error_msg += f" - {error_detail}"
                except:
                    error_msg += f" - Status: {e.response.status_code}"
            
            print(f"❌ {error_msg}")
            raise Exception(error_msg)
    
    def __call__(self, prompt: str, duration_seconds: int = 8, prompt_influence: float = 0.7) -> Dict[str, Any]:
        """Make the tool callable"""
        return self.generate_music(prompt, duration_seconds, prompt_influence)

