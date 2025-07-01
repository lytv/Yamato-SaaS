'use client';

import type { WorkTable } from '@/types/workTable';

interface WorkTableDetailProps {
  workTable: WorkTable;
}

export function WorkTableDetail({ workTable }: WorkTableDetailProps) {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h3 className="font-semibold">Table Code</h3>
        <p>{workTable.tableCode}</p>
      </div>
      <div>
        <h3 className="font-semibold">Table Name</h3>
        <p>{workTable.tableName}</p>
      </div>
      <div>
        <h3 className="font-semibold">Table Type</h3>
        <p>{workTable.tableType}</p>
      </div>
      <div>
        <h3 className="font-semibold">Status</h3>
        <p>{workTable.status}</p>
      </div>
      {/* Add all other fields from the WorkTable type here */}
    </div>
  );
}
