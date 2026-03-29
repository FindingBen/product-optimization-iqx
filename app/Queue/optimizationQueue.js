import { Queue } from "bullmq";
import { redis } from "../redis.server.js"

export const optimizationQueue = new Queue("optimization", {
  connection: redis,
  defaultJobOptions: {
    attempts: 3,                  // retry 3 times
    backoff: { type: "exponential", delay: 5000 },
    removeOnComplete: 500,      // keep for debugging
    removeOnFail: 20,
    
  },
});