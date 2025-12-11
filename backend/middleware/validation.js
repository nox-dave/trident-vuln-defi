export const validateCompileRequest = (req, res, next) => {
  if (!req.body.code || typeof req.body.code !== 'string') {
    return res.status(400).json({ error: 'Missing or invalid code' });
  }
  if (req.body.code.length > 100000) {
    return res.status(400).json({ error: 'Code too large (max 100KB)' });
  }
  next();
};

export const validateTestRequest = (req, res, next) => {
  const { challengeId, exploitCode } = req.body;
  if (!challengeId || !exploitCode) {
    return res.status(400).json({ error: 'Missing challengeId or exploitCode' });
  }
  if (!Number.isInteger(Number(challengeId)) || Number(challengeId) < 1 || Number(challengeId) > 5) {
    return res.status(400).json({ error: 'Invalid challengeId' });
  }
  if (typeof exploitCode !== 'string' || exploitCode.length > 100000) {
    return res.status(400).json({ error: 'Invalid or too large exploitCode' });
  }
  next();
};

export const validateChallengeId = (req, res, next) => {
  const challengeId = Number(req.params.id);
  if (!Number.isInteger(challengeId) || challengeId < 1 || challengeId > 5) {
    return res.status(400).json({ error: 'Invalid challengeId' });
  }
  next();
};

