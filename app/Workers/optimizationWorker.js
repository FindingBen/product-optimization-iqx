import { Worker } from "bullmq";
import prisma from "../db.server.js"
import {handleOptimization} from "../models/Optimization.server.js"
import {redis} from "../redis.server.js"
import { getAdminForShop } from "../shopify.auth.js";

const worker = new Worker(
  "optimization",
  async (job) => {
    const { shop, productId, optimizationId,automationRule } = job.data;

    console.log(`Starting optimization → ${shop} → ${productId}`);

    try {
      const { admin } = await getAdminForShop(shop);

      await prisma.optimization.update({
        where: { id: optimizationId },
        data: { status: "processing" }
      });

      await handleOptimization({
        shop,
        admin,
        productId,
        automationRule
      });

      await prisma.optimization.update({
        where: { id: optimizationId },
        data: { status: "completed" }
      });

      await prisma.product.update({
        where: { id: productId },
        data: { optimized: true }
      });

      console.log("Optimization completed");

    } catch (error) {

      await prisma.optimization.update({
        where: { id: optimizationId },
        data: { status: "failed" }
      });

      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 3
  }
);