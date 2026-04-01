import { Queue, Worker } from 'bullmq';
import { env } from '../env.js';

const connection = { url: env.REDIS_URL };

export const analyzeQueue = new Queue('analyze', { connection });

export { Worker, connection };
