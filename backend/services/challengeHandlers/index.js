import { BaseChallengeHandler } from './BaseChallengeHandler.js';
import { Challenge1Handler } from './Challenge1Handler.js';
import { Challenge2Handler } from './Challenge2Handler.js';

const challengeHandlers = {
  1: new Challenge1Handler(),
  2: new Challenge2Handler(),
};

export function getChallengeHandler(challengeId) {
  return challengeHandlers[challengeId] || new BaseChallengeHandler();
}

export { BaseChallengeHandler, Challenge1Handler, Challenge2Handler };

