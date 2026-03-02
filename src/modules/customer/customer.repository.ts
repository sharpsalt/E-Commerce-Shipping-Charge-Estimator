/**
 * Customer Repository
 * Data-access layer for Customer entities.
 * Uses the Repository pattern to abstract Prisma queries.
 */
import type { Customer } from "@prisma/client";
import { prisma } from "../../infrastructure/database/index.js";
import { NotFoundError } from "../../common/errors/index.js";

export class CustomerRepository {
  async findById(id: string): Promise<Customer> {
    const customer = await prisma.customer.findUnique({ where: { id } });
    if (!customer) throw new NotFoundError("Customer", id);
    return customer;
  }

  async findAll(onlyActive = true): Promise<Customer[]> {
    return prisma.customer.findMany({
      where: onlyActive ? { isActive: true } : {},
      orderBy: { name: "asc" },
    });
  }

  async create(data: Omit<Customer, "id" | "createdAt" | "updatedAt">): Promise<Customer> {
    return prisma.customer.create({ data });
  }
}

/** Singleton instance */
export const customerRepository = new CustomerRepository();
