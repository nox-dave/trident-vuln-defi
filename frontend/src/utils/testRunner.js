const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export async function runTest(challengeId, exploitCode) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/test`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        challengeId: String(challengeId),
        exploitCode,
      }),
    });

    const result = await response.json();
    return result;
  } catch (error) {
    return {
      success: false,
      passed: false,
      error: error.message || 'Failed to connect to test server',
    };
  }
}

export async function loadExploitTemplate(challengeId) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/challenge/${challengeId}/template`);
    
    if (!response.ok) {
      throw new Error('Failed to load template');
    }

    const data = await response.json();
    return data.template || '';
  } catch (error) {
    console.error('Failed to load template:', error);
    return null;
  }
}

