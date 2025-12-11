import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateTestRequest } from '../middleware/validation.js';
import { TestingService } from '../services/testingService.js';
import { log } from '../utils/logger.js';
import { config } from '../config/index.js';
import { mkdir } from 'fs/promises';

const router = express.Router();
const testingService = new TestingService(config.contractsDir);

router.post('/test',
  validateTestRequest,
  asyncHandler(async (req, res) => {
    const { challengeId, exploitCode } = req.body;
    log.info('🧪', `Test request received for challenge ${challengeId}`);
    
    await mkdir(config.tempDir, { recursive: true }).catch(() => {});
    
    const result = await testingService.runTest(challengeId, exploitCode);
    res.json(result);
  })
);

export default router;

