import { readContract, writeContract, waitForTransactionReceipt } from 'wagmi/actions'
import { parseAbi } from 'viem'

export const CHALLENGE_FACTORY_ABI = parseAbi([
  'function deployChallenge(uint256 challengeId) external returns (address)',
  'function verifyAndRecord(address user, uint256 challengeId) external',
  'function getChallengeAddress(uint256 challengeId) external view returns (address)',
  'event ChallengeDeployed(uint256 indexed challengeId, address indexed challengeAddress)',
])

export const PROGRESS_TRACKER_ABI = parseAbi([
  'function hasSolved(address user, uint256 challengeId) external view returns (bool)',
  'function getSolvedChallenges(address user) external view returns (uint256[])',
  'function getSolvedCount(address user) external view returns (uint256)',
])

export const CHALLENGE_ABI = parseAbi([
  'function isSolved() external view returns (bool)',
  'function challengeId() external pure returns (uint256)',
  'function challengeName() external pure returns (string memory)',
  'function difficulty() external pure returns (string memory)',
  'function deposit() external payable',
  'function withdraw(uint256 amount) external',
  'function balances(address) external view returns (uint256)',
])

export async function deployChallenge(config, factoryAddress, challengeId) {
  const hash = await writeContract(config, {
    address: factoryAddress,
    abi: CHALLENGE_FACTORY_ABI,
    functionName: 'deployChallenge',
    args: [BigInt(challengeId)],
  })
  
  const receipt = await waitForTransactionReceipt(config, { hash })
  
  const event = receipt.logs.find(log => {
    try {
      return log.topics[0] === '0x...'
    } catch {
      return false
    }
  })
  
  if (event) {
    return event.args.challengeAddress
  }
  
  const address = await readContract(config, {
    address: factoryAddress,
    abi: CHALLENGE_FACTORY_ABI,
    functionName: 'getChallengeAddress',
    args: [BigInt(challengeId)],
  })
  
  return address
}

export async function verifySolution(config, factoryAddress, userAddress, challengeId) {
  const hash = await writeContract(config, {
    address: factoryAddress,
    abi: CHALLENGE_FACTORY_ABI,
    functionName: 'verifyAndRecord',
    args: [userAddress, BigInt(challengeId)],
  })
  
  await waitForTransactionReceipt(config, { hash })
  return true
}

export async function checkSolved(config, trackerAddress, userAddress, challengeId) {
  return await readContract(config, {
    address: trackerAddress,
    abi: PROGRESS_TRACKER_ABI,
    functionName: 'hasSolved',
    args: [userAddress, BigInt(challengeId)],
  })
}

export async function getChallengeAddress(config, factoryAddress, challengeId) {
  return await readContract(config, {
    address: factoryAddress,
    abi: CHALLENGE_FACTORY_ABI,
    functionName: 'getChallengeAddress',
    args: [BigInt(challengeId)],
  })
}

export async function deployExploitContract(config, bytecode, abi, constructorArgs = []) {
  const hash = await writeContract(config, {
    abi: abi,
    bytecode: bytecode,
    args: constructorArgs,
  })
  
  const receipt = await waitForTransactionReceipt(config, { hash })
  return receipt.contractAddress
}
