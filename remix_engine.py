import os
import logging
import tempfile
import subprocess
import numpy as np
import librosa
import soundfile as sf
from pydub import AudioSegment
import json
import re

logger = logging.getLogger(__name__)

def create_remix(input_path, remix_prompt, audio_features):
    """
    Create a remix of the input audio based on the prompt
    
    Args:
        input_path: Path to the preprocessed audio file
        remix_prompt: Text description of the desired remix style
        audio_features: Dictionary of detected audio features
        
    Returns:
        Path to the remixed audio file
    """
    logger.info(f"Creating remix: {input_path}")
    logger.info(f"Remix prompt: {remix_prompt}")
    
    # Create a temporary directory for processed files
    temp_dir = tempfile.mkdtemp()
    
    try:
        # Step 1: Separate stems using Demucs
        stems_dir = separate_stems(input_path, temp_dir)
        
        # Step 2: Analyze the remix prompt to determine the target style
        remix_style = analyze_remix_prompt(remix_prompt)
        logger.info(f"Detected remix style: {json.dumps(remix_style)}")
        
        # Step 3: Process each stem according to the remix style
        processed_stems = process_stems(stems_dir, remix_style, audio_features)
        
        # Step 4: Mix the processed stems
        output_path = os.path.join(temp_dir, "remixed.wav")
        mix_stems(processed_stems, output_path, remix_style)
        
        logger.info(f"Remix created: {output_path}")
        return output_path
        
    except Exception as e:
        logger.error(f"Error creating remix: {str(e)}", exc_info=True)
        # If remixing fails, return the original file
        return input_path

def separate_stems(input_path, output_dir):
    """
    Separate audio into stems using Demucs
    
    Args:
        input_path: Path to the input audio file
        output_dir: Directory to save the stems
        
    Returns:
        Path to the directory containing the stems
    """
    logger.info(f"Separating stems: {input_path}")
    
    stems_dir = os.path.join(output_dir, "stems")
    os.makedirs(stems_dir, exist_ok=True)
    
    try:
        # Run Demucs to separate stems
        # Note: This requires Demucs to be installed
        subprocess.run([
            "demucs", "--two-stems=vocals", 
            "-o", output_dir,
            input_path
        ], check=True, capture_output=True)
        
        # Demucs creates a subdirectory with the model name and then the track name
        # We'll use a simplified approach for this example
        track_name = os.path.splitext(os.path.basename(input_path))[0]
        model_name = "htdemucs"  # Default model name
        
        stems_path = os.path.join(output_dir, model_name, track_name)
        
        # If Demucs fails or is not installed, create dummy stems for demonstration
        if not os.path.exists(stems_path):
            logger.warning("Demucs failed or not installed. Creating dummy stems.")
            create_dummy_stems(input_path, stems_dir)
            stems_path = stems_dir
        
        logger.info(f"Stems separated: {stems_path}")
        return stems_path
        
    except Exception as e:
        logger.error(f"Error separating stems: {str(e)}", exc_info=True)
        # Create dummy stems if separation fails
        logger.warning("Creating dummy stems due to separation failure.")
        create_dummy_stems(input_path, stems_dir)
        return stems_dir

def create_dummy_stems(input_path, output_dir):
    """
    Create dummy stems if Demucs is not available
    
    Args:
        input_path: Path to the input audio file
        output_dir: Directory to save the stems
    """
    try:
        # Load the audio
        audio = AudioSegment.from_file(input_path)
        
        # Create a simple high-pass filter for vocals (not accurate but for demonstration)
        vocals = audio.high_pass_filter(1000)
        
        # Create a simple low-pass filter for accompaniment
        accompaniment = audio.low_pass_filter(1000)
        
        # Save the stems
        vocals.export(os.path.join(output_dir, "vocals.wav"), format="wav")
        accompaniment.export(os.path.join(output_dir, "no_vocals.wav"), format="wav")
        
    except Exception as e:
        logger.error(f"Error creating dummy stems: {str(e)}", exc_info=True)

def analyze_remix_prompt(prompt):
    """
    Analyze the remix prompt to determine the target style
    
    Args:
        prompt: Text description of the desired remix style
        
    Returns:
        Dictionary of remix style parameters
    """
    # Default style parameters
    style = {
        "genre": "electronic",
        "tempo_factor": 1.0,
        "effects": {
            "reverb": 0.3,
            "delay": 0.2,
            "distortion": 0.0,
            "filter": 0.0
        },
        "vocal_processing": "normal",
        "beat_style": "four_on_floor",
        "energy": "medium"
    }
    
    # Extract genre
    genre_patterns = {
        r'\b(edm|electronic|electro)\b': "electronic",
        r'\b(house|deep house|tech house)\b': "house",
        r'\b(techno)\b': "techno",
        r'\b(trance)\b': "trance",
        r'\b(drum and bass|dnb|d&b)\b': "drum_and_bass",
        r'\b(dubstep)\b': "dubstep",
        r'\b(trap)\b': "trap",
        r'\b(hip hop|hip-hop)\b': "hip_hop",
        r'\b(lo-fi|lofi)\b': "lo_fi",
        r'\b(ambient)\b': "ambient",
        r'\b(rock)\b': "rock",
        r'\b(pop)\b': "pop",
        r'\b(80s|eighties)\b': "eighties",
        r'\b(90s|nineties)\b': "nineties",
        r'\b(synthwave)\b': "synthwave"
    }
    
    for pattern, genre in genre_patterns.items():
        if re.search(pattern, prompt.lower()):
            style["genre"] = genre
            break
    
    # Extract tempo changes
    if re.search(r'\b(faster|speed up|uptempo|high tempo|fast)\b', prompt.lower()):
        style["tempo_factor"] = 1.25
    elif re.search(r'\b(slower|slow down|downtempo|low tempo|slow)\b', prompt.lower()):
        style["tempo_factor"] = 0.8
    
    # Extract effects
    if re.search(r'\b(reverb|echo|spacey|atmospheric|dreamy)\b', prompt.lower()):
        style["effects"]["reverb"] = 0.7
    
    if re.search(r'\b(delay|echo)\b', prompt.lower()):
        style["effects"]["delay"] = 0.5
    
    if re.search(r'\b(distortion|gritty|dirty|fuzzy)\b', prompt.lower()):
        style["effects"]["distortion"] = 0.6
    
    if re.search(r'\b(filter|filtered|sweep)\b', prompt.lower()):
        style["effects"]["filter"] = 0.6
    
    # Extract vocal processing
    if re.search(r'\b(vocoder|robotic vocals|auto-tune|autotune)\b', prompt.lower()):
        style["vocal_processing"] = "vocoder"
    elif re.search(r'\b(chopped vocals|chop|stuttered)\b', prompt.lower()):
        style["vocal_processing"] = "chopped"
    elif re.search(r'\b(pitched vocals|pitch shift)\b', prompt.lower()):
        style["vocal_processing"] = "pitched"
    
    # Extract beat style
    if style["genre"] in ["house", "techno", "electronic"]:
        style["beat_style"] = "four_on_floor"
    elif style["genre"] in ["drum_and_bass", "breakbeat"]:
        style["beat_style"] = "breakbeat"
    elif style["genre"] in ["trap", "hip_hop"]:
        style["beat_style"] = "trap"
    elif style["genre"] in ["lo_fi"]:
        style["beat_style"] = "lo_fi"
    
    # Extract energy level
    if re.search(r'\b(energetic|high energy|powerful|intense)\b', prompt.lower()):
        style["energy"] = "high"
    elif re.search(r'\b(chill|relaxed|calm|low energy)\b', prompt.lower()):
        style["energy"] = "low"
    
    return style

def process_stems(stems_dir, remix_style, audio_features):
    """
    Process each stem according to the remix style
    
    Args:
        stems_dir: Directory containing the stems
        remix_style: Dictionary of remix style parameters
        audio_features: Dictionary of detected audio features
        
    Returns:
        Dictionary of paths to processed stems
    """
    logger.info(f"Processing stems: {stems_dir}")
    
    processed_stems = {}
    temp_dir = os.path.dirname(stems_dir)
    
    # Expected stem files from Demucs
    stem_files = {
        "vocals": os.path.join(stems_dir, "vocals.wav"),
        "no_vocals": os.path.join(stems_dir, "no_vocals.wav"),
        # If using the full Demucs separation, you'd have these instead:
        # "drums": os.path.join(stems_dir, "drums.wav"),
        # "bass": os.path.join(stems_dir, "bass.wav"),
        # "other": os.path.join(stems_dir, "other.wav"),
    }
    
    # Process vocals
    if os.path.exists(stem_files["vocals"]):
        processed_stems["vocals"] = process_vocals(
            stem_files["vocals"], 
            os.path.join(temp_dir, "processed_vocals.wav"),
            remix_style
        )
    
    # Process instrumental (no_vocals)
    if os.path.exists(stem_files["no_vocals"]):
        processed_stems["instrumental"] = process_instrumental(
            stem_files["no_vocals"],
            os.path.join(temp_dir, "processed_instrumental.wav"),
            remix_style,
            audio_features
        )
    
    # If we have the full stem separation, process each stem
    for stem in ["drums", "bass", "other"]:
        if os.path.exists(os.path.join(stems_dir, f"{stem}.wav")):
            processed_stems[stem] = process_stem(
                os.path.join(stems_dir, f"{stem}.wav"),
                os.path.join(temp_dir, f"processed_{stem}.wav"),
                stem,
                remix_style
            )
    
    logger.info(f"Stems processed: {processed_stems}")
    return processed_stems

def process_vocals(input_path, output_path, remix_style):
    """
    Process vocals according to the remix style
    
    Args:
        input_path: Path to the vocals stem
        output_path: Path to save the processed vocals
        remix_style: Dictionary of remix style parameters
        
    Returns:
        Path to the processed vocals
    """
    try:
        # Load the vocals
        vocals = AudioSegment.from_file(input_path)
        
        # Apply processing based on the style
        if remix_style["vocal_processing"] == "vocoder":
            # Simulate vocoder effect with pitch shifting and distortion
            vocals = vocals.high_pass_filter(200)
            vocals = vocals.low_pass_filter(5000)
            
            # Add slight distortion
            vocals = vocals + vocals.overlay(vocals.high_pass_filter(1000).gain(10))
            
        elif remix_style["vocal_processing"] == "chopped":
            # Simulate chopped vocals by creating a stuttering effect
            chopped = AudioSegment.empty()
            chunk_size = 200  # milliseconds
            
            for i in range(0, len(vocals), chunk_size):
                chunk = vocals[i:i+chunk_size]
                
                # Randomly repeat some chunks
                if np.random.random() < 0.3:
                    chopped += chunk
                    chopped += chunk
                else:
                    chopped += chunk
            
            vocals = chopped
            
        elif remix_style["vocal_processing"] == "pitched":
            # For pitched vocals, we'd ideally use a proper pitch shifting library
            # This is a simplified approach
            vocals = vocals.high_pass_filter(300)
        
        # Apply reverb based on style
        reverb_amount = remix_style["effects"]["reverb"]
        if reverb_amount > 0:
            # Simulate reverb by adding delayed copies with decreasing volume
            reverb = vocals.fade_out(2000)
            reverb = reverb - 6  # Reduce volume
            
            # Mix with original
            vocals = vocals.overlay(reverb, position=100)
        
        # Apply delay based on style
        delay_amount = remix_style["effects"]["delay"]
        if delay_amount > 0:
            # Create a delayed copy
            delay_time = 300  # milliseconds
            delay = vocals - 10  # Reduce volume
            
            # Add multiple delays
            delayed_vocals = vocals
            for i in range(1, 4):
                delayed_vocals = delayed_vocals.overlay(
                    delay, 
                    position=delay_time * i
                )
            
            vocals = delayed_vocals
        
        # Export the processed vocals
        vocals.export(output_path, format="wav")
        return output_path
        
    except Exception as e:
        logger.error(f"Error processing vocals: {str(e)}", exc_info=True)
        # If processing fails, return the original file
        return input_path

def process_instrumental(input_path, output_path, remix_style, audio_features):
    """
    Process instrumental according to the remix style
    
    Args:
        input_path: Path to the instrumental stem
        output_path: Path to save the processed instrumental
        remix_style: Dictionary of remix style parameters
        audio_features: Dictionary of detected audio features
        
    Returns:
        Path to the processed instrumental
    """
    try:
        # Load the instrumental
        instrumental = AudioSegment.from_file(input_path)
        
        # Adjust tempo if needed
        if remix_style["tempo_factor"] != 1.0:
            # For proper tempo adjustment, we'd use a time-stretching algorithm
            # This is a simplified approach that changes pitch as well
            tempo_factor = remix_style["tempo_factor"]
            instrumental = instrumental._spawn(instrumental.raw_data, overrides={
                "frame_rate": int(instrumental.frame_rate * tempo_factor)
            })
            instrumental = instrumental.set_frame_rate(44100)
        
        # Apply genre-specific processing
        if remix_style["genre"] in ["house", "techno", "electronic"]:
            # Add a four-on-the-floor kick drum
            instrumental = add_four_on_the_floor(instrumental, audio_features["tempo"])
            
        elif remix_style["genre"] in ["drum_and_bass", "breakbeat"]:
            # Add breakbeat drums
            instrumental = add_breakbeat(instrumental, audio_features["tempo"])
            
        elif remix_style["genre"] in ["lo_fi"]:
            # Add lo-fi effects
            instrumental = add_lofi_effects(instrumental)
        
        # Apply filter effects
        filter_amount = remix_style["effects"]["filter"]
        if filter_amount > 0:
            # Apply a low-pass filter that gradually opens up
            filtered = instrumental.low_pass_filter(500)
            
            # Gradually blend from filtered to unfiltered
            segments = []
            segment_length = len(instrumental) // 8
            
            for i in range(8):
                blend_ratio = min(1.0, i / 4)  # Gradually increase the blend ratio
                segment_start = i * segment_length
                segment_end = (i + 1) * segment_length
                
                filtered_segment = filtered[segment_start:segment_end]
                unfiltered_segment = instrumental[segment_start:segment_end]
                
                # Blend the segments
                if blend_ratio < 1.0:
                    blended = filtered_segment * (1 - blend_ratio) + unfiltered_segment * blend_ratio
                else:
                    blended = unfiltered_segment
                
                segments.append(blended)
            
            # Combine the segments
            instrumental = segments[0]
            for segment in segments[1:]:
                instrumental += segment
        
        # Export the processed instrumental
        instrumental.export(output_path, format="wav")
        return output_path
        
    except Exception as e:
        logger.error(f"Error processing instrumental: {str(e)}", exc_info=True)
        # If processing fails, return the original file
        return input_path

def process_stem(input_path, output_path, stem_type, remix_style):
    """
    Process an individual stem according to the remix style
    
    Args:
        input_path: Path to the stem
        output_path: Path to save the processed stem
        stem_type: Type of stem (drums, bass, other)
        remix_style: Dictionary of remix style parameters
        
    Returns:
        Path to the processed stem
    """
    try:
        # Load the stem
        stem = AudioSegment.from_file(input_path)
        
        # Apply processing based on stem type and style
        if stem_type == "drums":
            # Process drums based on genre
            if remix_style["genre"] in ["house", "techno"]:
                # Enhance kick and add compression
                stem = stem.low_shelf(frequency=100, gain=4.0)
                
            elif remix_style["genre"] in ["drum_and_bass"]:
                # Enhance snare and high frequencies
                stem = stem.high_shelf(frequency=2000, gain=3.0)
                
            elif remix_style["genre"] in ["lo_fi"]:
                # Add vinyl noise and compression
                stem = add_lofi_effects(stem)
        
        elif stem_type == "bass":
            # Process bass based on genre
            if remix_style["genre"] in ["house", "techno", "electronic"]:
                # Enhance low end
                stem = stem.low_shelf(frequency=80, gain=3.0)
                
            elif remix_style["genre"] in ["drum_and_bass"]:
                # Add distortion for more presence
                stem = stem + stem.high_pass_filter(200).gain(6)
        
        elif stem_type == "other":
            # Process other elements (melodic content)
            if remix_style["effects"]["reverb"] > 0.5:
                # Add reverb
                reverb = stem.fade_out(2000)
                reverb = reverb - 6
                stem = stem.overlay(reverb, position=100)
        
        # Export the processed stem
        stem.export(output_path, format="wav")
        return output_path
        
    except Exception as e:
        logger.error(f"Error processing stem {stem_type}: {str(e)}", exc_info=True)
        # If processing fails, return the original file
        return input_path

def add_four_on_the_floor(audio, tempo):
    """
    Add a four-on-the-floor kick drum pattern
    
    Args:
        audio: AudioSegment to process
        tempo: Tempo in BPM
        
    Returns:
        Processed AudioSegment
    """
    try:
        # Create a kick drum sound
        sample_rate = 44100
        duration_ms = 100
        t = np.linspace(0, duration_ms / 1000, int(sample_rate * duration_ms / 1000))
        
        # Simple sine wave with exponential decay
        frequency = 60
        amplitude = 0.5
        kick = amplitude * np.sin(2 * np.pi * frequency * t) * np.exp(-12 * t)
        
        # Convert to AudioSegment
        kick_segment = AudioSegment(
            kick.astype(np.float32).tobytes(),
            frame_rate=sample_rate,
            sample_width=4,
            channels=1
        )
        
        # Normalize and convert to stereo
        kick_segment = kick_segment.normalize()
        kick_segment = kick_segment.set_channels(2)
        
        # Calculate beat interval in milliseconds
        beat_ms = 60000 / tempo
        
        # Create a four-on-the-floor pattern
        pattern = AudioSegment.empty()
        num_beats = int(len(audio) / beat_ms) + 1
        
        for i in range(num_beats):
            pattern = pattern.overlay(kick_segment, position=int(i * beat_ms))
        
        # Mix with the original audio
        return audio.overlay(pattern - 6)  # Reduce kick volume
        
    except Exception as e:
        logger.error(f"Error adding four-on-the-floor: {str(e)}", exc_info=True)
        return audio

def add_breakbeat(audio, tempo):
    """
    Add a breakbeat drum pattern
    
    Args:
        audio: AudioSegment to process
        tempo: Tempo in BPM
        
    Returns:
        Processed AudioSegment
    """
    try:
        # In a real implementation, this would load a breakbeat sample
        # For simplicity, we'll create a basic pattern
        
        # Create kick and snare sounds
        sample_rate = 44100
        
        # Kick
        kick_duration_ms = 100
        t_kick = np.linspace(0, kick_duration_ms / 1000, int(sample_rate * kick_duration_ms / 1000))
        frequency_kick = 60
        kick = 0.5 * np.sin(2 * np.pi * frequency_kick * t_kick) * np.exp(-12 * t_kick)
        
        # Snare
        snare_duration_ms = 100
        t_snare = np.linspace(0, snare_duration_ms / 1000, int(sample_rate * snare_duration_ms / 1000))
        frequency_snare = 180
        snare = 0.3 * np.sin(2 * np.pi * frequency_snare * t_snare) * np.exp(-8 * t_snare)
        snare += 0.2 * np.random.normal(0, 1, len(t_snare))  # Add noise
        
        # Convert to AudioSegments
        kick_segment = AudioSegment(
            kick.astype(np.float32).tobytes(),
            frame_rate=sample_rate,
            sample_width=4,
            channels=1
        ).normalize().set_channels(2)
        
        snare_segment = AudioSegment(
            snare.astype(np.float32).tobytes(),
            frame_rate=sample_rate,
            sample_width=4,
            channels=1
        ).normalize().set_channels(2)
        
        # Calculate beat interval in milliseconds
        beat_ms = 60000 / tempo
        
        # Create a breakbeat pattern (kick on 1 and 3, snare on 2 and 4)
        pattern = AudioSegment.empty()
        num_bars = int(len(audio) / (4 * beat_ms)) + 1
        
        for bar in range(num_bars):
            bar_position = bar * 4 * beat_ms
            
            # Basic pattern: kick, snare, kick, snare
            pattern = pattern.overlay(kick_segment, position=int(bar_position))
            pattern = pattern.overlay(snare_segment, position=int(bar_position + beat_ms))
            pattern = pattern.overlay(kick_segment, position=int(bar_position + 2 * beat_ms))
            pattern = pattern.overlay(snare_segment, position=int(bar_position + 3 * beat_ms))
            
            # Add some variations for a more realistic breakbeat
            if bar % 2 == 1:  # Every other bar
                pattern = pattern.overlay(kick_segment, position=int(bar_position + 1.5 * beat_ms))
                pattern = pattern.overlay(kick_segment, position=int(bar_position + 3.5 * beat_ms))
        
        # Mix with the original audio
        return audio.overlay(pattern - 8)  # Reduce drum volume
        
    except Exception as e:
        logger.error(f"Error adding breakbeat: {str(e)}", exc_info=True)
        return audio

def add_lofi_effects(audio):
    """
    Add lo-fi effects (vinyl noise, bit crushing, etc.)
    
    Args:
        audio: AudioSegment to process
        
    Returns:
        Processed AudioSegment
    """
    try:
        # Add vinyl noise
        sample_rate = 44100
        duration_ms = len(audio)
        t = np.linspace(0, duration_ms / 1000, int(sample_rate * duration_ms / 1000))
        
        # Generate noise
        noise = 0.03 * np.random.normal(0, 1, len(t))
        
        # Convert to AudioSegment
        noise_segment = AudioSegment(
            noise.astype(np.float32).tobytes(),
            frame_rate=sample_rate,
            sample_width=4,
            channels=1
        )
        
        # Convert to stereo
        noise_segment = noise_segment.set_channels(2)
        
        # Apply a low-pass filter to the original audio
        filtered_audio = audio.low_pass_filter(3500)
        
        # Apply a high-pass filter to remove sub-bass
        filtered_audio = filtered_audio.high_pass_filter(60)
        
        # Mix with noise
        lofi_audio = filtered_audio.overlay(noise_segment - 12)
        
        # Simulate bit crushing by reducing dynamic range
        # In a real implementation, we'd use a proper bit crusher
        # This is a simplified approach
        lofi_audio = lofi_audio.compress_dynamic_range(threshold=-20, ratio=4.0)
        
        return lofi_audio
        
    except Exception as e:
        logger.error(f"Error adding lo-fi effects: {str(e)}", exc_info=True)
        return audio

def mix_stems(stems, output_path, remix_style):
    """
    Mix the processed stems
    
    Args:
        stems: Dictionary of paths to processed stems
        output_path: Path to save the mixed output
        remix_style: Dictionary of remix style parameters
        
    Returns:
        Path to the mixed output
    """
    try:
        # Start with an empty mix
        mix = None
        
        # Set stem volumes based on style
        volumes = {
            "vocals": 0,
            "instrumental": -3,
            "drums": -3,
            "bass": -6,
            "other": -6
        }
        
        # Adjust volumes based on genre
        if remix_style["genre"] in ["house", "techno", "electronic"]:
            volumes["drums"] = 0
            volumes["bass"] = -3
        elif remix_style["genre"] in ["hip_hop", "trap"]:
            volumes["bass"] = 0
            volumes["drums"] = -1
        elif remix_style["genre"] in ["lo_fi"]:
            volumes["drums"] = -2
            volumes["other"] = -3
        
        # Mix the stems
        for stem_type, stem_path in stems.items():
            stem_audio = AudioSegment.from_file(stem_path)
            
            # Apply volume adjustment
            if stem_type in volumes:
                stem_audio = stem_audio + volumes[stem_type]
            
            # Add to the mix
            if mix is None:
                mix = stem_audio
            else:
                mix = mix.overlay(stem_audio)
        
        # If we don't have any stems, use the instrumental
        if mix is None and "instrumental" in stems:
            mix = AudioSegment.from_file(stems["instrumental"])
        
        # Apply final processing
        if mix is not None:
            # Normalize
            mix = mix.normalize()
            
            # Apply compression
            mix = mix.compress_dynamic_range(threshold=-20, ratio=4.0)
            
            # Export the final mix
            mix.export(output_path, format="wav")
            return output_path
        else:
            logger.error("No stems available for mixing")
            return None
        
    except Exception as e:
        logger.error(f"Error mixing stems: {str(e)}", exc_info=True)
        # If mixing fails, return the first available stem
        for stem_path in stems.values():
            return stem_path
        return None
