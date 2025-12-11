import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, rm } from 'fs/promises';
import { join } from 'path';
import { log } from '../utils/logger.js';
import { config } from '../config/index.js';

const execAsync = promisify(exec);

export class CompilationService {
  constructor(tempDir, contractsDir) {
    this.tempDir = tempDir;
    this.contractsDir = contractsDir;
  }

  async compile(code) {
    const input = {
      language: 'Solidity',
      sources: { 'contract.sol': { content: code } },
      settings: {
        outputSelection: {
          '*': { '*': ['abi', 'evm.bytecode', 'evm.bytecode.object'] }
        }
      }
    };

    const tempInputFile = join(this.tempDir, `compile_input_${Date.now()}.json`);
    
    try {
      await writeFile(tempInputFile, JSON.stringify(input), 'utf-8');
      
      const { stdout, stderr } = await execAsync(
        `solc --standard-json < "${tempInputFile}"`,
        {
          cwd: this.contractsDir,
          timeout: config.compilationTimeout,
          maxBuffer: 10 * 1024 * 1024,
          shell: '/bin/bash'
        }
      );

      const output = JSON.parse(stdout);
      await rm(tempInputFile).catch(() => {});
      
      return { output, errors: output.errors || [] };
    } catch (error) {
      await rm(tempInputFile).catch(() => {});
      
      if (error.stdout) {
        try {
          const output = JSON.parse(error.stdout);
          return { output, errors: output.errors || [] };
        } catch (e) {
          log.error('❌', 'Compilation failed:', error.message);
          throw new Error(`Compilation failed: ${error.message || e.message}`);
        }
      }
      
      log.error('❌', 'Compilation failed:', error.message);
      throw new Error(`Compilation failed. Make sure solc is installed. ${error.message}`);
    }
  }
}

