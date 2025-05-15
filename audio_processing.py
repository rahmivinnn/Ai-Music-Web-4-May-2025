import os
import logging
import numpy as np
import librosa
from pydub import AudioSegment
import tempfile
import subprocess
import json

logger = logging.getLogger(__name__)

def preprocess_audio(input_path):
    """
    Preprocess audio file:
    - Convert to WAV if needed
    - Normalize audio levels
    - Trim silence
    - Ensure consistent sample rate (44.1kHz)
    
    Args:
        input_path: Path to the input audio file
        
    Returns:
        Path to the preprocessed audio file
    """
    logger.info(f"Preprocessing audio: {input_path}")
    
    # Create a temporary directory for processed files
    temp_dir = tempfile.mkdtemp()
    
    try:
        # Load audio with pydub
        audio = AudioSegment.from_file(input_path)
        
        # Convert to mono if stereo (for analysis purposes)
        mono_audio = audio.set_channels(1)
        
        # Normalize audio to -1 dB
        normalized_audio = audio.normalize(headroom=1.0)
        
        # Ensure 44.1kHz sample rate
        if audio.frame_rate != 44100:
            normalized_audio = normalized_audio.set_frame_rate(44100)
        
        # Export to WAV for further processing
        preprocessed_path = os.path.join(temp_dir, "preprocessed.wav")
        normalized_audio.export(preprocessed_path, format="wav")
        
        # Trim silence using FFmpeg
        trimmed_path = os.path.join(temp_dir, "trimmed.wav")
        subprocess.run([
            "ffmpeg", "-i", preprocessed_path,
            "-af", "silenceremove=start_periods=1:start_duration=0.1:start_threshold=-50dB:detection=peak,aformat=dblp,areverse,silenceremove=start_periods=1:start_duration=0.1:start_threshold=-50dB:detection=peak,aformat=dblp,areverse",
            "-y", trimmed_path
        ], check=True, capture_output=True)
        
        logger.info(f"Audio preprocessing complete: {trimmed_path}")
        return trimmed_path
        
    except Exception as e:
        logger.error(f"Error preprocessing audio: {str(e)}", exc_info=True)
        # If preprocessing fails, return the original file
        return input_path

def detect_audio_features(audio_path):
    """
    Detect audio features:
    - Tempo (BPM)
    - Key
    - Genre (using a simple classifier)
    - Mood
    - Energy level
    
    Args:
        audio_path: Path to the audio file
        
    Returns:
        Dictionary of detected features
    """
    logger.info(f"Detecting audio features: {audio_path}")
    
    try:
        # Load audio with librosa
        y, sr = librosa.load(audio_path, sr=None)
        
        # Detect tempo
        tempo, _ = librosa.beat.beat_track(y=y, sr=sr)
        
        # Detect key
        chroma = librosa.feature.chroma_cqt(y=y, sr=sr)
        key_features = np.sum(chroma, axis=1)
        key_index = np.argmax(key_features)
        
        # Map key index to musical key
        keys = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
        key = keys[key_index]
        
        # Determine if major or minor
        minor_likelihood = estimate_minor_likelihood(y, sr)
        key_mode = "minor" if minor_likelihood > 0.5 else "major"
        
        # Calculate energy
        energy = np.mean(librosa.feature.rms(y=y))
        energy_level = "high" if energy > 0.1 else "medium" if energy > 0.05 else "low"
        
        # Estimate mood based on tempo and energy
        mood = estimate_mood(tempo, energy, minor_likelihood)
        
        # Simple genre classification
        genre = estimate_genre(y, sr, tempo, energy)
        
        # Return features
        features = {
            "tempo": round(float(tempo), 1),
            "key": f"{key} {key_mode}",
            "genre": genre,
            "mood": mood,
            "energy": energy_level,
            "duration": round(float(len(y) / sr), 2)
        }
        
        logger.info(f"Detected features: {json.dumps(features)}")
        return features
        
    except Exception as e:
        logger.error(f"Error detecting audio features: {str(e)}", exc_info=True)
        # Return default values if detection fails
        return {
            "tempo": 120.0,
            "key": "C major",
            "genre": "unknown",
            "mood": "neutral",
            "energy": "medium",
            "duration": 0.0
        }

def estimate_minor_likelihood(y, sr):
    """
    Estimate the likelihood that a song is in a minor key
    
    Args:
        y: Audio time series
        sr: Sample rate
        
    Returns:
        Float between 0 and 1 (higher = more likely to be minor)
    """
    # Extract harmonic content
    y_harmonic = librosa.effects.harmonic(y)
    
    # Compute chroma features
    chroma = librosa.feature.chroma_cqt(y=y_harmonic, sr=sr)
    
    # Minor keys typically have more presence in the relative minor positions
    # (A minor has more A, C, E while C major has more C, E, G)
    minor_positions = [9, 0, 4]  # A, C, E (for A minor)
    major_positions = [0, 4, 7]  # C, E, G (for C major)
    
    minor_energy = np.mean([np.mean(chroma[p]) for p in minor_positions])
    major_energy = np.mean([np.mean(chroma[p]) for p in major_positions])
    
    # Calculate likelihood
    if minor_energy + major_energy > 0:
        return minor_energy / (minor_energy + major_energy)
    else:
        return 0.5  # Default to equal likelihood

def estimate_mood(tempo, energy, minor_likelihood):
    """
    Estimate the mood of a song based on tempo, energy, and key
    
    Args:
        tempo: Beats per minute
        energy: Energy level
        minor_likelihood: Likelihood of being in a minor key
        
    Returns:
        String describing the mood
    """
    # Simple mood classification based on tempo and key
    if minor_likelihood > 0.6:
        if tempo < 85:
            return "sad" if energy < 0.1 else "melancholic"
        elif tempo < 120:
            return "mysterious" if energy < 0.1 else "dramatic"
        else:
            return "tense" if energy > 0.1 else "energetic"
    else:
        if tempo < 85:
            return "relaxed" if energy < 0.1 else "peaceful"
        elif tempo < 120:
            return "happy" if energy > 0.1 else "cheerful"
        else:
            return "excited" if energy > 0.1 else "energetic"

def estimate_genre(y, sr, tempo, energy):
    """
    Simple genre classification based on audio features
    
    Args:
        y: Audio time series
        sr: Sample rate
        tempo: Beats per minute
        energy: Energy level
        
    Returns:
        String representing the estimated genre
    """
    # Extract features for genre classification
    spectral_centroid = np.mean(librosa.feature.spectral_centroid(y=y, sr=sr))
    spectral_rolloff = np.mean(librosa.feature.spectral_rolloff(y=y, sr=sr))
    zero_crossing_rate = np.mean(librosa.feature.zero_crossing_rate(y=y))
    
    # Simple rule-based genre classification
    if tempo > 160 and energy > 0.1 and spectral_centroid > 3000:
        return "electronic"
    elif tempo > 100 and tempo < 130 and energy > 0.1:
        return "pop"
    elif tempo > 60 and tempo < 90 and spectral_rolloff < 2000:
        return "hip-hop"
    elif tempo > 120 and zero_crossing_rate > 0.1:
        return "rock"
    elif tempo < 80 and spectral_centroid < 1500:
        return "jazz"
    elif tempo < 70 and energy < 0.05:
        return "ambient"
    else:
        return "pop"  # Default to pop
