import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateChallengeId } from '../middleware/validation.js';
import { ChallengeService } from '../services/challengeService.js';
import { log } from '../utils/logger.js';
import { config } from '../config/index.js';

const router = express.Router();
const challengeService = new ChallengeService(config.contractsDir);

router.get('/:id/template',
  validateChallengeId,
  asyncHandler(async (req, res) => {
    const challengeId = req.params.id;
    const result = await challengeService.getTemplate(challengeId);
    res.json(result);
  })
);

router.get('/:id/info',
  validateChallengeId,
  asyncHandler(async (req, res) => {
    const challengeId = req.params.id;
    const result = await challengeService.getChallengeInfo(challengeId);
    res.json(result);
  })
);

export default router;

