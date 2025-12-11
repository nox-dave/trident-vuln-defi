import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateTestRequest } from '../middleware/validation.js';
import { TestingService } from '../services/testingService.js';
import { VerificationService } from '../services/verificationService.js';
import { log } from '../utils/logger.js';
import { config } from '../config/index.js';
import { mkdir } from 'fs/promises';

const router = express.Router();
const testingService = new TestingService(config.contractsDir);
const verificationService = new VerificationService();

router.post('/test',
  validateTestRequest,
  asyncHandler(async (req, res) => {
    const { challengeId, exploitCode } = req.body;
    
    await mkdir(config.tempDir, { recursive: true }).catch(() => {});
    
    const result = await testingService.runTest(challengeId, exploitCode);
    res.json(result);
  })
);

router.post('/verify',
  asyncHandler(async (req, res) => {
    const { challengeId, userAddress } = req.body;
    
    if (!challengeId || !userAddress) {
      return res.status(400).json({ error: 'Missing challengeId or userAddress' });
    }
    
    const verificationResult = await verificationService.verifyOnSepolia(userAddress, Number(challengeId));
    
    if (verificationResult.verified) {
      log.info('✅', `Challenge ${challengeId} verified on Sepolia`);
    } else if (verificationResult.error) {
      log.warn('⚠️', `Verification failed: ${verificationResult.error}`);
    }
    
    res.json(verificationResult);
  })
);

export default router;

