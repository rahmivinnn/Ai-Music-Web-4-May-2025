import os
import logging
import subprocess
import tempfile
from pydub import AudioSegment
import json

logger = logging.getLogger(__name__)

def master_audio(input_path, output_path):
    """
    Master the audio using FFmpeg or Matchering
    
    Args:
        input_path: Path to the input audio file or list of paths to mix
        output_path: Path to save the mastered output
        
    Returns:
        Path to the mastered output
    """
    logger.info(f"Mastering audio: {input_path}")
    
    try:
        # Check if input_path is a list (multiple stems to mix)
        if isinstance(input_path, list):
            # Mix the stems first
            mixed_path = mix_audio_files(input_path)
            input_path = mixed_path
        
        # Try to use Matchering if available
        try:
            mastered_path = master_with_matchering(input_path, output_path)
            if mastered_path:
                return mastered_path
        except Exception as e:
            logger.warning(f"Matchering failed, falling back to FFmpeg: {str(e)}")
        
        # Fall back to FFmpeg mastering
        return master_with_ffmpeg(input_path, output_path)
        
    except Exception as e:
        logger.error(f"Error mastering audio: {str(e)}", exc_info=True)
        
        # If mastering fails, try to at least convert the file to the right format
        try:
            audio = AudioSegment.from_file(input_path)
            audio.export(output_path, format=output_path.split(".")[-1])
            return output_path
        except:
            # If all else fails, return the input path
            return input_path

def mix_audio_files(input_paths):
    """
    Mix multiple audio files
    
    Args:
        input_paths: List of paths to audio files
        
    Returns:
        Path to the mixed output
    """
    logger.info(f"Mixing audio files: {input_paths}")
    
    try:
        # Create a temporary file for the mixed output
        temp_dir = tempfile.mkdtemp()
        mixed_path = os.path.join(temp_dir, "mixed.wav")
        
        # Load the first file as the base
        if not input_paths:
            raise ValueError("No input paths provided for mixing")
        
        mix = AudioSegment.from_file(input_paths[0])
        
        # Overlay the rest of the files
        for path in input_paths[1:]:
            overlay = AudioSegment.from_file(path)
            
            # Make sure the overlay is the same length as the mix
            if len(overlay) < len(mix):
                # Pad with silence
                overlay = overlay + AudioSegment.silent(duration=len(mix) - len(overlay))
            elif len(overlay) > len(mix):
                # Trim to match
                overlay = overlay[:len(mix)]
            
            # Overlay with the mix
            mix = mix.overlay(overlay)
        
        # Export the mixed file
        mix.export(mixed_path, format="wav")
        return mixed_path
        
    except Exception as e:
        logger.error(f"Error mixing audio files: {str(e)}", exc_info=True)
        # If mixing fails, return the first file
        if input_paths:
            return input_paths[0]
        return None

def master_with_matchering(input_path, output_path):
    """
    Master the audio using Matchering
    
    Args:
        input_path: Path to the input audio file
        output_path: Path to save the mastered output
        
    Returns:
        Path to the mastered output or None if Matchering is not available
    """
    try:
        # Check if Matchering is installed
        import matchering
        
        # Create a temporary directory for Matchering output
        temp_dir = tempfile.mkdtemp()
        
        # Choose a reference track based on the file extension
        # In a real implementation, you would choose a reference track based on genre
        reference_path = os.path.join(os.path.dirname(__file__), "references", "reference_pop.wav")
        
        # If the reference file doesn't exist, return None
        if not os.path.exists(reference_path):
            logger.warning(f"Reference file not found: {reference_path}")
            return None
        
        # Master with Matchering
        matchering.process(
            target=input_path,
            reference=reference_path,
            results=[
                matchering.Result(
                    output_path,
                    format=output_path.split(".")[-1]
                )
            ]
        )
        
        return output_path
        
    except ImportError:
        logger.warning("Matchering not installed")
        return None
    except Exception as e:
        logger.error(f"Error mastering with Matchering: {str(e)}", exc_info=True)
        return None

def master_with_ffmpeg(input_path, output_path):
    """
    Master the audio using FFmpeg
    
    Args:
        input_path: Path to the input audio file
        output_path: Path to save the mastered output
        
    Returns:
        Path to the mastered output
    """
    try:
        # Create a temporary file for the FFmpeg output
        temp_dir = tempfile.mkdtemp()
        temp_output = os.path.join(temp_dir, "mastered.wav")
        
        # Apply a chain of audio filters for mastering:
        # 1. High-pass filter to remove sub-bass rumble
        # 2. Low-pass filter to remove ultra-high frequencies
        # 3. Compression to even out dynamics
        # 4. EQ to enhance clarity
        # 5. Limiting to prevent clipping and maximize loudness
        
        filter_chain = [
            # High-pass filter at 30Hz
            "highpass=f=30",
            
            # Low-pass filter at 18kHz
            "lowpass=f=18000",
            
            # Compression
            "compand=attacks=0.005:decays=0.1:points=-80/-80|-45/-15|-27/-9|0/-7|20/-7:soft-knee=6:gain=0",
            
            # EQ: Boost low end slightly, cut some mud, boost presence
            "equalizer=f=60:width_type=h:width=50:g=2",    # Bass boost
            "equalizer=f=300:width_type=h:width=100:g=-3", # Cut mud
            "equalizer=f=3000:width_type=h:width=100:g=2", # Presence boost
            "equalizer=f=10000:width_type=h:width=100:g=1", # Air boost
            
            # Limiting
            "alimiter=level_in=1:level_out=1:limit=0.5:attack=5:release=50",
            
            # Final gain adjustment
            "volume=1.5dB"
        ]
        
        # Join the filter chain
        filter_string = ",".join(filter_chain)
        
        # Run FFmpeg
        subprocess.run([
            "ffmpeg",
            "-i", input_path,
            "-af", filter_string,
            "-ar", "44100",  # Set sample rate to 44.1kHz
            "-y", temp_output
        ], check=True, capture_output=True)
        
        # Convert to the desired output format
        output_format = output_path.split(".")[-1]
        
        if output_format.lower() == "mp3":
            # For MP3, use a good quality setting
            subprocess.run([
                "ffmpeg",
                "-i", temp_output,
                "-codec:a", "libmp3lame",
                "-q:a", "2",  # High quality (0-9, lower is better)
                "-y", output_path
            ], check=True, capture_output=True)
        else:
            # For other formats, just copy
            subprocess.run([
                "ffmpeg",
                "-i", temp_output,
                "-y", output_path
            ], check=True, capture_output=True)
        
        return output_path
        
    except Exception as e:
        logger.error(f"Error mastering with FFmpeg: {str(e)}", exc_info=True)
        
        # If FFmpeg mastering fails, try a simpler approach with pydub
        try:
            audio = AudioSegment.from_file(input_path)
            
            # Apply some basic processing
            audio = audio.normalize()
            audio = audio.compress_dynamic_range(threshold=-20, ratio=4.0)
            
            # Export
            audio.export(output_path, format=output_path.split(".")[-1])
            return output_path
        except:
            # If all else fails, return the input path
            return input_path

def create_reference_tracks():
    """
    Create reference tracks for Matchering if they don't exist
    
    This function would download or create reference tracks for different genres
    """
    references_dir = os.path.join(os.path.dirname(__file__), "references")
    os.makedirs(references_dir, exist_ok=True)
    
    # In a real implementation, you would download or create reference tracks
    # For now, we'll just create a simple sine wave as a placeholder
    
    reference_path = os.path.join(references_dir, "reference_pop.wav")
    
    if not os.path.exists(reference_path):
        try:
            import numpy as np
            import soundfile as sf
            
            # Create a simple sine wave
            sample_rate = 44100
            duration = 10  # seconds
            t = np.linspace(0, duration, int(sample_rate * duration))
            
            # A440 sine wave
            sine = 0.5 * np.sin(2 * np.pi * 440 * t)
            
            # Save as WAV
            sf.write(reference_path, sine, sample_rate)
            
            logger.info(f"Created reference track: {reference_path}")
        except Exception as e:
            logger.error(f"Error creating reference track: {str(e)}", exc_info=True)

# Create reference tracks when the module is imported
create_reference_tracks()
