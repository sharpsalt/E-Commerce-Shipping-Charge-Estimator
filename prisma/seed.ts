/**
 * Database Seed Script
 * Seeds all reference data + sample entities for development.
 */
import { PrismaClient, TransportMode, DeliverySpeed } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...\n");

  // ─── Customers (Kirana Stores) ───────────────────────
  const customers = await Promise.all([
    prisma.customer.upsert({
      where: { phone: "9847000001" },
      update: {},
      create: {
        name: "Shree Kirana Store",
        phone: "9847000001",
        email: "shree@kirana.in",
        addressLine: "Shop 12, MG Road",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560001",
        lat: 12.9716,
        lng: 77.5946,
      },
    }),
    prisma.customer.upsert({
      where: { phone: "9101000002" },
      update: {},
      create: {
        name: "Andheri Mini Mart",
        phone: "9101000002",
        email: "andheri@mart.in",
        addressLine: "45, Andheri West",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400058",
        lat: 19.1197,
        lng: 72.8464,
      },
    }),
    prisma.customer.upsert({
      where: { phone: "9202000003" },
      update: {},
      create: {
        name: "Delhi General Store",
        phone: "9202000003",
        email: "delhi@general.in",
        addressLine: "22, Chandni Chowk",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110006",
        lat: 28.6508,
        lng: 77.2309,
      },
    }),
    prisma.customer.upsert({
      where: { phone: "9303000004" },
      update: {},
      create: {
        name: "Hyderabad Essentials",
        phone: "9303000004",
        email: "hyd@essentials.in",
        addressLine: "10, Ameerpet",
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500016",
        lat: 17.4375,
        lng: 78.4483,
      },
    }),
  ]);
  console.log(`Seeded ${customers.length} customers`);

  // ─── Sellers ─────────────────────────────────────────
  const sellers = await Promise.all([
    prisma.seller.upsert({
      where: { phone: "8001000001" },
      update: {},
      create: {
        name: "Nestle Seller",
        phone: "8001000001",
        email: "nestle@seller.in",
        city: "Gurgaon",
        state: "Haryana",
        pincode: "122001",
        lat: 28.4595,
        lng: 77.0266,
      },
    }),
    prisma.seller.upsert({
      where: { phone: "8002000002" },
      update: {},
      create: {
        name: "Rice Seller",
        phone: "8002000002",
        email: "rice@seller.in",
        city: "Thanjavur",
        state: "Tamil Nadu",
        pincode: "613001",
        lat: 10.787,
        lng: 79.1378,
      },
    }),
    prisma.seller.upsert({
      where: { phone: "8003000003" },
      update: {},
      create: {
        name: "Sugar Seller",
        phone: "8003000003",
        email: "sugar@seller.in",
        city: "Kolhapur",
        state: "Maharashtra",
        pincode: "416001",
        lat: 16.705,
        lng: 74.2433,
      },
    }),
    prisma.seller.upsert({
      where: { phone: "8004000004" },
      update: {},
      create: {
        name: "Spice World Trader",
        phone: "8004000004",
        email: "spice@world.in",
        city: "Kochi",
        state: "Kerala",
        pincode: "682001",
        lat: 9.9312,
        lng: 76.2673,
      },
    }),
  ]);
  console.log(` Seeded ${sellers.length} sellers`);

  // ─── Products ────────────────────────────────────────
  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: "NESTLE-MAGGIE-500G" },
      update: {},
      create: {
        name: "Maggie 500g Packet",
        description: "Instant noodles pack of 500g",
        sellingPriceINR: 10,
        weightKg: 0.5,
        lengthCm: 10,
        widthCm: 10,
        heightCm: 10,
        category: "Instant Food",
        sku: "NESTLE-MAGGIE-500G",
        sellerId: sellers[0].id,
      },
    }),
    prisma.product.upsert({
      where: { sku: "RICE-BAG-10KG" },
      update: {},
      create: {
        name: "Rice Bag 10Kg",
        description: "Premium basmati rice 10kg bag",
        sellingPriceINR: 500,
        weightKg: 10,
        lengthCm: 100,
        widthCm: 80,
        heightCm: 50,
        category: "Grains",
        sku: "RICE-BAG-10KG",
        sellerId: sellers[1].id,
      },
    }),
    prisma.product.upsert({
      where: { sku: "SUGAR-BAG-25KG" },
      update: {},
      create: {
        name: "Sugar Bag 25Kg",
        description: "White crystal sugar 25kg bag",
        sellingPriceINR: 700,
        weightKg: 25,
        lengthCm: 100,
        widthCm: 90,
        heightCm: 60,
        category: "Sweeteners",
        sku: "SUGAR-BAG-25KG",
        sellerId: sellers[2].id,
      },
    }),
    prisma.product.upsert({
      where: { sku: "TURMERIC-1KG" },
      update: {},
      create: {
        name: "Turmeric Powder 1Kg",
        description: "Premium quality turmeric powder",
        sellingPriceINR: 120,
        weightKg: 1,
        lengthCm: 20,
        widthCm: 15,
        heightCm: 10,
        category: "Spices",
        sku: "TURMERIC-1KG",
        sellerId: sellers[3].id,
      },
    }),
  ]);
  console.log(` Seeded ${products.length} products`);

  // ─── Warehouses ──────────────────────────────────────
  const warehouses = await Promise.all([
    prisma.warehouse.upsert({
      where: { name: "BLR_Warehouse" },
      update: {},
      create: {
        name: "BLR_Warehouse",
        city: "Bangalore",
        state: "Karnataka",
        pincode: "560100",
        lat: 12.99999,
        lng: 77.5946,
        capacityKg: 100000,
      },
    }),
    prisma.warehouse.upsert({
      where: { name: "MUMB_Warehouse" },
      update: {},
      create: {
        name: "MUMB_Warehouse",
        city: "Mumbai",
        state: "Maharashtra",
        pincode: "400001",
        lat: 19.076,
        lng: 72.8777,
        capacityKg: 150000,
      },
    }),
    prisma.warehouse.upsert({
      where: { name: "DEL_Warehouse" },
      update: {},
      create: {
        name: "DEL_Warehouse",
        city: "New Delhi",
        state: "Delhi",
        pincode: "110001",
        lat: 28.6139,
        lng: 77.209,
        capacityKg: 200000,
      },
    }),
    prisma.warehouse.upsert({
      where: { name: "HYD_Warehouse" },
      update: {},
      create: {
        name: "HYD_Warehouse",
        city: "Hyderabad",
        state: "Telangana",
        pincode: "500001",
        lat: 17.385,
        lng: 78.4867,
        capacityKg: 120000,
      },
    }),
    prisma.warehouse.upsert({
      where: { name: "CHN_Warehouse" },
      update: {},
      create: {
        name: "CHN_Warehouse",
        city: "Chennai",
        state: "Tamil Nadu",
        pincode: "600001",
        lat: 13.0827,
        lng: 80.2707,
        capacityKg: 100000,
      },
    }),
  ]);
  console.log(` Seeded ${warehouses.length} warehouses`);

  // ─── Shipping Rates ──────────────────────────────────
  const shippingRates = await Promise.all([
    prisma.shippingRate.upsert({
      where: { transportMode: TransportMode.MINI_VAN },
      update: {},
      create: {
        transportMode: TransportMode.MINI_VAN,
        minDistanceKm: 0,
        maxDistanceKm: 100,
        ratePerKmPerKg: 3,
      },
    }),
    prisma.shippingRate.upsert({
      where: { transportMode: TransportMode.TRUCK },
      update: {},
      create: {
        transportMode: TransportMode.TRUCK,
        minDistanceKm: 100,
        maxDistanceKm: 500,
        ratePerKmPerKg: 2,
      },
    }),
    prisma.shippingRate.upsert({
      where: { transportMode: TransportMode.AEROPLANE },
      update: {},
      create: {
        transportMode: TransportMode.AEROPLANE,
        minDistanceKm: 500,
        maxDistanceKm: null,
        ratePerKmPerKg: 1,
      },
    }),
  ]);
  console.log(` Seeded ${shippingRates.length} shipping rates`);

  // ─── Delivery Speed Configs ──────────────────────────
  const deliverySpeeds = await Promise.all([
    prisma.deliverySpeedConfig.upsert({
      where: { speed: DeliverySpeed.STANDARD },
      update: {},
      create: {
        speed: DeliverySpeed.STANDARD,
        baseCourierChargeINR: 10,
        extraChargePerKg: 0,
      },
    }),
    prisma.deliverySpeedConfig.upsert({
      where: { speed: DeliverySpeed.EXPRESS },
      update: {},
      create: {
        speed: DeliverySpeed.EXPRESS,
        baseCourierChargeINR: 10,
        extraChargePerKg: 1.2,
      },
    }),
  ]);
  console.log(` Seeded ${deliverySpeeds.length} delivery speed configs`);

  console.log("\n🎉 Database seeded successfully!");
}

main()
  .catch((e) => {
    console.error(" Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
