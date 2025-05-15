import os
import argparse
from app import app

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Run the AI Music Production API")
    parser.add_argument("--host", default="0.0.0.0", help="Host to run the server on")
    parser.add_argument("--port", type=int, default=5000, help="Port to run the server on")
    parser.add_argument("--debug", action="store_true", help="Run in debug mode")
    
    args = parser.parse_args()
    
    # Create necessary directories
    os.makedirs("uploads", exist_ok=True)
    os.makedirs("outputs", exist_ok=True)
    
    # Run the server
    app.run(host=args.host, port=args.port, debug=args.debug)
