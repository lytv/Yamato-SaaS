import { and, asc, avg, count, desc, eq, gte, ilike, lte, or, sum } from 'drizzle-orm';

import { db } from '@/libs/DB';
import { workTableSchema } from '@/models/Schema';
import type {
  CreateWorkTableInput,
  MaintenanceSchedule,
  UpdateWorkTableInput,
  WorkTableDb,
  WorkTableListParams,
  WorkTableMetrics,
} from '@/types/workTable';

export async function createWorkTable(data: CreateWorkTableInput): Promise<WorkTableDb> {
  const existingTable = await getWorkTableByCode(data.tableCode, data.ownerId);
  if (existingTable) {
    throw new Error(`Table code '${data.tableCode}' already exists`);
  }
  const [workTable] = await db
    .insert(workTableSchema)
    .values({ ...data })
    .returning();
  if (!workTable) {
    throw new Error('Failed to create work table');
  }
  return workTable;
}

export async function getWorkTablesByOwner(params: WorkTableListParams): Promise<WorkTableDb[]> {
  const {
    ownerId,
    page,
    limit,
    search,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    maintenanceDue,
    warrantyExpiring,
    tableType,
    status,
    department,
    locationCode,
    tableCategory,
    assignedOperator,
    supervisor,
    minCapacityPerDay,
    maxCapacityPerDay,
    minCapacityPerHour,
    maxCapacityPerHour,
    minUtilizationRate,
    maxUtilizationRate,
    minEfficiencyRating,
    maxEfficiencyRating,
  } = params;
  const offset = (page - 1) * limit;
  let whereConditions: any = eq(workTableSchema.ownerId, ownerId);
  if (search && search.trim() !== '') {
    const searchTerm = `%${search.trim()}%`;
    const searchCondition = and(
      eq(workTableSchema.ownerId, ownerId),
      or(
        ilike(workTableSchema.tableName, searchTerm),
        ilike(workTableSchema.tableCode, searchTerm),
        ilike(workTableSchema.tableDetail, searchTerm),
        ilike(workTableSchema.department, searchTerm),
        ilike(workTableSchema.locationCode, searchTerm),
        ilike(workTableSchema.assignedOperator, searchTerm),
        ilike(workTableSchema.supervisor, searchTerm),
        ilike(workTableSchema.equipmentModel, searchTerm),
        ilike(workTableSchema.specialCapabilities, searchTerm),
        ilike(workTableSchema.note, searchTerm),
      ),
    );
    whereConditions = searchCondition;
  }
  if (tableType !== undefined && typeof tableType === 'string' && tableType.trim() !== '') {
    whereConditions = and(whereConditions, eq(workTableSchema.tableType, tableType));
  }
  if (status !== undefined && typeof status === 'string' && status.trim() !== '') {
    whereConditions = and(whereConditions, eq(workTableSchema.status, status));
  }
  if (department !== undefined && typeof department === 'string' && department.trim() !== '') {
    whereConditions = and(whereConditions, ilike(workTableSchema.department, `%${department}%`));
  }
  if (locationCode !== undefined && typeof locationCode === 'string' && locationCode.trim() !== '') {
    whereConditions = and(whereConditions, ilike(workTableSchema.locationCode, `%${locationCode}%`));
  }
  if (tableCategory !== undefined && typeof tableCategory === 'number' && !Number.isNaN(tableCategory)) {
    whereConditions = and(whereConditions, eq(workTableSchema.tableCategory, tableCategory));
  }
  if (assignedOperator !== undefined && typeof assignedOperator === 'string' && assignedOperator.trim() !== '') {
    whereConditions = and(whereConditions, ilike(workTableSchema.assignedOperator, `%${assignedOperator}%`));
  }
  if (supervisor !== undefined && typeof supervisor === 'string' && supervisor.trim() !== '') {
    whereConditions = and(whereConditions, ilike(workTableSchema.supervisor, `%${supervisor}%`));
  }
  if (minCapacityPerDay !== undefined && typeof minCapacityPerDay === 'number' && !Number.isNaN(minCapacityPerDay)) {
    whereConditions = and(whereConditions, gte(workTableSchema.capacityPerDay, minCapacityPerDay));
  }
  if (maxCapacityPerDay !== undefined && typeof maxCapacityPerDay === 'number' && !Number.isNaN(maxCapacityPerDay)) {
    whereConditions = and(whereConditions, lte(workTableSchema.capacityPerDay, maxCapacityPerDay));
  }
  if (minCapacityPerHour !== undefined && typeof minCapacityPerHour === 'number' && !Number.isNaN(minCapacityPerHour)) {
    whereConditions = and(whereConditions, gte(workTableSchema.capacityPerHour, minCapacityPerHour));
  }
  if (maxCapacityPerHour !== undefined && typeof maxCapacityPerHour === 'number' && !Number.isNaN(maxCapacityPerHour)) {
    whereConditions = and(whereConditions, lte(workTableSchema.capacityPerHour, maxCapacityPerHour));
  }
  if (minUtilizationRate !== undefined && typeof minUtilizationRate === 'number' && !Number.isNaN(minUtilizationRate)) {
    whereConditions = and(whereConditions, gte(workTableSchema.utilizationRate, minUtilizationRate.toString()));
  }
  if (maxUtilizationRate !== undefined && typeof maxUtilizationRate === 'number' && !Number.isNaN(maxUtilizationRate)) {
    whereConditions = and(whereConditions, lte(workTableSchema.utilizationRate, maxUtilizationRate.toString()));
  }
  if (minEfficiencyRating !== undefined && typeof minEfficiencyRating === 'number' && !Number.isNaN(minEfficiencyRating)) {
    whereConditions = and(whereConditions, gte(workTableSchema.efficiencyRating, minEfficiencyRating.toString()));
  }
  if (maxEfficiencyRating !== undefined && typeof maxEfficiencyRating === 'number' && !Number.isNaN(maxEfficiencyRating)) {
    whereConditions = and(whereConditions, lte(workTableSchema.efficiencyRating, maxEfficiencyRating.toString()));
  }
  if (maintenanceDue) {
    const today = new Date();
    const todayStr = today.toISOString().slice(0, 10);
    whereConditions = and(whereConditions, lte(workTableSchema.nextMaintenanceDate, todayStr));
  }
  if (warrantyExpiring) {
    const today = new Date();
    const futureDate = new Date();
    futureDate.setDate(today.getDate() + 30);
    const todayStr = today.toISOString().slice(0, 10);
    const futureStr = futureDate.toISOString().slice(0, 10);
    whereConditions = and(
      whereConditions,
      and(
        gte(workTableSchema.warrantyExpiryDate, todayStr),
        lte(workTableSchema.warrantyExpiryDate, futureStr),
      ),
    );
  }
  type SortKey = 'createdAt' | 'updatedAt' | 'tableName' | 'tableCode' | 'capacityPerDay' | 'utilizationRate' | 'efficiencyRating';
  const sortColumns: Record<SortKey, any> = {
    createdAt: workTableSchema.createdAt,
    updatedAt: workTableSchema.updatedAt,
    tableName: workTableSchema.tableName,
    tableCode: workTableSchema.tableCode,
    capacityPerDay: workTableSchema.capacityPerDay,
    utilizationRate: workTableSchema.utilizationRate,
    efficiencyRating: workTableSchema.efficiencyRating,
  };
  const sortByKey: SortKey = (typeof sortBy === 'string' && ['createdAt', 'updatedAt', 'tableName', 'tableCode', 'capacityPerDay', 'utilizationRate', 'efficiencyRating'].includes(sortBy))
    ? sortBy as SortKey
    : 'createdAt';
  const sortColumn = sortColumns[sortByKey] as NonNullable<typeof workTableSchema.createdAt>;
  const orderBy = sortOrder === 'asc' ? asc(sortColumn as any) : desc(sortColumn as any);
  return await db
    .select()
    .from(workTableSchema)
    .where(whereConditions)
    .orderBy(orderBy)
    .limit(limit)
    .offset(offset);
}

export async function getWorkTableByCode(tableCode: string, ownerId: string): Promise<WorkTableDb | null> {
  const [workTable] = await db
    .select()
    .from(workTableSchema)
    .where(and(eq(workTableSchema.tableCode, tableCode), eq(workTableSchema.ownerId, ownerId)))
    .limit(1);
  return workTable ?? null;
}

export async function getWorkTableById(id: number, ownerId: string): Promise<WorkTableDb | null> {
  const [workTable] = await db
    .select()
    .from(workTableSchema)
    .where(and(eq(workTableSchema.id, id), eq(workTableSchema.ownerId, ownerId)))
    .limit(1);
  return workTable ?? null;
}

export async function updateWorkTable(id: number, ownerId: string, data: UpdateWorkTableInput): Promise<WorkTableDb> {
  const existingTable = await getWorkTableById(id, ownerId);
  if (!existingTable) {
    throw new Error('Work table not found or access denied');
  }
  if (data.tableCode && data.tableCode !== existingTable.tableCode) {
    const existingCodeTable = await getWorkTableByCode(data.tableCode, ownerId);
    if (existingCodeTable) {
      throw new Error(`Table code '${data.tableCode}' already exists`);
    }
  }
  const [updatedTable] = await db
    .update(workTableSchema)
    .set({ ...existingTable, ...data, updatedAt: new Date() })
    .where(and(eq(workTableSchema.id, id), eq(workTableSchema.ownerId, ownerId)))
    .returning();
  if (!updatedTable) {
    throw new Error('Failed to update work table');
  }
  return updatedTable;
}

export async function deleteWorkTable(id: number, ownerId: string): Promise<boolean> {
  const existingTable = await getWorkTableById(id, ownerId);
  if (!existingTable) {
    throw new Error('Work table not found or access denied');
  }
  await db
    .delete(workTableSchema)
    .where(and(eq(workTableSchema.id, id), eq(workTableSchema.ownerId, ownerId)));
  return true;
}

export async function getWorkTableMetrics(ownerId: string): Promise<WorkTableMetrics> {
  const today = new Date();
  const futureDate = new Date();
  futureDate.setDate(today.getDate() + 30);
  const todayStr = today.toISOString().slice(0, 10);
  const futureStr = futureDate.toISOString().slice(0, 10);
  const [totalResult] = await db
    .select({
      totalTables: count(),
      averageUtilization: avg(workTableSchema.utilizationRate),
      averageEfficiency: avg(workTableSchema.efficiencyRating),
      totalCapacityPerDay: sum(workTableSchema.capacityPerDay),
      totalCapacityPerHour: sum(workTableSchema.capacityPerHour),
    })
    .from(workTableSchema)
    .where(eq(workTableSchema.ownerId, ownerId));
  const [activeResult] = await db
    .select({ count: count() })
    .from(workTableSchema)
    .where(and(eq(workTableSchema.ownerId, ownerId), eq(workTableSchema.status, 'active')));
  const [maintenanceResult] = await db
    .select({ count: count() })
    .from(workTableSchema)
    .where(and(eq(workTableSchema.ownerId, ownerId), or(eq(workTableSchema.status, 'maintenance'), eq(workTableSchema.status, 'repair'))));
  const [maintenanceDueResult] = await db
    .select({ count: count() })
    .from(workTableSchema)
    .where(and(eq(workTableSchema.ownerId, ownerId), lte(workTableSchema.nextMaintenanceDate, todayStr)));
  const [warrantyExpiringResult] = await db
    .select({ count: count() })
    .from(workTableSchema)
    .where(and(eq(workTableSchema.ownerId, ownerId), gte(workTableSchema.warrantyExpiryDate, todayStr), lte(workTableSchema.warrantyExpiryDate, futureStr)));
  return {
    totalTables: totalResult?.totalTables ?? 0,
    activeTables: activeResult?.count ?? 0,
    maintenanceTables: maintenanceResult?.count ?? 0,
    averageUtilization: Number(totalResult?.averageUtilization ?? 0),
    averageEfficiency: Number(totalResult?.averageEfficiency ?? 0),
    totalCapacityPerDay: Number(totalResult?.totalCapacityPerDay ?? 0),
    totalCapacityPerHour: Number(totalResult?.totalCapacityPerHour ?? 0),
    maintenanceDueCount: maintenanceDueResult?.count ?? 0,
    warrantyExpiringCount: warrantyExpiringResult?.count ?? 0,
  };
}

export async function getMaintenanceSchedule(ownerId: string): Promise<MaintenanceSchedule[]> {
  const today = new Date();
  const tables = await db
    .select({
      id: workTableSchema.id,
      tableCode: workTableSchema.tableCode,
      tableName: workTableSchema.tableName,
      lastMaintenanceDate: workTableSchema.lastMaintenanceDate,
      nextMaintenanceDate: workTableSchema.nextMaintenanceDate,
    })
    .from(workTableSchema)
    .where(eq(workTableSchema.ownerId, ownerId))
    .orderBy(asc(workTableSchema.nextMaintenanceDate));
  return tables.map((table) => {
    const dateObj = typeof table.lastMaintenanceDate === 'string' ? new Date(table.lastMaintenanceDate) : table.lastMaintenanceDate;
    const daysSinceLastMaintenance = dateObj ? Math.floor((today.getTime() - dateObj.getTime()) / (1000 * 60 * 60 * 24)) : null;
    const dateObjNext = typeof table.nextMaintenanceDate === 'string' ? new Date(table.nextMaintenanceDate) : table.nextMaintenanceDate;
    const daysUntilNextMaintenance = dateObjNext ? Math.floor((dateObjNext.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)) : null;
    const isOverdue = dateObjNext ? dateObjNext < today : false;
    const isDueSoon = daysUntilNextMaintenance !== null && daysUntilNextMaintenance <= 7 && daysUntilNextMaintenance > 0;
    return {
      tableId: table.id,
      tableCode: table.tableCode,
      tableName: table.tableName ?? table.tableCode,
      lastMaintenanceDate: dateObj?.toISOString().split('T')[0] ?? null,
      nextMaintenanceDate: dateObjNext?.toISOString().split('T')[0] ?? null,
      daysSinceLastMaintenance,
      daysUntilNextMaintenance,
      isOverdue,
      isDueSoon,
    };
  });
}
