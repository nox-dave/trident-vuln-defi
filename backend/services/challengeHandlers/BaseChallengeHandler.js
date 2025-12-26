import {
  extractExploitContractName,
  extractExploitContractFromUserCode,
  replaceExploitContract,
  extractAllContractsExcept,
  contractExistsInContent
} from '../../utils/contractExtractor.js';
import { log } from '../../utils/logger.js';

export class BaseChallengeHandler {
  async processChallenge(challengeContent, exploitCode) {
    const exploitContractName = extractExploitContractName(challengeContent);
    
    if (!exploitContractName) {
      throw new Error('Could not find exploit contract name in challenge file');
    }
    
    const contractToReplace = extractExploitContractFromUserCode(exploitCode, exploitContractName);
    if (!contractToReplace) {
      log.error('❌', 'Failed to extract contract from user code');
      throw new Error('Could not extract exploit contract from user code. Make sure your contract is properly formatted with matching braces.');
    }
    
    const additionalContracts = extractAllContractsExcept(exploitCode, exploitContractName);
    
    let contentToReplace = challengeContent;
    if (additionalContracts.trim()) {
      const contractsToAdd = [];
      const normalized = additionalContracts.replace(/\r\n/g, '\n').replace(/\r/g, '\n');
      const contractRegex = /(?:contract|interface)\s+(\w+)\s*[^{]*\{/g;
      let match;
      const matches = [];
      
      while ((match = contractRegex.exec(normalized)) !== null) {
        matches.push({ index: match.index, name: match[1] });
      }
      
      for (let i = 0; i < matches.length; i++) {
        const currentMatch = matches[i];
        const nextMatch = matches[i + 1];
        const contractStart = currentMatch.index;
        const contractEnd = nextMatch ? nextMatch.index : normalized.length;
        
        let braceCount = 0;
        let foundOpening = false;
        let actualEnd = contractStart;
        let inString = false;
        let inComment = false;
        let inSingleLineComment = false;
        
        for (let j = contractStart; j < contractEnd; j++) {
          const char = normalized[j];
          const nextChar = normalized[j + 1] || '';
          
          if (!inString && !inComment) {
            if (char === '/' && nextChar === '/') {
              inSingleLineComment = true;
            } else if (char === '/' && nextChar === '*') {
              inComment = true;
              j++;
            } else if (char === '"' || char === "'") {
              inString = true;
            } else if (char === '{') {
              braceCount++;
              foundOpening = true;
            } else if (char === '}') {
              braceCount--;
              if (foundOpening && braceCount === 0) {
                actualEnd = j + 1;
                break;
              }
            }
          } else {
            if (inSingleLineComment && char === '\n') {
              inSingleLineComment = false;
            } else if (inComment && char === '*' && nextChar === '/') {
              inComment = false;
              j++;
            } else if (inString && (char === '"' || char === "'")) {
              inString = false;
            }
          }
        }
        
        if (foundOpening && braceCount === 0) {
          const contractBlock = normalized.substring(contractStart, actualEnd).trim();
          const contractName = currentMatch.name;
          if (!contractExistsInContent(contentToReplace, contractName)) {
            contractsToAdd.push(contractBlock);
          } else {
            log.info('ℹ️', `Skipping ${contractName} - already exists in challenge file`);
          }
        }
      }
      
      if (contractsToAdd.length > 0) {
        const contractsToInsert = contractsToAdd.join('\n\n');
        log.info('📦', `Found additional contracts/interfaces to add: ${contractsToInsert.substring(0, 100)}...`);
        const exploitContractRegex = new RegExp(`(contract\\s+${exploitContractName}\\s*[^{]*\\{)`, 'm');
        const match = contentToReplace.match(exploitContractRegex);
        if (match && match.index !== undefined) {
          const insertIndex = match.index;
          const beforeExploit = contentToReplace.substring(0, insertIndex).trim();
          const afterExploit = contentToReplace.substring(insertIndex);
          contentToReplace = beforeExploit + '\n\n' + contractsToInsert.trim() + '\n\n' + afterExploit;
        } else {
          contentToReplace = contentToReplace.trim() + '\n\n' + contractsToInsert.trim();
        }
      } else {
        log.info('ℹ️', 'All additional contracts already exist in challenge file');
      }
    } else {
      log.info('ℹ️', 'No additional contracts found in user code');
    }
    
    const updatedChallengeContent = replaceExploitContract(contentToReplace, contractToReplace, exploitContractName);
    
    return {
      updatedContent: updatedChallengeContent,
      contractName: exploitContractName,
      contractToReplace
    };
  }
}

