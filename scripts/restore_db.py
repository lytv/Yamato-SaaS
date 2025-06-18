"""
Restore SQLite database from latest backup in backups/
"""
import os
import shutil

SRC_DIR = 'backups'
DST = 'backend/src/infrastructure/storage/workspace.db'

backups = [f for f in os.listdir(SRC_DIR) if f.startswith('db_backup_') and f.endswith('.sqlite3')]
if not backups:
    print("No DB backup found.")
    exit(1)
backups.sort(reverse=True)
SRC = os.path.join(SRC_DIR, backups[0])
shutil.copy2(SRC, DST)
print(f"Database restored from: {SRC}")
