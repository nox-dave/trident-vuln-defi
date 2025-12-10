import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, mkdir, rm, access } from 'fs/promises';
import { join } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '10mb' }));

const CONTRACTS_DIR = join(__dirname, '..', 'contracts');
const TEMP_DIR = join(__dirname, 'temp');

const CHALLENGE_MAP = {
  1: 'Challenge1_Vault',
  2: 'Challenge2_Access',
  3: 'Challenge3_Token',
  4: 'Challenge4_Lottery',
  5: 'Challenge5_Proxy',
};

function getChallengeFolder(challengeId) {
  const folder = CHALLENGE_MAP[challengeId];
  if (!folder) {
    throw new Error(`Invalid challenge ID: ${challengeId}`);
  }
  return folder;
}

app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    contractsDir: CONTRACTS_DIR,
    timestamp: new Date().toISOString()
  });
});

async function ensureTempDir() {
  try {
    await mkdir(TEMP_DIR, { recursive: true });
  } catch (error) {
    if (error.code !== 'EEXIST') throw error;
  }
}

async function cleanupTempDir() {
  try {
    await rm(TEMP_DIR, { recursive: true, force: true });
  } catch (error) {
  }
}

app.post('/api/compile', async (req, res) => {
  const { code } = req.body;

  if (!code) {
    return res.status(400).json({ error: 'Missing code' });
  }

  try {
    await ensureTempDir();
    
    const input = {
      language: 'Solidity',
      sources: {
        'contract.sol': {
          content: code
        }
      },
      settings: {
        outputSelection: {
          '*': {
            '*': ['abi', 'evm.bytecode', 'evm.bytecode.object']
          }
        }
      }
    };

    const inputJson = JSON.stringify(input);
    const tempInputFile = join(TEMP_DIR, `compile_input_${Date.now()}.json`);
    await writeFile(tempInputFile, inputJson, 'utf-8');

    try {
      const { stdout, stderr } = await execAsync(`solc --standard-json < "${tempInputFile}"`, {
        cwd: CONTRACTS_DIR,
        timeout: 30000,
        maxBuffer: 10 * 1024 * 1024,
        shell: '/bin/bash'
      });

      const output = JSON.parse(stdout);
      
      await rm(tempInputFile).catch(() => {});
      
      return res.json({
        output: output,
        errors: output.errors || []
      });
    } catch (compileError) {
      await rm(tempInputFile).catch(() => {});
      
      if (compileError.stdout) {
        try {
          const output = JSON.parse(compileError.stdout);
          return res.json({
            output: output,
            errors: output.errors || []
          });
        } catch (e) {
          return res.status(500).json({
            error: 'Compilation failed',
            details: compileError.message || e.message,
            output: compileError.stdout || compileError.stderr || ''
          });
        }
      }
      
      return res.status(500).json({
        error: 'Compilation failed. Make sure solc is installed.',
        details: compileError.message,
        stderr: compileError.stderr || ''
      });
    }
  } catch (error) {
    return res.status(500).json({
      error: 'Compilation error',
      details: error.message
    });
  }
});

app.post('/api/test', async (req, res) => {
  const { challengeId, exploitCode } = req.body;

  if (!challengeId || !exploitCode) {
    return res.status(400).json({ error: 'Missing challengeId or exploitCode' });
  }

  try {
    const challengeFolder = getChallengeFolder(Number(challengeId));
    const challengeFile = `${challengeFolder}.sol`;
    const testFile = `${challengeFolder}.t.sol`;
    
    const challengePath = join(CONTRACTS_DIR, 'src', 'challenges', challengeFolder, challengeFile);
    const testPath = join(CONTRACTS_DIR, 'src', 'challenges', challengeFolder, testFile);

    await ensureTempDir();

    let challengeContent;
    let testContent;
    
    try {
      challengeContent = await readFile(challengePath, 'utf-8');
      testContent = await readFile(testPath, 'utf-8');
    } catch (fileError) {
      console.error('File read error:', fileError);
      return res.status(404).json({ 
        error: 'Challenge files not found',
        details: fileError.message,
        challengePath,
        testPath
      });
    }

    const exploitContractName = extractExploitContractName(challengeContent);
    if (!exploitContractName) {
      return res.status(400).json({ error: 'Could not find exploit contract name in challenge file' });
    }

    const exploitContractOnly = extractExploitContractFromUserCode(exploitCode, exploitContractName);
    if (!exploitContractOnly) {
      console.error('Failed to extract contract. User code:', exploitCode.substring(0, 500));
      return res.status(400).json({ error: 'Could not extract exploit contract from user code. Make sure your contract is properly formatted with matching braces.' });
    }
    
    // Log extracted contract for debugging
    console.log('Extracted contract:', exploitContractOnly.substring(0, 200));

    const updatedChallengeContent = replaceExploitContract(challengeContent, exploitContractOnly, exploitContractName);
    if (!updatedChallengeContent) {
      return res.status(400).json({ error: 'Failed to replace exploit contract in challenge file' });
    }

    const backupPath = join(CONTRACTS_DIR, 'src', 'challenges', challengeFolder, challengeFile + '.backup');
    const originalContent = challengeContent;
    
    try {
      await writeFile(backupPath, originalContent, 'utf-8');
      await writeFile(challengePath, updatedChallengeContent, 'utf-8');

      const testName = extractTestFunctionName(testContent);
      const testCommand = `cd ${CONTRACTS_DIR} && forge test --match-test ${testName} --match-path "*${testFile}" 2>&1`;

      let stdout = '';
      let stderr = '';
      let passed = false;
      let failed = false;

      try {
        const result = await execAsync(testCommand, {
      cwd: CONTRACTS_DIR,
      timeout: 30000,
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
      return res.json({
        success: false,
        passed: false,
        output: stdout + stderr,
        error: extractError(stdout + stderr)
      });
    }

    return res.json({
      success: true,
      passed: passed && !failed,
      output: stdout + stderr
    });

  } catch (error) {
    try {
        const backupPath = join(CONTRACTS_DIR, 'src', 'challenges', challengeFolder, challengeFile + '.backup');
        try {
      const backupContent = await readFile(backupPath, 'utf-8');
          await writeFile(challengePath, backupContent, 'utf-8');
      await rm(backupPath);
    } catch (restoreError) {
      console.error('Failed to restore original file:', restoreError);
          await writeFile(challengePath, originalContent, 'utf-8');
        }
      } catch (restoreError2) {
        console.error('Failed to restore original file (second attempt):', restoreError2);
      }
      
      return res.status(500).json({
        success: false,
        passed: false,
        error: error.message,
        output: error.stdout || error.stderr || '',
        details: error.stack
      });
    }

  } catch (error) {
    console.error('Test endpoint error:', error);
    return res.status(500).json({
      success: false,
      passed: false,
      error: error.message,
      output: error.stdout || error.stderr || '',
      details: error.stack
    });
  }
});

app.get('/api/challenge/:id/template', async (req, res) => {
  const challengeId = req.params.id;

  try {
    const challengeFolder = getChallengeFolder(Number(challengeId));
    const templateFile = `Challenge${challengeId}_Template.sol`;
    const templatePath = join(CONTRACTS_DIR, 'src', 'challenges', challengeFolder, templateFile);

  try {
      await access(templatePath);
    } catch {
      return res.status(404).json({ 
        error: 'Template file not found',
        path: templatePath
      });
    }

    const templateContent = await readFile(templatePath, 'utf-8');
    const interfaceCode = extractInterface(templateContent);
    
    return res.json({ 
      template: templateContent,
      interface: interfaceCode
    });
  } catch (error) {
    console.error(`Error loading template for challenge ${challengeId}:`, error.message);
    return res.status(404).json({ 
      error: 'Challenge template not found',
      details: error.message
    });
  }
});

app.get('/api/challenge/:id/info', async (req, res) => {
  const challengeId = req.params.id;

  try {
    const challengeFolder = getChallengeFolder(Number(challengeId));
    const challengeFile = `${challengeFolder}.sol`;
    const challengePath = join(CONTRACTS_DIR, 'src', 'challenges', challengeFolder, challengeFile);

    const content = await readFile(challengePath, 'utf-8');
    const exploitContractName = extractExploitContractName(content);
    const vulnerableContractName = extractVulnerableContractName(content);
    
    return res.json({
      challengeId: Number(challengeId),
      challengeFolder,
      exploitContractName,
      vulnerableContractName,
      hasInterface: !!extractInterface(content)
    });
  } catch (error) {
    return res.status(404).json({
      error: 'Challenge not found',
      details: error.message
    });
  }
});

function extractExploitContractName(content) {
  const match = content.match(/contract\s+(\w+Exploit)\s+/);
  return match ? match[1] : null;
}

function extractVulnerableContractName(content) {
  const exploitMatch = content.match(/contract\s+\w+Exploit\s+[^{]*\{[\s\S]*?\}\s*contract\s+(\w+)\s+/);
  return exploitMatch ? exploitMatch[1] : null;
}

function extractInterface(content) {
  const match = content.match(/(interface\s+\w+\s+[^{]*\{[\s\S]*?\})/);
  return match ? match[1] : '';
}

function extractExploitContractFromUserCode(userCode, contractName) {
  const lines = userCode.split('\n');
  let contractStart = -1;
  let braceCount = 0;
  let contractEnd = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (contractStart === -1 && line.match(new RegExp(`contract\\s+${contractName}\\s*[\\{;]`))) {
      contractStart = i;
      braceCount = (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
    } else if (contractStart !== -1) {
      braceCount += (line.match(/\{/g) || []).length - (line.match(/\}/g) || []).length;
      if (braceCount === 0) {
        contractEnd = i;
        break;
      }
    }
  }
  
  if (contractStart !== -1 && contractEnd !== -1) {
    const extracted = lines.slice(contractStart, contractEnd + 1).join('\n');
    // Ensure the extracted contract is valid (has opening and closing braces)
    const openBraces = (extracted.match(/\{/g) || []).length;
    const closeBraces = (extracted.match(/\}/g) || []).length;
    if (openBraces === closeBraces && openBraces > 0) {
      return extracted;
    }
  }
  
  // Fallback: try regex matching
  const contractMatch = userCode.match(new RegExp(
    `contract\\s+${contractName}[\\s\\S]*?\\n\\}`,
    'g'
  ));
  if (contractMatch) {
    return contractMatch[0];
  }
  
  // Last resort: return the whole user code if it contains the contract name
  if (userCode.includes(`contract ${contractName}`)) {
    return userCode;
  }
  
  return null;
}

function replaceExploitContract(content, newExploitContract, contractName) {
  const lines = content.split('\n');
  let contractStart = -1;
  let braceCount = 0;
  let contractEnd = -1;
  
  for (let i = 0; i < lines.length; i++) {
    if (contractStart === -1 && lines[i].match(new RegExp(`contract\\s+${contractName}`))) {
      contractStart = i;
      braceCount = (lines[i].match(/\{/g) || []).length - (lines[i].match(/\}/g) || []).length;
    } else if (contractStart !== -1) {
      braceCount += (lines[i].match(/\{/g) || []).length - (lines[i].match(/\}/g) || []).length;
      if (braceCount === 0) {
        contractEnd = i;
        break;
      }
    }
  }
  
  if (contractStart !== -1 && contractEnd !== -1) {
    const before = lines.slice(0, contractStart).join('\n');
    const after = lines.slice(contractEnd + 1).join('\n');
    return before + '\n' + newExploitContract.trim() + '\n' + after;
  }
  
  const exploitContractRegex = new RegExp(
    `contract\\s+${contractName}\\s+[^{]*\\{[\\s\\S]*?\\n\\}`,
    'g'
  );
  
  return content.replace(exploitContractRegex, newExploitContract.trim());
}

function extractTestFunctionName(testContent) {
  const match = testContent.match(/function\s+(test_\w+)\s*\(/);
  return match ? match[1] : 'test_pwn';
}

function extractError(output) {
  const errorMatch = output.match(/Error[:\s]+([^\n]+)/i);
  return errorMatch ? errorMatch[1] : 'Test failed';
}

app.listen(PORT, () => {
  console.log(`Hybrid Test API server running on port ${PORT}`);
  console.log(`Contracts directory: ${CONTRACTS_DIR}`);
});
