import { PrismaClient } from "@prisma/client";

function getPrismaDatasourceUrl() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    return undefined;
  }

  // Railway Postgres often requires SSL in production.
  if (process.env.NODE_ENV === "production" && !databaseUrl.includes("sslmode=")) {
    const separator = databaseUrl.includes("?") ? "&" : "?";
    return `${databaseUrl}${separator}sslmode=require`;
  }

  return databaseUrl;
}

function createPrismaClient() {
  const url = getPrismaDatasourceUrl();

  return new PrismaClient(
    url
      ? {
          datasources: {
            db: {
              url,
            },
          },
        }
      : undefined,
  );
}

if (process.env.NODE_ENV !== "production") {
  if (!global.prismaGlobal) {
    global.prismaGlobal = createPrismaClient();
  }
}

const prisma = global.prismaGlobal ?? createPrismaClient();

export default prisma;
