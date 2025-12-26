import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, rm } from 'fs/promises';
import { join } from 'path';
import { log } from '../utils/logger.js';
import { config } from '../config/index.js';
import {
  extractTestFunctionName,
  extractError,
  getChallengeFolder
} from '../utils/contractExtractor.js';
import { getChallengeHandler } from './challengeHandlers/index.js';

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

    const challengeIdNum = Number(challengeId);
    
    const handler = getChallengeHandler(challengeIdNum);
    log.info('🔍', `Challenge ${challengeIdNum}: Using handler ${handler.constructor.name}`);
    
    const result = await handler.processChallenge(challengeContent, exploitCode);
    
    const contractToReplace = result.contractToReplace;
    const contractName = result.contractName;
    const updatedChallengeContent = result.updatedContent;
    
    const openBraces = (contractToReplace.match(/\{/g) || []).length;
    const closeBraces = (contractToReplace.match(/\}/g) || []).length;
    
    if (openBraces !== closeBraces) {
      throw new Error(`Extracted contract has mismatched braces. Found ${openBraces} opening braces and ${closeBraces} closing braces. Please ensure all functions have matching opening and closing braces.`);
    }

    if (!updatedChallengeContent) {
      throw new Error(`Failed to replace ${contractName} contract in challenge file`);
    }

    const backupPath = join(this.contractsDir, 'src', 'challenges', challengeFolder, challengeFile + '.backup');
    const originalContent = challengeContent;
    
    try {
      await writeFile(backupPath, originalContent, 'utf-8');
      await writeFile(challengePath, updatedChallengeContent, 'utf-8');

      let testCommand;
      if (challengeIdNum === 2) {
        testCommand = `cd ${this.contractsDir} && forge test --match-path "*${testFile}" 2>&1`;
      } else {
        const testName = extractTestFunctionName(testContent);
        testCommand = `cd ${this.contractsDir} && forge test --match-test ${testName} --match-path "*${testFile}" 2>&1`;
      }

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

