'use client';

import type { WorkTable } from '@/types/workTable';

type WorkTableDetailProps = {
  workTable: WorkTable;
};

export function WorkTableDetail({ workTable }: WorkTableDetailProps) {
  return (
    <div className="space-y-4 p-4">
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
      {/* Add all other fields from the WorkTable type here */}
    </div>
  );
}
