import { createWalletClient, createPublicClient, http, parseAbi } from 'viem';
import { sepolia, baseSepolia, polygonAmoy } from 'viem/chains';
import { privateKeyToAccount } from 'viem/accounts';
import { log } from '../utils/logger.js';
import { config } from '../config/index.js';

const CHALLENGE_FACTORY_ABI = parseAbi([
  'function verifyAndRecord(address user, uint256 challengeId) external',
  'function getChallengeAddress(uint256 challengeId) external view returns (address)',
  'function updateChallengeAddress(uint256 challengeId, address newAddress) external',
  'function setChallengeImplementation(uint256 challengeId, address implementation) external',
  'function deployChallenge(uint256 challengeId) external returns (address)',
]);

const ICHALLENGE_ABI = parseAbi([
  'function isSolved() external view returns (bool)',
]);

const PROGRESS_TRACKER_ABI = parseAbi([
  'function recordSolution(address user, uint256 challengeId) external',
]);

const DEPLOYED_CHALLENGES = {
  1: '0x151868cFA58C4807eDf88B5203EbCfF93ac4c8D7',
};

const ENV_VAR_NAMES = {
  polygonAmoy: 'POLYGON_AMOY',
  baseSepolia: 'BASE_SEPOLIA',
  sepolia: 'SEPOLIA',
};

const NETWORK_NAMES = {
  polygonAmoy: 'Polygon Amoy',
  baseSepolia: 'Base Sepolia',
  sepolia: 'Sepolia',
};

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
    
    const envPrefix = ENV_VAR_NAMES[network] || 'POLYGON_AMOY';
    
    if (!this.factoryAddress) {
      log.warn('⚠️', `${envPrefix}_CHALLENGE_FACTORY_ADDRESS not configured. Verification will be skipped.`);
    }
    
    if (!this.privateKey) {
      log.warn('⚠️', `${envPrefix}_PRIVATE_KEY not configured. Verification will be skipped.`);
    }
  }

  async verifyOnSepolia(userAddress, challengeId) {
    if (!this.factoryAddress || !this.privateKey) {
      const envPrefix = ENV_VAR_NAMES[this.network] || 'POLYGON_AMOY';
      log.warn('⚠️', `${this.network} verification skipped: Missing configuration`);
      return {
        success: false,
        verified: false,
        error: `${this.network} verification not configured. Please set ${envPrefix}_CHALLENGE_FACTORY_ADDRESS and ${envPrefix}_PRIVATE_KEY environment variables.`
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
        const envPrefix = ENV_VAR_NAMES[this.network] || 'POLYGON_AMOY';
        throw new Error(`Invalid private key length: expected 64 hex characters, got ${privateKey.length}. Key starts with: ${masked}. Please check your ${envPrefix}_PRIVATE_KEY in .env file.`);
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

      let challengeAddress = null;
      try {
        challengeAddress = await publicClient.readContract({
          address: this.factoryAddress,
          abi: CHALLENGE_FACTORY_ABI,
          functionName: 'getChallengeAddress',
          args: [BigInt(challengeId)],
        });
      } catch (e) {
        log.warn('Could not read challenge address from factory, trying deployed address');
      }

      if (!challengeAddress || challengeAddress === '0x0000000000000000000000000000000000000000') {
        if (DEPLOYED_CHALLENGES[challengeId]) {
          challengeAddress = DEPLOYED_CHALLENGES[challengeId];
          log.info(`Using deployed challenge address for challenge ${challengeId}: ${challengeAddress}`);
          
          try {
            const isSolved = await publicClient.readContract({
              address: challengeAddress,
              abi: ICHALLENGE_ABI,
              functionName: 'isSolved',
            });
            
            if (!isSolved) {
              throw new Error(`Challenge not solved on-chain. You need to deploy your exploit contract and execute it to solve the challenge before verifying.`);
            }
            
            log.info(`Challenge ${challengeId} is solved, but not registered with factory. Attempting to register...`);
            
            try {
              log.info(`Attempting to register challenge using updateChallengeAddress...`);
              const registerHash = await walletClient.writeContract({
                address: this.factoryAddress,
                abi: CHALLENGE_FACTORY_ABI,
                functionName: 'updateChallengeAddress',
                args: [BigInt(challengeId), challengeAddress],
              });
              await publicClient.waitForTransactionReceipt({ hash: registerHash });
              log.info(`Successfully registered challenge ${challengeId} with factory`);
            } catch (registerError) {
              log.warn(`updateChallengeAddress failed: ${registerError.message}`);
              
              try {
                log.info(`Attempting to set implementation first, then deploy...`);
                const setImplHash = await walletClient.writeContract({
                  address: this.factoryAddress,
                  abi: CHALLENGE_FACTORY_ABI,
                  functionName: 'setChallengeImplementation',
                  args: [BigInt(challengeId), challengeAddress],
                });
                await publicClient.waitForTransactionReceipt({ hash: setImplHash });
                log.info(`Successfully set implementation`);
                
                const deployHash = await walletClient.writeContract({
                  address: this.factoryAddress,
                  abi: CHALLENGE_FACTORY_ABI,
                  functionName: 'deployChallenge',
                  args: [BigInt(challengeId)],
                });
                await publicClient.waitForTransactionReceipt({ hash: deployHash });
                log.info(`Successfully deployed challenge via factory`);
              } catch (deployError) {
                const networkName = NETWORK_NAMES[this.network] || 'Polygon Amoy';
                throw new Error(`Challenge is solved but could not be registered with factory. The factory at ${this.factoryAddress} may have been deployed by someone else, or you may need factory owner privileges. Challenge address: ${challengeAddress}. Try deploying your own factory or contact the factory owner. Error: ${registerError.message}`);
              }
            }
          } catch (checkError) {
            if (checkError.message.includes('not registered')) {
              throw checkError;
            }
            throw new Error(`Could not verify challenge: ${checkError.message}`);
          }
        }
      }

      try {
        await publicClient.simulateContract({
          address: this.factoryAddress,
          abi: CHALLENGE_FACTORY_ABI,
          functionName: 'verifyAndRecord',
          args: [userAddress, BigInt(challengeId)],
          account: account,
        });
      } catch (simulationError) {
        const errorMsg = simulationError.message || simulationError.toString();
        const networkName = NETWORK_NAMES[this.network] || 'Polygon Amoy';
        
        if (errorMsg.includes('ChallengeNotDeployed') || errorMsg.includes('Challenge not deployed')) {
          throw new Error(`Challenge not deployed. The challenge needs to be registered with the factory on ${networkName} first. Your challenge at ${DEPLOYED_CHALLENGES[challengeId] || 'unknown'} is solved but not registered.`);
        } else if (errorMsg.includes('ChallengeNotSolved') || errorMsg.includes('Challenge not solved')) {
          throw new Error(`Challenge not solved on-chain. You need to deploy your exploit contract on ${networkName} and execute it to solve the challenge before verifying.`);
        } else if (errorMsg.includes('insufficient funds') || errorMsg.includes('insufficient balance')) {
          throw new Error(`Insufficient funds. The verification account needs more ${networkName} MATIC to pay for gas fees.`);
        }
        throw simulationError;
      }

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
        const networkName = NETWORK_NAMES[this.network] || 'Polygon Amoy';
        if (errorMsg.includes('Challenge not solved')) {
          throw new Error(`Challenge not solved on-chain. You need to deploy your exploit contract on ${networkName} and execute it to solve the challenge before verifying.`);
        } else if (errorMsg.includes('Challenge not deployed')) {
          throw new Error(`Challenge not deployed. The challenge needs to be registered with the factory on ${networkName} first. Your challenge at 0x151868cFA58C4807eDf88B5203EbCfF93ac4c8D7 is solved but not registered.`);
        } else if (errorMsg.includes('insufficient funds') || errorMsg.includes('insufficient balance')) {
          throw new Error(`Insufficient funds. The verification account needs more ${networkName} MATIC to pay for gas fees.`);
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
      const networkName = NETWORK_NAMES[this.network] || 'Polygon Amoy';
      log.error('❌', `${networkName} verification error:`, error.message);
      
      let userFriendlyError = 'Unknown error during verification';
      
      const errorMessage = error.message || '';
      const errorString = error.toString();
      const currency = this.network === 'polygonAmoy' ? 'MATIC' : 'ETH';
      
      if (errorMessage.includes('Challenge not solved') || errorString.includes('Challenge not solved')) {
        userFriendlyError = `Challenge not solved on-chain. You need to deploy your exploit contract on ${networkName} and execute it to solve the challenge before verifying.`;
      } else if (errorMessage.includes('Challenge not deployed') || errorString.includes('Challenge not deployed')) {
        userFriendlyError = `Challenge not deployed. The challenge needs to be deployed on ${networkName} first.`;
      } else if (errorMessage.includes('insufficient funds') || errorMessage.includes('insufficient balance') || errorMessage.includes('OutOfFunds')) {
        userFriendlyError = `Insufficient funds. The verification account needs more ${networkName} ${currency} to pay for gas fees.`;
      } else if (errorMessage.includes('nonce') || errorMessage.includes('replacement transaction')) {
        userFriendlyError = 'Transaction nonce error. Please wait a moment and try again.';
      } else if (errorMessage.includes('revert') || errorString.includes('revert')) {
        const revertMatch = errorMessage.match(/reverted with the following reason:\s*(.+?)(?:\n|$)/i) || 
                           errorString.match(/reverted with the following reason:\s*(.+?)(?:\n|$)/i);
        if (revertMatch) {
          const reason = revertMatch[1].trim();
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

