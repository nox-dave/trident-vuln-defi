let solcWorker = null

async function getSolcCompiler() {
  if (solcWorker) return solcWorker

  return new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://binaries.soliditylang.org/bin/soljson-v0.8.19+commit.7dd6d404.js'
    script.async = true
    
    script.onload = () => {
      if (window.Module) {
        solcWorker = window.Module
        resolve(solcWorker)
      } else {
        reject(new Error('Compiler module not available'))
      }
    }
    
    script.onerror = () => {
      reject(new Error('Failed to load compiler'))
    }
    
    if (!document.querySelector(`script[src="${script.src}"]`)) {
      document.head.appendChild(script)
    } else {
      if (window.Module) {
        solcWorker = window.Module
        resolve(solcWorker)
      } else {
        setTimeout(() => {
          if (window.Module) {
            solcWorker = window.Module
            resolve(solcWorker)
          } else {
            reject(new Error('Compiler module not available'))
          }
        }, 1000)
      }
    }
  })
}

export async function compileSolidity(code) {
  try {
    const solc = await getSolcCompiler()
    
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
    }

    const outputStr = solc.compile(JSON.stringify(input))
    const output = JSON.parse(outputStr)
    
    if (output.errors) {
      const errors = output.errors.filter(e => e.severity === 'error')
      if (errors.length > 0) {
        const errorMessages = errors.map(e => 
          e.formattedMessage || `${e.message} (${e.sourceLocation?.file}:${e.sourceLocation?.start}:${e.sourceLocation?.end})`
        ).join('\n')
        throw new Error(errorMessages)
      }
    }

    return output
  } catch (error) {
    throw new Error(`Compilation error: ${error.message}`)
  }
}

export function extractContractName(code) {
  const contractMatch = code.match(/contract\s+(\w+)/)
  return contractMatch ? contractMatch[1] : null
}

