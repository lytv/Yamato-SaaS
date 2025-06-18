"""
Restore workspace directory from latest backup in backups/
"""
import os
import shutil

SRC_DIR = 'backups'
DST = 'backend/src/infrastructure/storage/workspace'

backups = [f for f in os.listdir(SRC_DIR) if f.startswith('workspace_backup_')]
if not backups:
    print("No workspace backup found.")
    exit(1)
backups.sort(reverse=True)
SRC = os.path.join(SRC_DIR, backups[0])
if os.path.exists(DST):
    shutil.rmtree(DST)
shutil.copytree(SRC, DST)
print(f"Workspace restored from: {SRC}")
