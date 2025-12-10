import express from 'express';
import cors from 'cors';
import { exec } from 'child_process';
import { promisify } from 'util';
import { writeFile, readFile, mkdir, rm } from 'fs/promises';
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

app.post('/api/test', async (req, res) => {
  const { challengeId, exploitCode } = req.body;

  if (!challengeId || !exploitCode) {
    return res.status(400).json({ error: 'Missing challengeId or exploitCode' });
  }

  const challengeFile = `sol-${String(challengeId).padStart(3, '0')}.sol`;
  const testFile = `sol-${String(challengeId).padStart(3, '0')}.test.sol`;
  const challengePath = join(CONTRACTS_DIR, 'src', 'challenges', challengeFile);
  const testPath = join(CONTRACTS_DIR, 'test', testFile);

  try {
    await ensureTempDir();

    const challengeContent = await readFile(challengePath, 'utf-8');
    const testContent = await readFile(testPath, 'utf-8');

    const exploitContractName = extractExploitContractName(challengeContent);
    if (!exploitContractName) {
      return res.status(400).json({ error: 'Could not find exploit contract name' });
    }

    const exploitContractOnly = extractExploitContractFromUserCode(exploitCode, exploitContractName);
    const updatedChallengeContent = replaceExploitContract(challengeContent, exploitContractOnly, exploitContractName);

    const backupPath = join(CONTRACTS_DIR, 'src', challengeFile + '.backup');
    const originalContent = challengeContent;
    
    try {
      await writeFile(backupPath, originalContent, 'utf-8');
      await writeFile(join(CONTRACTS_DIR, 'src', 'challenges', challengeFile), updatedChallengeContent, 'utf-8');

      const testName = extractTestFunctionName(testContent);
      const testCommand = `cd ${CONTRACTS_DIR} && forge test --match-test ${testName} --match-path "${join(CONTRACTS_DIR, 'test', testFile)}" 2>&1`;

    const { stdout, stderr } = await execAsync(testCommand, {
      cwd: CONTRACTS_DIR,
      timeout: 30000,
      maxBuffer: 10 * 1024 * 1024
    });

    const passed = stdout.includes('Test result: ok') || stdout.includes('[PASS]');
    const failed = stdout.includes('Test result: FAILED') || stdout.includes('[FAIL]') || stderr.includes('Error');

      await writeFile(join(CONTRACTS_DIR, 'src', 'challenges', challengeFile), originalContent, 'utf-8');
      try {
        await rm(backupPath);
      } catch (e) {}
    } catch (restoreError) {
      console.error('Failed to restore original file:', restoreError);
    }

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
      const backupPath = join(CONTRACTS_DIR, 'src', 'challenges', challengeFile + '.backup');
      const backupContent = await readFile(backupPath, 'utf-8');
      await writeFile(join(CONTRACTS_DIR, 'src', 'challenges', challengeFile), backupContent, 'utf-8');
      await rm(backupPath);
    } catch (restoreError) {
      console.error('Failed to restore original file:', restoreError);
    }
    return res.status(500).json({
      success: false,
      passed: false,
      error: error.message,
      output: error.stdout || error.stderr || ''
    });
  }
});

app.get('/api/challenge/:id/template', async (req, res) => {
  const challengeId = req.params.id;
  const challengeFile = `sol-${String(challengeId).padStart(3, '0')}.sol`;
  const challengePath = join(CONTRACTS_DIR, 'src', 'challenges', challengeFile);

  try {
    const content = await readFile(challengePath, 'utf-8');
    const template = extractExploitTemplate(content);
    
    if (!template) {
      console.error(`Template extraction failed for ${challengeFile}`);
      return res.status(404).json({ error: 'Template not found' });
    }

    return res.json({ template, interface: extractInterface(content) });
  } catch (error) {
    console.error(`Error loading template for challenge ${challengeId}:`, error.message);
    console.error(`Looking for file: ${challengePath}`);
    return res.status(404).json({ 
      error: 'Challenge file not found',
      details: error.message,
      path: challengePath
    });
  }
});

function extractExploitContractName(content) {
  const match = content.match(/contract\s+(\w+Exploit)\s+/);
  return match ? match[1] : null;
}

function extractExploitTemplate(content) {
  const interfaceMatch = content.match(/(interface\s+\w+\s+[^{]*\{[\s\S]*?\})/);
  const interfaceCode = interfaceMatch ? interfaceMatch[1] : '';

  const exploitContractMatch = content.match(/contract\s+(\w+Exploit)\s+[^{]*\{([\s\S]*?)\n\}\s*contract\s+\w+/);
  if (!exploitContractMatch) return null;

  const contractName = exploitContractMatch[1];
  const contractBody = exploitContractMatch[2];

  const interfaceName = interfaceCode.match(/interface\s+(\w+)/)?.[1] || 'IEthBank';
  
  const constructorMatch = contractBody.match(/(constructor\s*\([^)]*\)\s*\{[\s\S]*?\})/);
  if (constructorMatch) {
    const constructor = constructorMatch[1];
    const publicVarMatch = contractBody.match(/public\s+(\w+)/);
    const publicVarName = publicVarMatch ? publicVarMatch[1] : 'bank';
    
    const template = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

${interfaceCode}

contract ${contractName} {
    ${interfaceName} public ${publicVarName};

    ${constructor}

    receive() external payable {}

    function pwn() external payable {}
}`;
    return template;
  }

  const publicVarMatch = contractBody.match(/public\s+(\w+)/);
  const publicVarName = publicVarMatch ? publicVarMatch[1] : 'bank';
  const paramName = publicVarName === 'vault' ? '_vault' : publicVarName === 'challenge' ? '_challenge' : '_bank';

  const template = `// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

${interfaceCode}

contract ${contractName} {
    ${interfaceName} public ${publicVarName};

    constructor(address ${paramName}) {
        ${publicVarName} = ${interfaceName}(${paramName});
    }

    receive() external payable {}

    function pwn() external payable {}
}`;

  return template;
}

function extractInterface(content) {
  const match = content.match(/(interface\s+\w+\s+[^{]*\{[\s\S]*?\})/);
  return match ? match[1] : '';
}

function extractExploitContractFromUserCode(userCode, contractName) {
  const contractMatch = userCode.match(new RegExp(
    `contract\\s+${contractName}\\s+[^{]*\\{[\\s\\S]*?\\n\\}`,
    'g'
  ));
  return contractMatch ? contractMatch[0] : userCode;
}

function replaceExploitContract(content, newExploitContract, contractName) {
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
  console.log(`Test API server running on port ${PORT}`);
});

