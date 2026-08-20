import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Next.js convention keeps local secrets in .env.local (not .env), so load it explicitly.
config({ path: ".env.local" });
config();

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: {
    url: env("DATABASE_URL"),
  },
});
