export function extractExploitContractName(content) {
  const match = content.match(/contract\s+(\w+Exploit)\s+/);
  return match ? match[1] : null;
}

export function extractVulnerableContractName(content) {
  const exploitMatch = content.match(/contract\s+\w+Exploit\s+[^{]*\{[\s\S]*?\}\s*contract\s+(\w+)\s+/);
  if (exploitMatch) {
    return exploitMatch[1];
  }
  
  const lines = content.split('\n');
  let foundExploit = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].match(/contract\s+\w+Exploit\s*[{\s]/)) {
      foundExploit = true;
      let braceCount = 0;
      let exploitStart = false;
      
      for (let j = i; j < lines.length; j++) {
        const line = lines[j];
        for (let k = 0; k < line.length; k++) {
          if (line[k] === '{') {
            braceCount++;
            exploitStart = true;
          } else if (line[k] === '}') {
            braceCount--;
            if (exploitStart && braceCount === 0) {
              for (let m = j + 1; m < lines.length; m++) {
                const contractMatch = lines[m].match(/contract\s+(\w+)\s*[{\s]/);
                if (contractMatch) {
                  return contractMatch[1];
                }
              }
              break;
            }
          }
        }
        if (exploitStart && braceCount === 0) {
          break;
        }
      }
    }
  }
  
  return null;
}

export function extractInterface(content) {
  const match = content.match(/(interface\s+\w+\s+[^{]*\{[\s\S]*?\})/);
  return match ? match[1] : '';
}

function countStructuralBraces(line) {
  let count = 0;
  let inString = false;
  let inComment = false;
  let inCallSyntax = false;
  let parenDepth = 0;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    const nextChar = line[i + 1] || '';
    const prevChar = line[i - 1] || '';
    
    if (!inString && !inComment) {
      if (char === '"' || char === "'") {
        inString = true;
      } else if (char === '/' && nextChar === '/') {
        break;
      } else if (char === '/' && nextChar === '*') {
        inComment = true;
        i++;
      } else if (char === '(') {
        parenDepth++;
      } else if (char === ')') {
        parenDepth--;
      } else if (char === '{' && parenDepth > 0 && /[a-zA-Z0-9_]/.test(prevChar)) {
        inCallSyntax = true;
      } else if (char === '}' && inCallSyntax) {
        inCallSyntax = false;
      } else if (char === '{' && !inCallSyntax) {
        count++;
      } else if (char === '}' && !inCallSyntax) {
        count--;
      }
    } else {
      if (inString && (char === '"' || char === "'")) {
        inString = false;
      } else if (inComment && char === '*' && nextChar === '/') {
        inComment = false;
        i++;
      }
    }
  }
  
  return count;
}

export function extractExploitContractFromUserCode(userCode, contractName) {
  const normalizedCode = userCode.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = normalizedCode.split('\n');
  let contractStart = -1;
  let braceCount = 0;
  let contractEnd = -1;
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const contractPattern = new RegExp(`contract\\s+${contractName}\\s*[\\{;]`, 'i');
    if (contractStart === -1 && contractPattern.test(line)) {
      contractStart = i;
      braceCount = countStructuralBraces(line);
      if (braceCount === 0 && line.includes('{')) {
        braceCount = 1;
      }
    } else if (contractStart !== -1) {
      braceCount += countStructuralBraces(line);
      if (braceCount === 0) {
        contractEnd = i;
        break;
      }
    }
  }
  
  if (contractStart !== -1 && contractEnd !== -1) {
    const extracted = lines.slice(contractStart, contractEnd + 1).join('\n');
    const openBraces = (extracted.match(/\{/g) || []).length;
    const closeBraces = (extracted.match(/\}/g) || []).length;
    if (openBraces === closeBraces && openBraces > 0) {
      return extracted;
    }
  }
  
  const contractStartIdx = normalizedCode.search(new RegExp(`contract\\s+${contractName}\\s*[\\{;]`));
  if (contractStartIdx !== -1) {
    let braceCount = 0;
    let foundOpening = false;
    let endIdx = contractStartIdx;
    let inString = false;
    let inComment = false;
    let inSingleLineComment = false;
    
    for (let i = contractStartIdx; i < normalizedCode.length; i++) {
      const char = normalizedCode[i];
      const nextChar = normalizedCode[i + 1] || '';
      
      if (!inString && !inComment) {
        if (char === '/' && nextChar === '/') {
          inSingleLineComment = true;
        } else if (char === '/' && nextChar === '*') {
          inComment = true;
          i++;
        } else if (char === '"' || char === "'") {
          inString = true;
        } else if (char === '{') {
          braceCount++;
          foundOpening = true;
        } else if (char === '}') {
          braceCount--;
          if (foundOpening && braceCount === 0) {
            endIdx = i;
            break;
          }
        }
      } else {
        if (inSingleLineComment && char === '\n') {
          inSingleLineComment = false;
        } else if (inComment && char === '*' && nextChar === '/') {
          inComment = false;
          i++;
        } else if (inString && char === '"' || char === "'") {
          inString = false;
        }
      }
    }
    
    if (foundOpening && braceCount === 0) {
      return normalizedCode.substring(contractStartIdx, endIdx + 1);
    }
  }
  
  if (normalizedCode.includes(`contract ${contractName}`)) {
    const contractMatch = normalizedCode.match(new RegExp(
      `contract\\s+${contractName}[\\s\\S]*`,
      'm'
    ));
    if (contractMatch) {
      const startIdx = contractMatch.index;
      let braceCount = 0;
      let foundOpening = false;
      let endIdx = startIdx;
      
      for (let i = startIdx; i < normalizedCode.length; i++) {
        if (normalizedCode[i] === '{') {
          braceCount++;
          foundOpening = true;
        } else if (normalizedCode[i] === '}') {
          braceCount--;
          if (foundOpening && braceCount === 0) {
            endIdx = i;
            break;
          }
        }
      }
      
      if (foundOpening && braceCount === 0) {
        return normalizedCode.substring(startIdx, endIdx + 1);
      }
    }
  }
  
  return null;
}

export function extractContractFromUserCode(userCode, contractName) {
  return extractExploitContractFromUserCode(userCode, contractName);
}

export function replaceExploitContract(content, newExploitContract, contractName) {
  return replaceContract(content, newExploitContract, contractName);
}

export function replaceContract(content, newContract, contractName) {
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
    return before + '\n' + newContract.trim() + '\n' + after;
  }
  
  const contractRegex = new RegExp(
    `contract\\s+${contractName}\\s+[^{]*\\{[\\s\\S]*?\\n\\}`,
    'g'
  );
  
  return content.replace(contractRegex, newContract.trim());
}

export function extractTestFunctionName(testContent) {
  const match = testContent.match(/function\s+(test_\w+)\s*\(/);
  return match ? match[1] : 'test_pwn';
}

export function extractError(output) {
  const errorMatch = output.match(/Error[:\s]+([^\n]+)/i);
  return errorMatch ? errorMatch[1] : 'Test failed';
}

export function getChallengeFolder(challengeId, challengeMap) {
  const folder = challengeMap[challengeId];
  if (!folder) {
    throw new Error(`Invalid challenge ID: ${challengeId}`);
  }
  return folder;
}

