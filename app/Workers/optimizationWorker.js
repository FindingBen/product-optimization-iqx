import { Worker } from "bullmq";
import prisma from "../db.server.js"
import {handleOptimization} from "../models/Optimization.server.js"
import {redis} from "../redis.server.js"
import { getAdminForShop } from "../shopify.auth.js";

const worker = new Worker(
  "optimization",
  async (job) => {
    const { shop, productId, optimizationId, automationRule, automationRunId } = job.data;

    console.log(`[worker] Starting → shop:${shop} product:${productId} run:${automationRunId ?? "manual"}`);

    if (automationRunId) {
      await prisma.automationRun.update({
        where: { id: automationRunId },
        data: { status: "running", startedAt: new Date() },
      });
    }

    try {
      const { admin } = await getAdminForShop(shop);

      await prisma.optimization.update({
        where: { id: optimizationId },
        data: { status: "processing" },
      });

      const results = await handleOptimization({
        shop,
        admin,
        productId,
        automationRule,
      });

      console.log(`[worker] handleOptimization returned ${results?.length ?? 0} results`);

      // Save results + complete run (only for webhook/automation flow)
      if (automationRunId) {
        await prisma.$transaction(async (tx) => {
          if (Array.isArray(results) && results.length > 0) {
            await tx.automationResult.createMany({
              data: results.map((r) => ({
                runId: automationRunId,
                type: r.type,
                productId,
                originalValue: r.originalValue ?? null,
                optimizedValue: r.optimizedValue ?? null,
              })),
            });
          }

          await tx.automationRun.update({
            where: { id: automationRunId },
            data: { status: "completed", completedAt: new Date() },
          });
        });
      }

      await prisma.optimization.update({
        where: { id: optimizationId },
        data: { status: "completed" },
      });

      await prisma.product.update({
        where: { id: productId },
        data: { optimized: true },
      });

      await prisma.shopSubscription.update({
    where: { shop },
    data: { optimizationsUsedThisCycle: { increment: 1 } },
  });

      console.log(`[worker] Completed → product:${productId}`);

    } catch (error) {
      console.error(`[worker] FAILED → product:${productId}`, error); // ← this will show the real error

      await Promise.all([
        prisma.optimization.update({
          where: { id: optimizationId },
          data: { status: "failed" },
        }),
        automationRunId
          ? prisma.automationRun.update({
              where: { id: automationRunId },
              data: { status: "failed", completedAt: new Date() },
            })
          : Promise.resolve(),
      ]);

      throw error; // rethrow so BullMQ marks the job as failed
    }
  },
  { connection: redis, concurrency: 3 }
);