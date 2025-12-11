import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, rm } from 'fs/promises';
import { join } from 'path';
import { log } from '../utils/logger.js';
import { config } from '../config/index.js';
import {
  extractExploitContractName,
  extractExploitContractFromUserCode,
  replaceExploitContract,
  extractTestFunctionName,
  extractError,
  getChallengeFolder
} from '../utils/contractExtractor.js';

const execAsync = promisify(exec);

export class TestingService {
  constructor(contractsDir) {
    this.contractsDir = contractsDir;
  }

  async runTest(challengeId, exploitCode) {
    const challengeFolder = getChallengeFolder(Number(challengeId), config.challengeMap);
    const challengeFile = `${challengeFolder}.sol`;
    const testFile = `${challengeFolder}.t.sol`;
    
    const challengePath = join(this.contractsDir, 'src', 'challenges', challengeFolder, challengeFile);
    const testPath = join(this.contractsDir, 'src', 'challenges', challengeFolder, testFile);

    let challengeContent;
    let testContent;
    
    try {
      challengeContent = await readFile(challengePath, 'utf-8');
      testContent = await readFile(testPath, 'utf-8');
    } catch (fileError) {
      log.error('❌', 'File read error:', fileError);
      throw new Error(`Challenge files not found: ${fileError.message}`);
    }

    const exploitContractName = extractExploitContractName(challengeContent);
    if (!exploitContractName) {
      throw new Error('Could not find exploit contract name in challenge file');
    }

    const exploitContractOnly = extractExploitContractFromUserCode(exploitCode, exploitContractName);
    if (!exploitContractOnly) {
      log.error('❌', 'Failed to extract contract. User code:', exploitCode.substring(0, 500));
      throw new Error('Could not extract exploit contract from user code. Make sure your contract is properly formatted with matching braces.');
    }
    
    log.info('📝', 'Extracted contract (full):', exploitContractOnly);
    const openBraces = (exploitContractOnly.match(/\{/g) || []).length;
    const closeBraces = (exploitContractOnly.match(/\}/g) || []).length;
    log.info('🔍', `Brace count - Open: ${openBraces}, Close: ${closeBraces}`);
    
    if (openBraces !== closeBraces) {
      throw new Error(`Extracted contract has mismatched braces. Found ${openBraces} opening braces and ${closeBraces} closing braces. Please ensure all functions have matching opening and closing braces.`);
    }
    
    if (!exploitContractOnly.includes('receive()') && !exploitContractOnly.includes('receive ()')) {
      log.warn('⚠️', 'Warning: Extracted contract does not appear to have a receive() function');
    }
    
    if (!exploitContractOnly.includes('function pwn()')) {
      log.warn('⚠️', 'Warning: Extracted contract does not appear to have a pwn() function');
    }

    const updatedChallengeContent = replaceExploitContract(challengeContent, exploitContractOnly, exploitContractName);
    if (!updatedChallengeContent) {
      throw new Error('Failed to replace exploit contract in challenge file');
    }

    const backupPath = join(this.contractsDir, 'src', 'challenges', challengeFolder, challengeFile + '.backup');
    const originalContent = challengeContent;
    
    try {
      await writeFile(backupPath, originalContent, 'utf-8');
      await writeFile(challengePath, updatedChallengeContent, 'utf-8');

      const testName = extractTestFunctionName(testContent);
      const testCommand = `cd ${this.contractsDir} && forge test --match-test ${testName} --match-path "*${testFile}" 2>&1`;

      let stdout = '';
      let stderr = '';
      let passed = false;
      let failed = false;

      try {
        const result = await execAsync(testCommand, {
          cwd: this.contractsDir,
          timeout: config.testTimeout,
          maxBuffer: 10 * 1024 * 1024
        });
        stdout = result.stdout || '';
        stderr = result.stderr || '';
        passed = stdout.includes('Test result: ok') || stdout.includes('[PASS]');
        failed = stdout.includes('Test result: FAILED') || stdout.includes('[FAIL]') || stderr.includes('Error');
      } catch (execError) {
        stdout = execError.stdout || '';
        stderr = execError.stderr || '';
        passed = stdout.includes('Test result: ok') || stdout.includes('[PASS]');
        failed = !passed;
      }

      await writeFile(challengePath, originalContent, 'utf-8');
      try {
        await rm(backupPath);
      } catch (e) {}

      if (failed && !passed) {
        return {
          success: false,
          passed: false,
          output: stdout + stderr,
          error: extractError(stdout + stderr)
        };
      }

      return {
        success: true,
        passed: passed && !failed,
        output: stdout + stderr
      };
    } catch (error) {
      try {
        const backupPath = join(this.contractsDir, 'src', 'challenges', challengeFolder, challengeFile + '.backup');
        try {
          const backupContent = await readFile(backupPath, 'utf-8');
          await writeFile(challengePath, backupContent, 'utf-8');
          await rm(backupPath);
        } catch (restoreError) {
          log.error('❌', 'Failed to restore original file:', restoreError);
          await writeFile(challengePath, originalContent, 'utf-8');
        }
      } catch (restoreError2) {
        log.error('❌', 'Failed to restore original file (second attempt):', restoreError2);
      }
      
      throw error;
    }
  }
}

