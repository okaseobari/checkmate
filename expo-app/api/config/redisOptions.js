import dotenv from "dotenv";
dotenv.config();

export const redisOptions = {
  host: process.env.REDIS_HOST,
  port: process.env.REDIS_PORT,
  password: process.env.REDIS_PASSWORD,
  // Add other Redis options if needed
};
