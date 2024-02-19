import { ConnectionOptions } from "bullmq";

const redisConnection: ConnectionOptions = {
  host: process.env.REDIS_HOST || "127.0.0.1",
  port: parseInt(process.env.REDIS_PORT || "") || 6379,
};

export default redisConnection;
