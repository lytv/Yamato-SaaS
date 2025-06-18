"""
Backup SQLite database to backups/db_backup.sqlite3
"""
import os
import shutil
from datetime import datetime

SRC = 'backend/src/infrastructure/storage/workspace.db'
DST_DIR = 'backups'
os.makedirs(DST_DIR, exist_ok=True)
TS = datetime.now().strftime('%Y%m%d_%H%M%S')
DST = os.path.join(DST_DIR, f'db_backup_{TS}.sqlite3')

if os.path.exists(SRC):
    shutil.copy2(SRC, DST)
    print(f"Database backup created: {DST}")
else:
    print("No database file found to backup.")
