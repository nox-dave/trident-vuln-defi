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
  },
  network: process.env.NETWORK || 'polygonAmoy',
  polygonAmoy: {
    rpcUrl: process.env.POLYGON_AMOY_RPC_URL || 'https://rpc-amoy.polygon.technology',
    challengeFactoryAddress: process.env.POLYGON_AMOY_CHALLENGE_FACTORY_ADDRESS || '0xdB51e44657D578BA9b8Bf48C6fD7F7200884Fb66',
    privateKey: process.env.POLYGON_AMOY_PRIVATE_KEY || process.env.PRIVATE_KEY || '',
    progressTrackerAddress: process.env.POLYGON_AMOY_PROGRESS_TRACKER_ADDRESS || '0x2B85A7801d11397DfCF28539841da379803E6da7',
  },
  baseSepolia: {
    rpcUrl: process.env.BASE_SEPOLIA_RPC_URL || 'https://sepolia.base.org',
    challengeFactoryAddress: process.env.BASE_SEPOLIA_CHALLENGE_FACTORY_ADDRESS || '',
    privateKey: process.env.BASE_SEPOLIA_PRIVATE_KEY || process.env.SEPOLIA_PRIVATE_KEY || '',
  },
  sepolia: {
    rpcUrl: process.env.SEPOLIA_RPC_URL || 'https://rpc.sepolia.org',
    challengeFactoryAddress: process.env.SEPOLIA_CHALLENGE_FACTORY_ADDRESS || '',
    privateKey: process.env.SEPOLIA_PRIVATE_KEY || '',
  }
};

