import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { mkdir } from 'fs/promises';
import { config } from './config/index.js';
import { log } from './utils/logger.js';
import { errorHandler } from './middleware/errorHandler.js';
import compileRoutes from './routes/compile.js';
import testRoutes from './routes/test.js';
import challengeRoutes from './routes/challenge.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.use('/api', compileRoutes);
app.use('/api', testRoutes);
app.use('/api/challenge', challengeRoutes);

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    contractsDir: config.contractsDir,
    timestamp: new Date().toISOString()
  });
});

app.use(errorHandler);

async function startServer() {
  try {
    await mkdir(config.tempDir, { recursive: true });
    
    app.listen(config.port, () => {
      log.info('🚀', `Server running on port ${config.port}`);
    });
  } catch (error) {
    log.error('❌', 'Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
