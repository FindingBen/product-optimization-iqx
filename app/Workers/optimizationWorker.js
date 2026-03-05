import { Worker } from "bullmq";
import prisma from "../db.server.js"
import {handleOptimization} from "../models/Optimization.server.js"
import {redis} from "../redis.server.js"
import { getAdminForShop } from "../shopify.auth.js";

const worker = new Worker(
  "optimization",
  async (job) => {
    const { shop, productId } = job.data;

    console.log(`Starting optimization → ${shop} → ${productId}`);

    // Create record ONCE here
    const optimization = await prisma.optimization.create({
      data: {
        shop,
        productId,
        status: "processing",
      },
    });
    console.log('INITT4')
    try {
      const {admin} = await getAdminForShop(shop);
      console.log('INITT3')
      await handleOptimization({
        shop,
        admin,
        productId,
      });

      await prisma.optimization.update({
        where: { id: optimization.id },
        data: { status: "completed" },
      });

      await prisma.product.update({
        where: { id: productId },
        data: { optimized: true },
      });

      console.log("Optimization completed");
    } catch (error) {
      console.error("Optimization failed", error);

      await prisma.optimization.update({
        where: { id: optimization.id },
        data: { status: "failed" },
      });

      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 3,
  }
);