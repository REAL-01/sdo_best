import os
import sys
import asyncio
import webbrowser
from threading import Timer
from urllib.parse import urlparse

# Set Windows Selector Event Loop Policy for compatibility with psycopg async mode
if sys.platform == 'win32':
    asyncio.set_event_loop_policy(asyncio.WindowsSelectorEventLoopPolicy())

# Determine directory of executable/script
if getattr(sys, 'frozen', False):
    exe_dir = os.path.dirname(sys.executable)
else:
    exe_dir = os.path.dirname(os.path.abspath(__file__))

# Manual .env parser to ensure environment variables are loaded before importing app
def load_env_file(env_path):
    if not os.path.exists(env_path):
        return
    print(f"Loading environment variables from: {env_path}")
    with open(env_path, 'r', encoding='utf-8') as f:
        for line in f:
            line = line.strip()
            if not line or line.startswith('#'):
                continue
            if '=' in line:
                key, val = line.split('=', 1)
                val = val.strip().strip("'\"")
                os.environ[key.strip()] = val

# Load .env from CWD, executable directory, or its parent directory
load_env_file(os.path.join(os.getcwd(), ".env"))
if not os.environ.get("DATABASE_URL"):
    load_env_file(os.path.join(exe_dir, ".env"))
if not os.environ.get("DATABASE_URL"):
    load_env_file(os.path.join(os.path.dirname(exe_dir), ".env"))

# Now import FastAPI application and dependencies
import uvicorn
from fastapi.staticfiles import StaticFiles
from app.main import app
from app.core.config import settings

# Locate static files directory (which contains React frontend bundle)
if getattr(sys, 'frozen', False):
    # PyInstaller extracts bundled files to sys._MEIPASS
    static_dir = os.path.join(sys._MEIPASS, "static")
else:
    static_dir = os.path.join(exe_dir, "app", "static")

print(f"Serving static frontend files from: {static_dir}")
if os.path.exists(static_dir):
    # Remove default API route for "/" if it exists, so StaticFiles can handle the root path
    app.router.routes = [r for r in app.router.routes if getattr(r, "path", None) != "/"]
    app.mount("/", StaticFiles(directory=static_dir, html=True), name="static")
else:
    print(f"WARNING: Static directory not found at {static_dir}. Frontend will not be served.")

def get_masked_db_url(url: str) -> str:
    try:
        parsed = urlparse(url)
        if parsed.password:
            netloc = parsed.netloc.replace(f":{parsed.password}", ":******")
            return parsed._replace(netloc=netloc).geturl()
    except Exception:
        pass
    return url

def open_browser():
    print("Opening browser at http://127.0.0.1:8000/ ...")
    webbrowser.open("http://127.0.0.1:8000/")

if __name__ == "__main__":
    print("Starting LightLMS Platform...")
    print(f"Database connection: {get_masked_db_url(settings.DATABASE_URL)}")
    print("Note: No database migrations, drops, or seeds will be executed.")
    
    # Start timer to open the browser shortly after uvicorn starts
    Timer(1.5, open_browser).start()
    
    # Configure and run uvicorn server using our custom asyncio Selector loop
    config = uvicorn.Config(app, host="127.0.0.1", port=8000, loop="asyncio")
    server = uvicorn.Server(config)
    asyncio.run(server.serve())
