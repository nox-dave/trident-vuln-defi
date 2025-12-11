import { readFile, access } from 'fs/promises';
import { join } from 'path';
import { log } from '../utils/logger.js';
import { config } from '../config/index.js';
import {
  extractExploitContractName,
  extractVulnerableContractName,
  extractInterface,
  getChallengeFolder
} from '../utils/contractExtractor.js';

export class ChallengeService {
  constructor(contractsDir) {
    this.contractsDir = contractsDir;
  }

  async getTemplate(challengeId) {
    const challengeFolder = getChallengeFolder(Number(challengeId), config.challengeMap);
    const templateFile = `Challenge${challengeId}_Template.sol`;
    const templatePath = join(this.contractsDir, 'src', 'challenges', challengeFolder, templateFile);

    try {
      await access(templatePath);
    } catch {
      throw new Error(`Template file not found: ${templatePath}`);
    }

    const templateContent = await readFile(templatePath, 'utf-8');
    const interfaceCode = extractInterface(templateContent);
    
    return { 
      template: templateContent,
      interface: interfaceCode
    };
  }

  async getChallengeInfo(challengeId) {
    const challengeFolder = getChallengeFolder(Number(challengeId), config.challengeMap);
    const challengeFile = `${challengeFolder}.sol`;
    const challengePath = join(this.contractsDir, 'src', 'challenges', challengeFolder, challengeFile);

    try {
      const content = await readFile(challengePath, 'utf-8');
      const exploitContractName = extractExploitContractName(content);
      const vulnerableContractName = extractVulnerableContractName(content);
      
      return {
        challengeId: Number(challengeId),
        challengeFolder,
        exploitContractName,
        vulnerableContractName,
        hasInterface: !!extractInterface(content)
      };
    } catch (error) {
      log.error('❌', `Error loading challenge ${challengeId}:`, error.message);
      throw new Error(`Challenge not found: ${error.message}`);
    }
  }
}

