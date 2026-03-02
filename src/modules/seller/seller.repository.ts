/**
 * Seller Repository
 */
import type { Seller } from "@prisma/client";
import { prisma } from "../../infrastructure/database/index.js";
import { NotFoundError } from "../../common/errors/index.js";

export class SellerRepository {
  async findById(id: string): Promise<Seller> {
    const seller = await prisma.seller.findUnique({ where: { id } });
    if (!seller) throw new NotFoundError("Seller", id);
    return seller;
  }

  async findAll(onlyActive = true): Promise<Seller[]> {
    return prisma.seller.findMany({
      where: onlyActive ? { isActive: true } : {},
      orderBy: { name: "asc" },
    });
  }

  async create(data: Omit<Seller, "id" | "createdAt" | "updatedAt">): Promise<Seller> {
    return prisma.seller.create({ data });
  }
}

export const sellerRepository = new SellerRepository();
