"""
Backup workspace directory to backups/workspace_backup_<timestamp>/
"""
import os
import shutil
from datetime import datetime

SRC = 'backend/src/infrastructure/storage/workspace'
DST_DIR = 'backups'
os.makedirs(DST_DIR, exist_ok=True)
TS = datetime.now().strftime('%Y%m%d_%H%M%S')
DST = os.path.join(DST_DIR, f'workspace_backup_{TS}')

if os.path.exists(SRC):
    shutil.copytree(SRC, DST)
    print(f"Workspace backup created: {DST}")
else:
    print("No workspace directory found to backup.")
