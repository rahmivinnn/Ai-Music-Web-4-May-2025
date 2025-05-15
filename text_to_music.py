import os
import logging
import tempfile
import subprocess
import numpy as np
import json
import re
from pydub import AudioSegment
import random

logger = logging.getLogger(__name__)

def generate_music_from_text(prompt, duration=180):
    """
    Generate music from a text prompt
    
    Args:
        prompt: Text description of the desired music
        duration: Maximum duration in seconds (default: 180)
        
    Returns:
        Path to the generated music
    """
    logger.info(f"Generating music from text: {prompt}")
    logger.info(f"Requested duration: {duration} seconds")
    
    try:
        # Parse the prompt to extract musical parameters
        music_params = parse_music_prompt(prompt)
        logger.info(f"Parsed music parameters: {json.dumps(music_params)}")
        
        # Create a temporary directory for generated files
        temp_dir = tempfile.mkdtemp()
        
        # Generate the music
        music_path = os.path.join(temp_dir, "generated_music.wav")
        
        # In a real implementation, you would use a music generation model
        # For now, we'll create a simple composition based on the parameters
        create_composition(music_path, music_params, duration)
        
        logger.info(f"Music generated: {music_path}")
        return music_path
        
    except Exception as e:
        logger.error(f"Error generating music: {str(e)}", exc_info=True)
        
        # If generation fails, return a sample file
        return get_sample_music_file(prompt)

def parse_music_prompt(prompt):
    """
    Parse the text prompt to extract musical parameters
    
    Args:
        prompt: Text description of the desired music
        
    Returns:
        Dictionary of musical parameters
    """
    # Default parameters
    params = {
        "genre": "pop",
        "tempo": 120,
        "key": "C",
        "mode": "major",
        "instruments": ["piano", "drums", "bass"],
        "mood": "neutral",
        "has_vocals": False,
        "lyrics": "",
        "vocal_gender": "female",
        "structure": ["intro", "verse", "chorus", "verse", "chorus", "outro"],
        "effects": {
            "reverb": 0.3,
            "delay": 0.2,
            "compression": 0.5
        }
    }
    
    # Extract genre
    genre_patterns = {
        r'\b(pop|popular)\b': "pop",
        r'\b(rock)\b': "rock",
        r'\b(hip hop|hip-hop|rap)\b': "hip_hop",
        r'\b(r&b|rnb|rhythm and blues)\b': "rnb",
        r'\b(edm|electronic|electro)\b': "electronic",
        r'\b(house)\b': "house",
        r'\b(techno)\b': "techno",
        r'\b(trance)\b': "trance",
        r'\b(drum and bass|dnb|d&b)\b': "drum_and_bass",
        r'\b(dubstep)\b': "dubstep",
        r'\b(trap)\b': "trap",
        r'\b(lo-fi|lofi)\b': "lo_fi",
        r'\b(ambient)\b': "ambient",
        r'\b(jazz)\b': "jazz",
        r'\b(blues)\b': "blues",
        r'\b(country)\b': "country",
        r'\b(folk)\b': "folk",
        r'\b(classical)\b': "classical",
        r'\b(orchestral)\b': "orchestral",
        r'\b(cinematic)\b': "cinematic",
        r'\b(ballad)\b': "ballad"
    }
    
    for pattern, genre in genre_patterns.items():
        if re.search(pattern, prompt.lower()):
            params["genre"] = genre
            break
    
    # Extract tempo
    tempo_match = re.search(r'(\d+)\s*bpm', prompt.lower())
    if tempo_match:
        params["tempo"] = int(tempo_match.group(1))
    else:
        # Estimate tempo from descriptive words
        if re.search(r'\b(slow|downtempo|relaxed|calm)\b', prompt.lower()):
            params["tempo"] = random.randint(60, 80)
        elif re.search(r'\b(medium|moderate|mid-tempo)\b', prompt.lower()):
            params["tempo"] = random.randint(90, 110)
        elif re.search(r'\b(fast|uptempo|energetic|quick)\b', prompt.lower()):
            params["tempo"] = random.randint(120, 140)
        elif re.search(r'\b(very fast|rapid|intense)\b', prompt.lower()):
            params["tempo"] = random.randint(140, 180)
    
    # Extract key
    key_match = re.search(r'\b([ABCDEFG][#b]?)\s*(major|minor)\b', prompt.lower())
    if key_match:
        params["key"] = key_match.group(1)
        params["mode"] = key_match.group(2)
    
    # Extract instruments
    instrument_patterns = {
        r'\b(piano)\b': "piano",
        r'\b(guitar|acoustic guitar)\b': "guitar",
        r'\b(electric guitar)\b': "electric_guitar",
        r'\b(bass|bass guitar)\b': "bass",
        r'\b(drums|drum kit|percussion)\b': "drums",
        r'\b(strings|string section|violin|cello)\b': "strings",
        r'\b(synth|synthesizer)\b': "synth",
        r'\b(pad|synth pad)\b': "pad",
        r'\b(brass|trumpet|horn|trombone)\b': "brass",
        r'\b(sax|saxophone)\b': "saxophone",
        r'\b(flute)\b': "flute",
        r'\b(organ)\b': "organ",
        r'\b(choir|choral)\b': "choir"
    }
    
    instruments = []
    for pattern, instrument in instrument_patterns.items():
        if re.search(pattern, prompt.lower()):
            instruments.append(instrument)
    
    if instruments:
        params["instruments"] = instruments
    
    # Extract mood
    mood_patterns = {
        r'\b(happy|joyful|upbeat|cheerful)\b': "happy",
        r'\b(sad|melancholic|somber|depressing)\b': "sad",
        r'\b(angry|aggressive|intense)\b': "angry",
        r'\b(calm|peaceful|relaxed|chill)\b': "calm",
        r'\b(dreamy|ethereal|atmospheric)\b': "dreamy",
        r'\b(dark|ominous|scary|horror)\b': "dark",
        r'\b(epic|grand|majestic)\b': "epic",
        r'\b(romantic|love|emotional)\b': "romantic",
        r'\b(nostalgic|retro|vintage)\b': "nostalgic"
    }
    
    for pattern, mood in mood_patterns.items():
        if re.search(pattern, prompt.lower()):
            params["mood"] = mood
            break
    
    # Check for vocals
    if re.search(r'\b(vocals|vocal|singing|singer|voice|lyrics)\b', prompt.lower()):
        params["has_vocals"] = True
        
        # Extract vocal gender
        if re.search(r'\b(male|man|guy|boy|masculine)\b', prompt.lower()):
            params["vocal_gender"] = "male"
        elif re.search(r'\b(female|woman|girl|feminine)\b', prompt.lower()):
            params["vocal_gender"] = "female"
        
        # Extract lyrics if they're in quotes
        lyrics_match = re.search(r'"([^"]*)"', prompt)
        if lyrics_match:
            params["lyrics"] = lyrics_match.group(1)
        else:
            # Try to extract a theme for the lyrics
            theme_match = re.search(r'about\s+([^,.]+)', prompt.lower())
            if theme_match:
                params["lyrics_theme"] = theme_match.group(1)
    
    # Extract effects
    if re.search(r'\b(reverb|echo|spacey|atmospheric)\b', prompt.lower()):
        params["effects"]["reverb"] = 0.7
    
    if re.search(r'\b(delay|echo)\b', prompt.lower()):
        params["effects"]["delay"] = 0.5
    
    return params

def create_composition(output_path, params, duration):
    """
    Create a musical composition based on the parameters
    
    Args:
        output_path: Path to save the composition
        params: Dictionary of musical parameters
        duration: Maximum duration in seconds
        
    Returns:
        Path to the created composition
    """
    try:
        # In a real implementation, you would use a music generation model
        # For now, we'll create a simple composition using synthesized sounds
        
        # Calculate section durations
        section_count = len(params["structure"])
        section_duration = min(30, duration / section_count)  # Max 30 seconds per section
        
        # Create an empty composition
        composition = AudioSegment.empty()
        
        # Generate each section
        for section in params["structure"]:
            section_audio = generate_section(section, params, section_duration)
            composition += section_audio
            
            # Check if we've reached the maximum duration
            if len(composition) > duration * 1000:
                composition = composition[:duration * 1000]
                break
        
        # Apply effects
        composition = apply_effects(composition, params["effects"])
        
        # Export the composition
        composition.export(output_path, format="wav")
        return output_path
        
    except Exception as e:
        logger.error(f"Error creating composition: {str(e)}", exc_info=True)
        return get_sample_music_file(json.dumps(params))

def generate_section(section_type, params, duration):
    """
    Generate a section of music
    
    Args:
        section_type: Type of section (intro, verse, chorus, etc.)
        params: Dictionary of musical parameters
        duration: Duration of the section in seconds
        
    Returns:
        AudioSegment for the section
    """
    try:
        # Create a temporary directory for section files
        temp_dir = tempfile.mkdtemp()
        section_path = os.path.join(temp_dir, f"{section_type}.wav")
        
        # In a real implementation, you would use a music generation model
        # For now, we'll create a simple section using synthesized sounds
        
        # Create a basic drum pattern
        tempo = params["tempo"]
        beat_duration = 60 / tempo  # Duration of one beat in seconds
        beats_per_bar = 4
        bars = int(duration / (beat_duration * beats_per_bar)) + 1
        
        # Create a numpy array for the audio data
        sample_rate = 44100
        total_samples = int(duration * sample_rate)
        audio_data = np.zeros(total_samples)
        
        # Add a simple drum pattern
        if "drums" in params["instruments"]:
            drum_pattern = create_drum_pattern(section_type, params["genre"], tempo, bars)
            drum_samples = min(len(drum_pattern), total_samples)
            audio_data[:drum_samples] += drum_pattern[:drum_samples] * 0.5
        
        # Add a bass line
        if "bass" in params["instruments"]:
            bass_line = create_bass_line(section_type, params["key"], params["mode"], tempo, bars)
            bass_samples = min(len(bass_line), total_samples)
            audio_data[:bass_samples] += bass_line[:bass_samples] * 0.4
        
        # Add a melody
        if section_type in ["intro", "verse", "chorus", "bridge"]:
            melody_instrument = next((i for i in params["instruments"] if i not in ["drums", "bass"]), "piano")
            melody = create_melody(section_type, params["key"], params["mode"], tempo, bars, melody_instrument)
            melody_samples = min(len(melody), total_samples)
            audio_data[:melody_samples] += melody[:melody_samples] * 0.6
        
        # Convert to AudioSegment
        audio_segment = AudioSegment(
            audio_data.astype(np.float32).tobytes(),
            frame_rate=sample_rate,
            sample_width=4,
            channels=1
        )
        
        # Convert to stereo
        audio_segment = audio_segment.set_channels(2)
        
        # Normalize
        audio_segment = audio_segment.normalize()
        
        return audio_segment
        
    except Exception as e:
        logger.error(f"Error generating section {section_type}: {str(e)}", exc_info=True)
        # Return silence if generation fails
        return AudioSegment.silent(duration=int(duration * 1000))

def create_drum_pattern(section_type, genre, tempo, bars):
    """
    Create a drum pattern
    
    Args:
        section_type: Type of section (intro, verse, chorus, etc.)
        genre: Music genre
        tempo: Tempo in BPM
        bars: Number of bars
        
    Returns:
        Numpy array with the drum pattern
    """
    # In a real implementation, you would use a drum pattern generator
    # For now, we'll create a simple pattern
    
    sample_rate = 44100
    beat_duration = 60 / tempo  # Duration of one beat in seconds
    beats_per_bar = 4
    total_beats = bars * beats_per_bar
    total_samples = int(total_beats * beat_duration * sample_rate)
    
    # Create an empty pattern
    pattern = np.zeros(total_samples)
    
    # Create kick and snare sounds
    kick = create_kick_drum(sample_rate)
    snare = create_snare_drum(sample_rate)
    hihat = create_hihat(sample_rate)
    
    # Place drums according to genre and section
    for bar in range(bars):
        for beat in range(beats_per_bar):
            beat_position = int((bar * beats_per_bar + beat) * beat_duration * sample_rate)
            
            # Kick on beats 1 and 3 for most genres
            if beat == 0 or (beat == 2 and genre not in ["hip_hop", "trap"]):
                kick_end = min(beat_position + len(kick), total_samples)
                pattern[beat_position:kick_end] += kick[:kick_end - beat_position]
            
            # Snare on beats 2 and 4 for most genres
            if beat == 1 or beat == 3:
                snare_end = min(beat_position + len(snare), total_samples)
                pattern[beat_position:snare_end] += snare[:snare_end - beat_position]
            
            # Hi-hats on every 8th note
            for eighth in range(2):
                eighth_position = beat_position + int(eighth * 0.5 * beat_duration * sample_rate)
                hihat_end = min(eighth_position + len(hihat), total_samples)
                pattern[eighth_position:hihat_end] += hihat[:hihat_end - eighth_position] * 0.7
    
    return pattern

def create_kick_drum(sample_rate):
    """Create a kick drum sound"""
    duration = 0.1  # seconds
    t = np.linspace(0, duration, int(sample_rate * duration))
    
    # Sine wave with exponential decay
    frequency = 60
    amplitude = 0.8
    kick = amplitude * np.sin(2 * np.pi * frequency * t) * np.exp(-20 * t)
    
    return kick

def create_snare_drum(sample_rate):
    """Create a snare drum sound"""
    duration = 0.1  # seconds
    t = np.linspace(0, duration, int(sample_rate * duration))
    
    # Sine wave with noise
    frequency = 180
    amplitude = 0.6
    snare = amplitude * np.sin(2 * np.pi * frequency * t) * np.exp(-20 * t)
    snare += 0.4 * np.random.normal(0, 1, len(t)) * np.exp(-10 * t)
    
    return snare

def create_hihat(sample_rate):
    """Create a hi-hat sound"""
    duration = 0.05  # seconds
    t = np.linspace(0, duration, int(sample_rate * duration))
    
    # White noise with exponential decay
    amplitude = 0.3
    hihat = amplitude * np.random.normal(0, 1, len(t)) * np.exp(-50 * t)
    
    return hihat

def create_bass_line(section_type, key, mode, tempo, bars):
    """
    Create a bass line
    
    Args:
        section_type: Type of section (intro, verse, chorus, etc.)
        key: Musical key
        mode: Major or minor
        tempo: Tempo in BPM
        bars: Number of bars
        
    Returns:
        Numpy array with the bass line
    """
    # In a real implementation, you would use a bass line generator
    # For now, we'll create a simple pattern
    
    sample_rate = 44100
    beat_duration = 60 / tempo  # Duration of one beat in seconds
    beats_per_bar = 4
    total_beats = bars * beats_per_bar
    total_samples = int(total_beats * beat_duration * sample_rate)
    
    # Create an empty pattern
    pattern = np.zeros(total_samples)
    
    # Define the root note frequency based on the key
    key_to_frequency = {
        "C": 65.41, "C#": 69.30, "Db": 69.30, "D": 73.42, "D#": 77.78, "Eb": 77.78,
        "E": 82.41, "F": 87.31, "F#": 92.50, "Gb": 92.50, "G": 98.00, "G#": 103.83,
        "Ab": 103.83, "A": 110.00, "A#": 116.54, "Bb": 116.54, "B": 123.47
    }
    
    root_freq = key_to_frequency.get(key, 65.41)  # Default to C if key not found
    
    # Define scale degrees based on mode
    if mode.lower() == "major":
        scale_degrees = [0, 2, 4, 5, 7, 9, 11]  # Major scale
    else:
        scale_degrees = [0, 2, 3, 5, 7, 8, 10]  # Natural minor scale
    
    # Create a simple bass pattern
    for bar in range(bars):
        # Choose a note from the scale
        if section_type == "intro":
            note_index = 0  # Root note for intro
        elif section_type == "verse":
            note_index = bar % len(scale_degrees)  # Cycle through scale
        elif section_type == "chorus":
            note_index = [0, 3, 4, 0][bar % 4]  # I-IV-V-I progression
        else:
            note_index = [0, 5, 3, 4][bar % 4]  # I-VI-IV-V progression
        
        # Get the frequency for this note
        note_freq = root_freq * 2 ** (scale_degrees[note_index] / 12)
        
        # Create the bass note
        for beat in range(beats_per_bar):
            beat_position = int((bar * beats_per_bar + beat) * beat_duration * sample_rate)
            
            # Create a bass note
            note_duration = beat_duration * 0.8  # Slightly shorter than a beat
            t = np.linspace(0, note_duration, int(sample_rate * note_duration))
            
            # Sine wave with exponential decay
            amplitude = 0.6
            bass_note = amplitude * np.sin(2 * np.pi * note_freq * t) * np.exp(-5 * t)
            
            # Add to pattern
            note_end = min(beat_position + len(bass_note), total_samples)
            pattern[beat_position:note_end] += bass_note[:note_end - beat_position]
    
    return pattern

def create_melody(section_type, key, mode, tempo, bars, instrument):
    """
    Create a melody
    
    Args:
        section_type: Type of section (intro, verse, chorus, etc.)
        key: Musical key
        mode: Major or minor
        tempo: Tempo in BPM
        bars: Number of bars
        instrument: Instrument to use
        
    Returns:
        Numpy array with the melody
    """
    # In a real implementation, you would use a melody generator
    # For now, we'll create a simple pattern
    
    sample_rate = 44100
    beat_duration = 60 / tempo  # Duration of one beat in seconds
    beats_per_bar = 4
    total_beats = bars * beats_per_bar
    total_samples = int(total_beats * beat_duration * sample_rate)
    
    # Create an empty pattern
    pattern = np.zeros(total_samples)
    
    # Define the root note frequency based on the key (one octave higher for melody)
    key_to_frequency = {
        "C": 130.81, "C#": 138.59, "Db": 138.59, "D": 146.83, "D#": 155.56, "Eb": 155.56,
        "E": 164.81, "F": 174.61, "F#": 185.00, "Gb": 185.00, "G": 196.00, "G#": 207.65,
        "Ab": 207.65, "A": 220.00, "A#": 233.08, "Bb": 233.08, "B": 246.94
    }
    
    root_freq = key_to_frequency.get(key, 130.81)  # Default to C if key not found
    
    # Define scale degrees based on mode
    if mode.lower() == "major":
        scale_degrees = [0, 2, 4, 5, 7, 9, 11]  # Major scale
    else:
        scale_degrees = [0, 2, 3, 5, 7, 8, 10]  # Natural minor scale
    
    # Create a simple melody pattern
    for bar in range(bars):
        for beat in range(beats_per_bar):
            # Skip some beats for rhythmic variation
            if random.random() < 0.3:
                continue
            
            beat_position = int((bar * beats_per_bar + beat) * beat_duration * sample_rate)
            
            # Choose a note from the scale
            if section_type == "intro":
                note_index = random.choice([0, 2, 4])  # Arpeggiated chord
            elif section_type == "verse":
                note_index = random.choice(range(len(scale_degrees)))  # Random note from scale
            elif section_type == "chorus":
                # More focused on chord tones for chorus
                note_index = random.choice([0, 2, 4, 6])
            else:
                note_index = random.choice(range(len(scale_degrees)))
            
            # Add some octave variation
            octave = random.choice([0, 0, 0, 1])  # Mostly in the same octave, sometimes higher
            
            # Get the frequency for this note
            note_freq = root_freq * 2 ** (octave + scale_degrees[note_index] / 12)
            
            # Create the melody note
            note_duration = beat_duration * random.choice([0.5, 0.8, 1.0])  # Varied note lengths
            t = np.linspace(0, note_duration, int(sample_rate * note_duration))
            
            # Different waveforms based on instrument
            amplitude = 0.5
            if instrument == "piano":
                # Piano-like sound (sine wave with decay)
                note = amplitude * np.sin(2 * np.pi * note_freq * t) * np.exp(-5 * t)
            elif instrument == "synth":
                # Synth-like sound (sawtooth wave)
                note = amplitude * 0.6 * (2 * (note_freq * t % 1) - 1)
            elif instrument == "pad":
                # Pad-like sound (sine wave with slow attack and decay)
                attack = np.minimum(t / 0.1, 1.0)  # 100ms attack
                note = amplitude * np.sin(2 * np.pi * note_freq * t) * attack * np.exp(-2 * t)
            else:
                # Default to sine wave
                note = amplitude * np.sin(2 * np.pi * note_freq * t)
            
            # Add to pattern
            note_end = min(beat_position + len(note), total_samples)
            pattern[beat_position:note_end] += note[:note_end - beat_position]
    
    return pattern

def apply_effects(audio, effects):
    """
    Apply audio effects
    
    Args:
        audio: AudioSegment to process
        effects: Dictionary of effect parameters
        
    Returns:
        Processed AudioSegment
    """
    try:
        # Apply reverb
        if effects.get("reverb", 0) > 0:
            reverb_amount = effects["reverb"]
            reverb = audio.fade_out(2000)
            reverb = reverb - 6  # Reduce volume
            
            # Mix with original
            audio = audio.overlay(reverb, position=100)
        
        # Apply delay
        if effects.get("delay", 0) > 0:
            delay_amount = effects["delay"]
            delay_time = 300  # milliseconds
            delay = audio - 10  # Reduce volume
            
            # Add multiple delays
            delayed_audio = audio
            for i in range(1, 4):
                delayed_audio = delayed_audio.overlay(
                    delay, 
                    position=delay_time * i
                )
            
            audio = delayed_audio
        
        # Apply compression
        if effects.get("compression", 0) > 0:
            audio = audio.compress_dynamic_range(threshold=-20, ratio=4.0)
        
        return audio
        
    except Exception as e:
        logger.error(f"Error applying effects: {str(e)}", exc_info=True)
        return audio

def get_sample_music_file(prompt):
    """
    Get a sample music file based on the prompt
    
    Args:
        prompt: Text description of the desired music
        
    Returns:
        Path to a sample music file
    """
    # Create a temporary file
    temp_dir = tempfile.mkdtemp()
    sample_path = os.path.join(temp_dir, "sample_music.wav")
    
    # Create a simple sine wave as a placeholder
    sample_rate = 44100
    duration = 30  # seconds
    t = np.linspace(0, duration, int(sample_rate * duration))
    
    # A440 sine wave
    sine = 0.5 * np.sin(2 * np.pi * 440 * t)
    
    # Add some variation
    for i in range(1, 5):
        sine += 0.1 * np.sin(2 * np.pi * (440 * i) * t) * np.exp(-0.1 * i * t)
    
    # Add some noise
    sine += 0.05 * np.random.normal(0, 1, len(t))
    
    # Save as WAV
    try:
        import soundfile as sf
        sf.write(sample_path, sine, sample_rate)
    except ImportError:
        # If soundfile is not available, use a different approach
        audio_segment = AudioSegment(
            sine.astype(np.float32).tobytes(),
            frame_rate=sample_rate,
            sample_width=4,
            channels=1
        )
        audio_segment = audio_segment.set_channels(2)
        audio_segment.export(sample_path, format="wav")
    
    logger.info(f"Created sample music file: {sample_path}")
    return sample_path
