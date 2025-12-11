import { createWalletClient, createPublicClient, http, parseAbi } from 'viem';
import { sepolia, baseSepolia, polygonAmoy } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { log } from '../utils/logger.js';
import { config } from '../config/index.js';

const CHALLENGE_FACTORY_ABI = parseAbi([
  'function verifyAndRecord(address user, uint256 challengeId) external',
]);

export class VerificationService {
  constructor() {
    const network = config.network || 'baseSepolia';
    const networkConfig = config[network] || config.baseSepolia;
    
    this.network = network;
    this.rpcUrl = networkConfig.rpcUrl;
    this.factoryAddress = networkConfig.challengeFactoryAddress;
    this.privateKey = networkConfig.privateKey;
    
    const chainMap = {
      polygonAmoy: polygonAmoy,
      baseSepolia: baseSepolia,
      sepolia: sepolia,
    };
    this.chain = chainMap[network] || polygonAmoy;
    
    if (!this.factoryAddress) {
      log.warn('⚠️', `${network.toUpperCase()}_CHALLENGE_FACTORY_ADDRESS not configured. Verification will be skipped.`);
    }
    
    if (!this.privateKey) {
      log.warn('⚠️', `${network.toUpperCase()}_PRIVATE_KEY not configured. Verification will be skipped.`);
    }
  }

  async verifyOnSepolia(userAddress, challengeId) {
    if (!this.factoryAddress || !this.privateKey) {
      log.warn('⚠️', `${this.network} verification skipped: Missing configuration`);
      return {
        success: false,
        verified: false,
        error: `${this.network} verification not configured. Please set ${this.network.toUpperCase()}_CHALLENGE_FACTORY_ADDRESS and ${this.network.toUpperCase()}_PRIVATE_KEY environment variables.`
      };
    }

    if (!userAddress) {
      return {
        success: false,
        verified: false,
        error: 'User address is required for verification'
      };
    }

    try {
      let privateKey = this.privateKey.trim();
      
      if (privateKey.includes('#')) {
        privateKey = privateKey.split('#')[0].trim();
      }
      
      if (privateKey.startsWith('0x')) {
        privateKey = privateKey.slice(2);
      }
      
      privateKey = privateKey.trim();
      
      if (privateKey.length !== 64) {
        const masked = privateKey.length > 8 
          ? `${privateKey.substring(0, 4)}...${privateKey.substring(privateKey.length - 4)}` 
          : '***';
        throw new Error(`Invalid private key length: expected 64 hex characters, got ${privateKey.length}. Key starts with: ${masked}. Please check your SEPOLIA_PRIVATE_KEY in .env file.`);
      }
      
      if (!/^[0-9a-fA-F]+$/.test(privateKey)) {
        throw new Error('Invalid private key format: must contain only hexadecimal characters (0-9, a-f, A-F)');
      }
      
      const account = privateKeyToAccount(`0x${privateKey}`);
      
      const walletClient = createWalletClient({
        account,
        chain: this.chain,
        transport: http(this.rpcUrl),
      });

      const publicClient = createPublicClient({
        chain: this.chain,
        transport: http(this.rpcUrl),
      });

      let hash;
      try {
        hash = await walletClient.writeContract({
          address: this.factoryAddress,
          abi: CHALLENGE_FACTORY_ABI,
          functionName: 'verifyAndRecord',
          args: [userAddress, BigInt(challengeId)],
        });
      } catch (contractError) {
        const errorMsg = contractError.message || contractError.toString();
        const networkName = this.network === 'baseSepolia' ? 'Base Sepolia' : 'Sepolia';
        if (errorMsg.includes('Challenge not solved')) {
          throw new Error(`Challenge not solved on-chain. You need to deploy your exploit contract on ${networkName} and execute it to solve the challenge before verifying.`);
        } else if (errorMsg.includes('Challenge not deployed')) {
          throw new Error(`Challenge not deployed. The challenge needs to be deployed on ${networkName} first.`);
        } else if (errorMsg.includes('insufficient funds') || errorMsg.includes('insufficient balance')) {
          throw new Error(`Insufficient funds. The verification account needs more ${networkName} ETH to pay for gas fees.`);
        }
        throw contractError;
      }

      const receipt = await publicClient.waitForTransactionReceipt({ hash });

      if (receipt.status === 'success') {
        return {
          success: true,
          verified: true,
          transactionHash: hash,
          blockNumber: receipt.blockNumber.toString(),
        };
      } else {
        return {
          success: false,
          verified: false,
          error: 'Transaction failed',
          transactionHash: hash,
        };
      }
    } catch (error) {
      log.error('❌', 'Sepolia verification error:', error.message);
      
      let userFriendlyError = 'Unknown error during verification';
      
      const errorMessage = error.message || '';
      const errorString = error.toString();
      
      const networkName = this.network === 'baseSepolia' ? 'Base Sepolia' : 'Sepolia';
      
      if (errorMessage.includes('Challenge not solved') || errorString.includes('Challenge not solved')) {
        userFriendlyError = `Challenge not solved on-chain. You need to deploy your exploit contract on ${networkName} and execute it to solve the challenge before verifying.`;
      } else if (errorMessage.includes('Challenge not deployed') || errorString.includes('Challenge not deployed')) {
        userFriendlyError = `Challenge not deployed. The challenge needs to be deployed on ${networkName} first.`;
      } else if (errorMessage.includes('insufficient funds') || errorMessage.includes('insufficient balance') || errorMessage.includes('OutOfFunds')) {
        userFriendlyError = `Insufficient funds. The verification account needs more ${networkName} ETH to pay for gas fees.`;
      } else if (errorMessage.includes('nonce') || errorMessage.includes('replacement transaction')) {
        userFriendlyError = 'Transaction nonce error. Please wait a moment and try again.';
      } else if (errorMessage.includes('revert') || errorString.includes('revert')) {
        const revertMatch = errorMessage.match(/reverted with the following reason:\s*(.+?)(?:\n|$)/i) || 
                           errorString.match(/reverted with the following reason:\s*(.+?)(?:\n|$)/i);
        if (revertMatch) {
          const reason = revertMatch[1].trim();
          const networkNames = {
            polygonAmoy: 'Polygon Amoy',
            baseSepolia: 'Base Sepolia',
            sepolia: 'Sepolia',
          };
          const networkName = networkNames[this.network] || 'Polygon Amoy';
          if (reason === 'Challenge not solved') {
            userFriendlyError = `Challenge not solved on-chain. You need to deploy your exploit contract on ${networkName} and execute it to solve the challenge before verifying.`;
          } else if (reason === 'Challenge not deployed') {
            userFriendlyError = `Challenge not deployed. The challenge needs to be deployed on ${networkName} first.`;
          } else {
            userFriendlyError = `Transaction reverted: ${reason}`;
          }
        } else {
          userFriendlyError = 'Transaction reverted. The verification failed on-chain.';
        }
      } else if (errorMessage.includes('network') || errorMessage.includes('connection')) {
        userFriendlyError = 'Network error. Please check your internet connection and try again.';
      } else if (errorMessage.includes('timeout')) {
        userFriendlyError = 'Request timeout. The network may be slow. Please try again.';
      } else {
        userFriendlyError = errorMessage || 'Unknown error during verification';
      }
      
      return {
        success: false,
        verified: false,
        error: userFriendlyError,
      };
    }
  }
}

