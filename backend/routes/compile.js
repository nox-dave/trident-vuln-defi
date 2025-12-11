import express from 'express';
import { asyncHandler } from '../middleware/errorHandler.js';
import { validateCompileRequest } from '../middleware/validation.js';
import { CompilationService } from '../services/compilationService.js';
import { log } from '../utils/logger.js';
import { config } from '../config/index.js';
import { mkdir } from 'fs/promises';

const router = express.Router();
const compilationService = new CompilationService(config.tempDir, config.contractsDir);

router.post('/compile', 
  validateCompileRequest,
  asyncHandler(async (req, res) => {
    const { code } = req.body;
    log.info('🔨', 'Compilation request received');
    
    await mkdir(config.tempDir, { recursive: true }).catch(() => {});
    
    const result = await compilationService.compile(code);
    res.json(result);
  })
);

export default router;

