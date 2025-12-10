const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export async function compileSolidity(code) {
  try {
    const response = await fetch(`${API_BASE_URL}/api/compile`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code,
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error || 'Compilation failed')
    }

    const result = await response.json()
    
    if (result.errors && result.errors.length > 0) {
      const errorMessages = result.errors
        .filter(e => e.severity === 'error')
        .map(e => e.formattedMessage || e.message)
        .join('\n')
        throw new Error(errorMessages)
      }

    if (result.output) {
      return result.output
    }

    return result
  } catch (error) {
    throw new Error(`Compilation error: ${error.message}`)
  }
}

export function extractContractName(code) {
  const contractMatch = code.match(/contract\s+(\w+)/)
  return contractMatch ? contractMatch[1] : null
}
