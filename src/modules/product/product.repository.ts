/**
 * Product Repository
 */
import type { Product } from "@prisma/client";
import { prisma } from "../../infrastructure/database/index.js";
import { NotFoundError } from "../../common/errors/index.js";

export class ProductRepository {
  async findById(id: string): Promise<Product> {
    const product = await prisma.product.findUnique({ where: { id } });
    if (!product) throw new NotFoundError("Product", id);
    return product;
  }

  async findBySellerId(sellerId: string, onlyActive = true): Promise<Product[]> {
    return prisma.product.findMany({
      where: { sellerId, ...(onlyActive ? { isActive: true } : {}) },
      orderBy: { name: "asc" },
    });
  }

  /** Find a product that belongs to a given seller */
  async findBySellerAndProductId(sellerId: string, productId: string): Promise<Product> {
    const product = await prisma.product.findFirst({
      where: { id: productId, sellerId },
    });
    if (!product) {
      throw new NotFoundError(
        "Product",
        `productId=${productId} for sellerId=${sellerId}`,
      );
    }
    return product;
  }
}

export const productRepository = new ProductRepository();
