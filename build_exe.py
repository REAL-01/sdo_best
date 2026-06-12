import os
import shutil
import subprocess
import sys

# Paths
root_dir = os.path.dirname(os.path.abspath(__file__))
frontend_dir = os.path.join(root_dir, "frontend")
backend_dir = os.path.join(root_dir, "backend")
dist_dir = os.path.join(frontend_dir, "dist")
static_dir = os.path.join(backend_dir, "app", "static")
venv_pip = os.path.join(backend_dir, ".venv", "Scripts", "pip.exe")
venv_python = os.path.join(backend_dir, ".venv", "Scripts", "python.exe")
venv_pyinstaller = os.path.join(backend_dir, ".venv", "Scripts", "pyinstaller.exe")

def run_cmd(cmd, cwd=None):
    print(f"Running command: {' '.join(cmd)} (Cwd: {cwd})")
    res = subprocess.run(cmd, cwd=cwd, shell=True)
    if res.returncode != 0:
        print(f"Error: Command failed with exit code {res.returncode}")
        sys.exit(res.returncode)

def main():
    # 0. Kill existing running instances of the executable to avoid write locks
    print("--- 0. Stopping any running LightLMS processes ---")
    try:
        if sys.platform == 'win32':
            subprocess.run(["taskkill", "/f", "/im", "LightLMS.exe"], stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
    except Exception:
        pass

    # 1. Build frontend React static bundle
    print("--- 1. Building React Frontend ---")
    run_cmd(["npm", "run", "build"], cwd=frontend_dir)
    
    # 2. Copy compiled static files to backend resources folder
    print("--- 2. Transferring static files to backend/app/static ---")
    if os.path.exists(static_dir):
        print(f"Removing old static dir: {static_dir}")
        shutil.rmtree(static_dir)
        
    print(f"Copying {dist_dir} to {static_dir}...")
    shutil.copytree(dist_dir, static_dir)
    
    # 3. Install required build dependencies in venv
    print("--- 3. Installing dependencies in Virtual Environment ---")
    # Install all dependencies from requirements.txt to ensure all drivers are available
    run_cmd([venv_pip, "install", "-r", os.path.join(backend_dir, "requirements.txt")])
    run_cmd([venv_pip, "install", "pyinstaller"])
    
    # 4. Packaging FastAPI backend + React static files into a single EXE
    print("--- 4. Packaging into a single EXE file ---")
    
    # We specify hidden imports to ensure uvicorn and database drivers are fully bundled
    pyinstaller_cmd = [
        venv_pyinstaller,
        "--onefile",
        f"--add-data={static_dir};static",
        "--name=LightLMS",
        "--hidden-import=uvicorn.protocols.http.h11_impl",
        "--hidden-import=uvicorn.protocols.http.httptools_impl",
        "--hidden-import=uvicorn.protocols.websockets.websockets_impl",
        "--hidden-import=uvicorn.protocols.websockets.wsproto_impl",
        "--hidden-import=uvicorn.lifespan.on",
        "--hidden-import=uvicorn.lifespan.off",
        "--hidden-import=asyncpg",
        "--hidden-import=psycopg",
        "--hidden-import=psycopg_binary",
        "--hidden-import=sqlalchemy.sql.functions",
        os.path.join(backend_dir, "run_exe.py")
    ]
    
    run_cmd(pyinstaller_cmd, cwd=root_dir)
    
    print("\n==================================================")
    print("SUCCESS! Single executable file built successfully.")
    print(f"Executable path: {os.path.join(root_dir, 'dist', 'LightLMS.exe')}")
    print("==================================================")

if __name__ == "__main__":
    main()
