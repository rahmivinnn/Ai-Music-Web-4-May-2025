import requests
import os
import json
import argparse
import time

def test_text_to_audio(base_url, prompt, output_format="mp3", duration=180):
    """
    Test the text-to-audio endpoint
    
    Args:
        base_url: Base URL of the API
        prompt: Text prompt for music generation
        output_format: Output format (mp3 or wav)
        duration: Maximum duration in seconds
    """
    print(f"Testing text-to-audio with prompt: {prompt}")
    
    # Prepare the request
    url = f"{base_url}/text-to-audio"
    data = {
        "prompt": prompt,
        "output_format": output_format,
        "duration": duration
    }
    
    # Send the request
    start_time = time.time()
    response = requests.post(url, json=data)
    
    # Check the response
    if response.status_code == 200:
        result = response.json()
        
        if result.get("success"):
            print(f"Success! Job ID: {result.get('job_id')}")
            print(f"Download URL: {result.get('download_url')}")
            
            # Download the file
            download_url = f"{base_url}{result.get('download_url')}"
            download_response = requests.get(download_url)
            
            if download_response.status_code == 200:
                # Save the file
                filename = result.get('filename', f"generated.{output_format}")
                with open(filename, "wb") as f:
                    f.write(download_response.content)
                
                print(f"Downloaded file: {filename}")
                print(f"File size: {len(download_response.content) / 1024:.2f} KB")
            else:
                print(f"Failed to download file: {download_response.status_code}")
                print(download_response.text)
        else:
            print(f"API returned error: {result.get('error')}")
    else:
        print(f"Request failed with status code: {response.status_code}")
        print(response.text)
    
    # Print elapsed time
    elapsed_time = time.time() - start_time
    print(f"Total time: {elapsed_time:.2f} seconds")

def test_upload_remix(base_url, audio_file, remix_prompt, output_format="mp3"):
    """
    Test the upload-remix endpoint
    
    Args:
        base_url: Base URL of the API
        audio_file: Path to the audio file to remix
        remix_prompt: Text prompt for the remix
        output_format: Output format (mp3 or wav)
    """
    print(f"Testing upload-remix with file: {audio_file}")
    print(f"Remix prompt: {remix_prompt}")
    
    # Prepare the request
    url = f"{base_url}/upload-remix"
    files = {
        "file": (os.path.basename(audio_file), open(audio_file, "rb"))
    }
    data = {
        "remix_prompt": remix_prompt,
        "output_format": output_format
    }
    
    # Send the request
    start_time = time.time()
    response = requests.post(url, files=files, data=data)
    
    # Check the response
    if response.status_code == 200:
        result = response.json()
        
        if result.get("success"):
            print(f"Success! Job ID: {result.get('job_id')}")
            print(f"Download URL: {result.get('download_url')}")
            
            # Print audio features
            if "audio_features" in result:
                print("\nDetected Audio Features:")
                for key, value in result["audio_features"].items():
                    print(f"  {key}: {value}")
            
            # Download the file
            download_url = f"{base_url}{result.get('download_url')}"
            download_response = requests.get(download_url)
            
            if download_response.status_code == 200:
                # Save the file
                filename = result.get('filename', f"remix.{output_format}")
                with open(filename, "wb") as f:
                    f.write(download_response.content)
                
                print(f"Downloaded file: {filename}")
                print(f"File size: {len(download_response.content) / 1024:.2f} KB")
            else:
                print(f"Failed to download file: {download_response.status_code}")
                print(download_response.text)
        else:
            print(f"API returned error: {result.get('error')}")
    else:
        print(f"Request failed with status code: {response.status_code}")
        print(response.text)
    
    # Print elapsed time
    elapsed_time = time.time() - start_time
    print(f"Total time: {elapsed_time:.2f} seconds")

def test_health(base_url):
    """
    Test the health check endpoint
    
    Args:
        base_url: Base URL of the API
    """
    print("Testing health check endpoint")
    
    # Prepare the request
    url = f"{base_url}/health"
    
    # Send the request
    response = requests.get(url)
    
    # Check the response
    if response.status_code == 200:
        result = response.json()
        print(f"Health check successful: {json.dumps(result, indent=2)}")
    else:
        print(f"Health check failed with status code: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Test the AI Music Production API")
    parser.add_argument("--base-url", default="http://localhost:5000", help="Base URL of the API")
    parser.add_argument("--test", choices=["health", "text-to-audio", "upload-remix"], required=True, help="Test to run")
    parser.add_argument("--audio-file", help="Path to the audio file to remix")
    parser.add_argument("--prompt", help="Text prompt for music generation or remix")
    parser.add_argument("--output-format", default="mp3", choices=["mp3", "wav"], help="Output format")
    parser.add_argument("--duration", type=int, default=180, help="Maximum duration in seconds")
    
    args = parser.parse_args()
    
    if args.test == "health":
        test_health(args.base_url)
    elif args.test == "text-to-audio":
        if not args.prompt:
            parser.error("--prompt is required for text-to-audio test")
        test_text_to_audio(args.base_url, args.prompt, args.output_format, args.duration)
    elif args.test == "upload-remix":
        if not args.audio_file:
            parser.error("--audio-file is required for upload-remix test")
        if not args.prompt:
            parser.error("--prompt is required for upload-remix test")
        test_upload_remix(args.base_url, args.audio_file, args.prompt, args.output_format)
