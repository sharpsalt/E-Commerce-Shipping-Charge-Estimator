// Type declarations to satisfy the TypeScript compiler when the
// generated Prisma client is missing (e.g. in this sandbox environment).
// These are intentionally minimal and mirror the schema defined in
// prisma/schema.prisma.  In a real project the generated types would
// replace these definitions.

declare module "@prisma/client" {
  // enums
  export enum TransportMode {
    AEROPLANE = "AEROPLANE",
    TRUCK = "TRUCK",
    MINI_VAN = "MINI_VAN",
  }

  export enum DeliverySpeed {
    STANDARD = "STANDARD",
    EXPRESS = "EXPRESS",
  }

  // scalar types
  export type DateTime = string | Date;

  // model interfaces (partial; only fields actually used by the code).
  export interface Customer {
    id: string;
    name: string;
    phone: string;
    lat: number;
    lng: number;
    [key: string]: any;
  }

  export interface Seller {
    id: string;
    name: string;
    phone: string;
    lat: number;
    lng: number;
    [key: string]: any;
  }

  export interface Product {
    id: string;
    name: string;
    weightKg: number;
    [key: string]: any;
  }

  export interface Warehouse {
    id: string;
    name: string;
    lat: number;
    lng: number;
    [key: string]: any;
  }

  export interface ShippingRate {
    id: string;
    transportMode: TransportMode;
    minDistanceKm: number;
    maxDistanceKm: number | null;
    ratePerKmPerKg: number;
    isActive: boolean;
    [key: string]: any;
  }

  export interface DeliverySpeedConfig {
    id: string;
    speed: DeliverySpeed;
    baseCourierChargeINR: number;
    extraChargePerKg: number;
    [key: string]: any;
  }

  // Prisma client class (methods unused, so typed as any)
  export class PrismaClient {
    constructor(args?: any);
    $connect(): Promise<void>;
    $disconnect(): Promise<void>;
    customer: any;
    seller: any;
    product: any;
    warehouse: any;
    shippingRate: any;
    deliverySpeedConfig: any;
    [key: string]: any;
  }
}
