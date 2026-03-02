/**
 * Warehouse Repository
 * Data-access layer for Warehouse entities.
 */
import type { Warehouse } from "@prisma/client";
import { prisma } from "../../infrastructure/database/index.js";
import { NotFoundError } from "../../common/errors/index.js";

export class WarehouseRepository {
  async findById(id: string): Promise<Warehouse> {
    const warehouse = await prisma.warehouse.findUnique({ where: { id } });
    if (!warehouse) throw new NotFoundError("Warehouse", id);
    return warehouse;
  }

  /** Return all operational warehouses */
  async findAllOperational(): Promise<Warehouse[]> {
    return prisma.warehouse.findMany({
      where: { isOperational: true },
      orderBy: { name: "asc" },
    });
  }

  async findAll(): Promise<Warehouse[]> {
    return prisma.warehouse.findMany({ orderBy: { name: "asc" } });
  }
}

export const warehouseRepository = new WarehouseRepository();
