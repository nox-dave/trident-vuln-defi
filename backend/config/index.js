import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export const config = {
  port: process.env.PORT || 3001,
  contractsDir: process.env.CONTRACTS_DIR || join(__dirname, '..', '..', 'contracts'),
  tempDir: process.env.TEMP_DIR || join(__dirname, '..', 'temp'),
  maxCodeSize: parseInt(process.env.MAX_CODE_SIZE || '100000'),
  compilationTimeout: parseInt(process.env.COMPILATION_TIMEOUT || '30000'),
  testTimeout: parseInt(process.env.TEST_TIMEOUT || '30000'),
  nodeEnv: process.env.NODE_ENV || 'development',
  challengeMap: {
    1: 'Challenge1_Vault',
    2: 'Challenge2_Access',
    3: 'Challenge3_Token',
    4: 'Challenge4_Lottery',
    5: 'Challenge5_Proxy',
  }
};

