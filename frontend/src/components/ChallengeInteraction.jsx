import { useState, useEffect } from 'react'
import { useAccount, useConfig } from 'wagmi'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import CodeEditor from './CodeEditor'
import ChallengeDetailsPanel from './ChallengeDetailsPanel'
import {
  deployChallenge,
  getChallengeAddress,
  CHALLENGE_ABI,
} from '../utils/contractHelpers'
import { CONTRACT_ADDRESSES, CHALLENGES, DEPLOYED_CHALLENGES } from '../config/contracts'
import { CHALLENGE_DETAILS } from '../config/challengeDetails'
import { parseAbi, encodeFunctionData } from 'viem'
import { readContract } from 'wagmi/actions'
import { runTest, loadExploitTemplate, verifyOnSepolia } from '../utils/testRunner'

function ChallengeInteraction({ challenge, onBack, onNextChallenge }) {
  const { address } = useAccount()
  const config = useConfig()
  const [challengeAddress, setChallengeAddress] = useState(null)
  const [exploitAddress, setExploitAddress] = useState(null)
  const [targetAddress, setTargetAddress] = useState(null)
  const [isDeploying, setIsDeploying] = useState(false)
  const [isDeployingExploit, setIsDeployingExploit] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [status, setStatus] = useState('')
  const [statusColor, setStatusColor] = useState('#ffffff')
  const [exploitCode, setExploitCode] = useState('')
  const [testPassed, setTestPassed] = useState(false)
  const [compiledExploit, setCompiledExploit] = useState(null)
  const [leftPanelWidth, setLeftPanelWidth] = useState(50)
  const [isResizing, setIsResizing] = useState(false)
  const [verificationStatus, setVerificationStatus] = useState(null)

  const { writeContract: deployChallengeWrite, data: deployHash, isPending: isDeployPending } = useWriteContract()
  const { writeContract: executeWrite, data: executeHash, isPending: isExecutePending } = useWriteContract()
  const { writeContract: deployExploitWrite, data: deployExploitHash, isPending: isDeployExploitPending } = useWriteContract()
  const { writeContract: fundExploitWrite, data: fundHash, isPending: isFundPending } = useWriteContract()

  const { isLoading: isDeployConfirming } = useWaitForTransactionReceipt({ hash: deployHash })
  const { isLoading: isExecuteConfirming } = useWaitForTransactionReceipt({ hash: executeHash })
  const { data: deployExploitReceipt, isLoading: isDeployExploitConfirming } = useWaitForTransactionReceipt({ hash: deployExploitHash })
  const { data: fundReceipt, isLoading: isFundConfirming } = useWaitForTransactionReceipt({ hash: fundHash })

  useEffect(() => {
    if (challenge && CONTRACT_ADDRESSES.CHALLENGE_FACTORY) {
      loadChallengeAddress()
    }
  }, [challenge, config])

  useEffect(() => {
    if (challengeAddress && challenge?.id === 3) {
      loadWalletAddress()
    } else if (challengeAddress && challenge?.id === 4) {
      loadGameAddress()
    } else if (challengeAddress) {
      setTargetAddress(challengeAddress)
    }
  }, [challengeAddress, challenge])

  useEffect(() => {
    if (challenge) {
      setExploitCode('')
      setCompiledExploit(null)
      setTestResult(null)
      setTestPassed(false)
      setStatus('')
      setStatusColor('#ffffff')
      loadTemplate()
    }
  }, [challenge])

  const loadTemplate = async () => {
    try {
      const template = await loadExploitTemplate(challenge.id)
      if (template) {
        setExploitCode(template)
      }
    } catch (error) {
      console.error('Failed to load template:', error)
    }
  }

  const loadChallengeAddress = async () => {
    try {
      let address = null
      
      if (CONTRACT_ADDRESSES.CHALLENGE_FACTORY) {
        try {
          address = await getChallengeAddress(
            config,
            CONTRACT_ADDRESSES.CHALLENGE_FACTORY,
            challenge.id
          )
        } catch (error) {
          console.log('Could not load from factory, trying deployed address:', error)
        }
      }
      
      if (!address || address === '0x0000000000000000000000000000000000000000') {
        if (DEPLOYED_CHALLENGES[challenge.id]) {
          address = DEPLOYED_CHALLENGES[challenge.id]
          console.log(`Using deployed challenge address for challenge ${challenge.id}:`, address)
        }
      }
      
      if (address && address !== '0x0000000000000000000000000000000000000000') {
        setChallengeAddress(address)
      }
    } catch (error) {
      console.error('Failed to load challenge address:', error)
      if (DEPLOYED_CHALLENGES[challenge.id]) {
        setChallengeAddress(DEPLOYED_CHALLENGES[challenge.id])
      }
    }
  }

  const loadWalletAddress = async () => {
    if (!challengeAddress || challenge?.id !== 3) return
    
    try {
      const walletAddress = await readContract(config, {
        address: challengeAddress,
        abi: parseAbi(['function wallet() external view returns (address)']),
        functionName: 'wallet',
      })
      setTargetAddress(walletAddress)
      console.log('Loaded wallet address for Challenge 3:', walletAddress)
    } catch (error) {
      console.error('Failed to load wallet address:', error)
      setTargetAddress(challengeAddress)
    }
  }

  const loadGameAddress = async () => {
    if (!challengeAddress || challenge?.id !== 4) return
    
    try {
      const gameAddress = await readContract(config, {
        address: challengeAddress,
        abi: parseAbi(['function game() external view returns (address)']),
        functionName: 'game',
      })
      setTargetAddress(gameAddress)
      console.log('Loaded game address for Challenge 4:', gameAddress)
    } catch (error) {
      console.error('Failed to load game address:', error)
      setTargetAddress(challengeAddress)
    }
  }

  const handleDeployChallenge = async () => {
    if (!address) {
      setStatus('Please connect wallet')
      return
    }

    setIsDeploying(true)
    setStatus('Deploying challenge...')
    try {
      deployChallengeWrite({
        address: CONTRACT_ADDRESSES.CHALLENGE_FACTORY,
        abi: parseAbi(['function deployChallenge(uint256 challengeId) external returns (address)']),
        functionName: 'deployChallenge',
        args: [BigInt(challenge.id)],
      })
    } catch (error) {
      setStatus(`Deployment failed: ${error.message}`)
      setIsDeploying(false)
    }
  }

  useEffect(() => {
    if (deployHash && !isDeployConfirming) {
      loadChallengeAddress()
      setStatus('Challenge deployed successfully')
      setIsDeploying(false)
    }
  }, [deployHash, isDeployConfirming])

  const handleCompileExploit = async (code, result) => {
    setExploitCode(code)
    
    if (result && result.compilationError) {
      setStatus(`Compilation error: ${result.compilationError}`)
      setStatusColor('#ff0000')
      setCompiledExploit(null)
      return
    }
    
    if (!result) {
      setStatus('Compiling exploit contract...')
      setStatusColor('#ffffff')
      try {
        const { compileSolidity } = await import('../utils/compiler')
        const compileResult = await compileSolidity(code)
        const contractName = extractContractName(code)
        if (contractName && compileResult.contracts) {
          const contracts = compileResult.contracts['contract.sol']
          if (contracts && contracts[contractName]) {
            setCompiledExploit(contracts[contractName])
            setStatus('Exploit contract compiled successfully')
            setStatusColor('#00ff00')
            return compileResult
          }
        }
        setStatus('Compilation successful but contract not found')
        setStatusColor('#ff0000')
      } catch (error) {
        setStatus(`Compilation error: ${error.message}`)
        setStatusColor('#ff0000')
        throw error
      }
    } else {
      if (result.errors && result.errors.length > 0) {
        const errorMessages = result.errors
          .filter(e => e.severity === 'error')
          .map(e => e.formattedMessage || e.message)
          .join('\n')
        setStatus(`Compilation error: ${errorMessages}`)
        setStatusColor('#ff0000')
        setCompiledExploit(null)
        return
      }
      
      const contractName = extractContractName(code)
      if (contractName && result.contracts) {
        const contracts = result.contracts['contract.sol']
        if (contracts && contracts[contractName]) {
          setCompiledExploit(contracts[contractName])
          setStatus('Exploit contract compiled successfully')
          setStatusColor('#00ff00')
        }
      }
    }
  }

  const handleTestExploit = async (code, result) => {
    if (result && result.formattedError) {
      setStatus(`✗ Browser test FAILED: Test failed\n\n${result.formattedError}`)
      setStatusColor('#ff0000')
      setTestResult(result)
      setTestPassed(false)
      return
    }

    const codeToTest = code || exploitCode
    if (!codeToTest) {
      setStatus('Please write your exploit code first')
      setStatusColor('#ffffff')
      return
    }

    setExploitCode(codeToTest)
    setIsTesting(true)
    setTestResult(null)
    setStatus('Running browser test...')
    setStatusColor('#ffffff')

    try {
      const testResult = await runTest(challenge.id, codeToTest)
      setTestResult(testResult)
      
      if (testResult.passed) {
        const successOutput = formatFoundrySuccess(testResult.output || '')
        setStatus(`Tests passed\n\n${successOutput}`)
        setStatusColor('#00ff00')
        setTestPassed(true)
      } else {
        setTestPassed(false)
        const errorOutput = formatFoundryError(testResult.output || testResult.error || 'Test failed')
        setStatus(`✗ Browser test FAILED: Test failed\n\n${errorOutput}`)
        setStatusColor('#ff0000')
      }
    } catch (error) {
      setTestResult({ success: false, passed: false, error: error.message })
      setStatus(`Test error: ${error.message}`)
      setStatusColor('#ff0000')
    } finally {
      setIsTesting(false)
    }
  }

  const formatFoundrySuccess = (output) => {
    if (!output) return ''
    
    const testMatch = output.match(/(test_\w+)\(\)/i)
    const contractMatch = output.match(/(\w+Test)/i)
    const addressMatch = output.match(/0x[a-fA-F0-9]{40}/)
    const gasMatch = output.match(/(\d+)\s+gas\s+([\d.]+)\s+s/i)
    const passMatch = output.match(/\[PASS\]|Test result: ok/i)
    
    let formatted = ''
    
    if (testMatch) {
      formatted += testMatch[1] + '()\n\n'
    }
    
    if (contractMatch) {
      formatted += contractMatch[1] + '\n\n'
    }
    
    if (addressMatch) {
      formatted += 'address\n' + addressMatch[0] + '\n\n'
    }
    
    if (testMatch) {
      const testName = testMatch[1]
      formatted += '.\n' + testName + '\n(\n)\n\n'
    }
    
    const rawDataMatch = output.match(/raw data\s+(0x[a-fA-F0-9]+)/i)
    const selectorMatch = output.match(/selector\s+(0x[a-fA-F0-9]+)/i)
    
    if (rawDataMatch) {
      formatted += 'raw data\n' + rawDataMatch[1] + '\n'
    }
    
    if (selectorMatch) {
      formatted += 'selector\n' + selectorMatch[1] + '\n'
    }
    
    if (gasMatch) {
      formatted += '✓\n\n' + gasMatch[1] + ' gas\n' + gasMatch[2] + ' s\n'
    } else {
      const simpleGasMatch = output.match(/(\d+)\s+gas/i)
      const simpleTimeMatch = output.match(/([\d.]+)\s+s/i)
      if (simpleGasMatch || simpleTimeMatch) {
        formatted += '✓\n\n'
        if (simpleGasMatch) {
          formatted += simpleGasMatch[1] + ' gas\n'
        }
        if (simpleTimeMatch) {
          formatted += simpleTimeMatch[1] + ' s\n'
        }
      }
    }
    
    return formatted || output
  }

  const formatFoundryError = (output) => {
    if (!output) return 'Test failed'
    
    const assertionMatch = output.match(/assertion failed:\s*(\d+)\s*!=\s*(\d+)/i)
    const testMatch = output.match(/(test_\w+)\(\)/i)
    const contractMatch = output.match(/(\w+Test)/i)
    const addressMatch = output.match(/0x[a-fA-F0-9]{40}/)
    const gasMatch = output.match(/(\d+)\s+gas\s+([\d.]+)\s+s/i)
    
    let formatted = ''
    
    if (testMatch) {
      formatted += testMatch[1] + '()\n\n'
    }
    
    if (assertionMatch) {
      formatted += 'assertion failed: ' + assertionMatch[1] + ' != ' + assertionMatch[2] + '\n\n'
    }
    
    if (contractMatch) {
      formatted += contractMatch[1] + '\n\n'
    }
    
    if (addressMatch) {
      formatted += 'address\n' + addressMatch[0] + '\n\n'
    }
    
    if (testMatch) {
      const testName = testMatch[1]
      formatted += '.\n' + testName + '\n(\n)\n\n'
    }
    
    if (assertionMatch) {
      formatted += 'assertion failed: ' + assertionMatch[1] + ' != ' + assertionMatch[2] + '\n\n'
    }
    
    const rawDataMatch = output.match(/raw data\s+(0x[a-fA-F0-9]+)/i)
    const selectorMatch = output.match(/selector\s+(0x[a-fA-F0-9]+)/i)
    const rawOutputMatch = output.match(/raw output\s+(0x[a-fA-F0-9.]+)/i)
    
    if (rawDataMatch) {
      formatted += 'raw data\n' + rawDataMatch[1] + '\n'
    }
    
    if (selectorMatch) {
      formatted += 'selector\n' + selectorMatch[1] + '\n'
    }
    
    if (rawOutputMatch) {
      formatted += 'raw output\n' + rawOutputMatch[1] + '\n\n'
    }
    
    if (gasMatch) {
      formatted += '✘\n\n' + gasMatch[1] + ' gas\n' + gasMatch[2] + ' s\n'
    }
    
    if (!formatted) {
      const errorMatch = output.match(/Error[:\s]+([^\n]+)/i) || 
                        output.match(/assertion failed[:\s]+([^\n]+)/i)
      
      if (errorMatch) {
        formatted = 'Test failed:\n' + errorMatch[0]
      } else {
        formatted = output
      }
    }
    
    return formatted || output
  }

  useEffect(() => {
    if (deployExploitReceipt?.contractAddress) {
      setExploitAddress(deployExploitReceipt.contractAddress)
      setStatus('Exploit contract deployed successfully')
      setIsDeployingExploit(false)
      if (challenge?.id === 4 && challengeAddress) {
        setTimeout(() => fundExploitContract(deployExploitReceipt.contractAddress), 500)
      }
    }
  }, [deployExploitReceipt])

  useEffect(() => {
    if (fundReceipt && !isFundConfirming && challenge?.id === 4) {
      setStatus('✅ Exploit contract funded! You can now execute it.')
    }
  }, [fundReceipt, isFundConfirming])

  const fundExploitContract = async (exploitAddr) => {
    if (!challengeAddress || !exploitAddr) return
    
    try {
      setStatus('Funding exploit contract...')
      fundExploitWrite({
        address: challengeAddress,
        abi: parseAbi(['function fundExploit(address) external']),
        functionName: 'fundExploit',
        args: [exploitAddr],
      })
    } catch (error) {
      console.error('Failed to fund exploit:', error)
      setStatus('Exploit deployed. Note: Wrapper may need to be redeployed with fundExploit function.')
    }
  }

  const handleDeployExploit = async () => {
    if (!compiledExploit || !challengeAddress) {
      setStatus('Please compile exploit contract first and deploy challenge')
      return
    }

    if (challenge?.id === 4) {
      if (!targetAddress) {
        setStatus('Loading game address... Please wait')
        await loadGameAddress()
        if (!targetAddress) {
          setStatus('Failed to load game address. Please try again.')
          return
        }
      }
    }

    setIsDeployingExploit(true)
    setStatus('Deploying exploit contract...')
    try {
      const bytecode = compiledExploit.evm?.bytecode?.object || compiledExploit.bytecode
      const abi = compiledExploit.abi
      
      const targetAddr = targetAddress || challengeAddress
      if (challenge?.id === 4) {
        console.log('Deploying Challenge 4 exploit with target:', targetAddr)
        const gameAddress = await readContract(config, {
          address: challengeAddress,
          abi: parseAbi(['function game() external view returns (address)']),
          functionName: 'game',
        })
        console.log('Expected game address:', gameAddress)
        if (targetAddr.toLowerCase() !== gameAddress.toLowerCase()) {
          setStatus(`⚠️ ERROR: Target is ${targetAddr}, but must be game address ${gameAddress}`)
          setIsDeployingExploit(false)
          return
        }
      }
      deployExploitWrite({
        abi: abi,
        bytecode: bytecode,
        args: [targetAddr],
      })
    } catch (error) {
      setStatus(`Exploit deployment failed: ${error.message}`)
      setIsDeployingExploit(false)
    }
  }

  const { data: balance } = useReadContract({
    address: challengeAddress,
    abi: parseAbi(['function balances(address) external view returns (uint256)']),
    functionName: 'balances',
    args: exploitAddress ? [exploitAddress] : undefined,
    query: { enabled: !!exploitAddress && !!challengeAddress },
  })

  const handleExecuteExploit = async () => {
    if (!exploitAddress || !challengeAddress) {
      setStatus('Please deploy exploit contract first')
      return
    }

    setIsExecuting(true)
    setStatus('Executing exploit...')
    try {
      if (challenge.id === 1) {
        executeWrite({
          address: exploitAddress,
          abi: parseAbi(['function pwn() external payable']),
          functionName: 'pwn',
          value: balance || BigInt(1000000000000000000),
        })
      } else if (challenge.id === 4) {
        console.log('Executing Challenge 4 exploit (funded by wrapper)')
        executeWrite({
          address: exploitAddress,
          abi: parseAbi(['function pwn() external payable']),
          functionName: 'pwn',
        })
      } else {
        executeWrite({
          address: exploitAddress,
          abi: parseAbi(['function pwn() external']),
          functionName: 'pwn',
        })
      }
    } catch (error) {
      setStatus(`Execution failed: ${error.message}`)
      setIsExecuting(false)
    }
  }

  useEffect(() => {
    if (executeHash && !isExecuteConfirming) {
      setIsExecuting(false)
      checkChallengeSolved()
    }
  }, [executeHash, isExecuteConfirming])

  const checkChallengeSolved = async () => {
    if (!challengeAddress || !config) return
    
    try {
      const isSolved = await readContract(config, {
        address: challengeAddress,
        abi: parseAbi(['function isSolved() external view returns (bool)']),
        functionName: 'isSolved',
      })
      
      if (isSolved) {
        setStatus('✅ Exploit executed successfully! Challenge is solved. You can now verify.')
        setStatusColor('#00ff00')
      } else {
        if (challenge?.id === 4) {
          try {
            const gameAddress = await readContract(config, {
              address: challengeAddress,
              abi: parseAbi(['function game() external view returns (address)']),
              functionName: 'game',
            })
            const publicClient = config.publicClient
            if (publicClient) {
              const gameBalance = await publicClient.getBalance({ address: gameAddress })
              const required = BigInt(10000000000000000)
              if (gameBalance < required) {
                setStatus(`⚠️ Exploit executed but challenge not solved. Game balance: ${gameBalance.toString()} wei. Needs > 0.01 ETH (${required.toString()} wei). Make sure your exploit sent ETH to the game address: ${gameAddress}`)
                setStatusColor('#ffaa00')
              } else {
                setStatus('⚠️ Exploit executed. Challenge should be solved. Try verifying again.')
                setStatusColor('#ffaa00')
              }
            } else {
              setStatus('⚠️ Exploit executed. Checking if challenge is solved...')
              setStatusColor('#ffaa00')
            }
          } catch (error) {
            console.error('Failed to check game balance:', error)
            setStatus('⚠️ Exploit executed. Challenge may not be solved. Please verify.')
            setStatusColor('#ffaa00')
          }
        } else {
          setStatus('⚠️ Exploit executed but challenge not solved. Please check your exploit.')
          setStatusColor('#ffaa00')
        }
      }
    } catch (error) {
      console.error('Failed to check challenge status:', error)
      setStatus('Exploit executed. Check if challenge is solved.')
      setStatusColor('#ffff00')
    }
  }

  const handleVerifyOnSepolia = async () => {
    if (!address) {
      setStatus('Please connect wallet to verify on-chain')
      setStatusColor('#ff0000')
      return
    }

    setIsVerifying(true)
    setVerificationStatus(null)
    setStatus('Verifying on-chain...')
    setStatusColor('#ffff00')
    
    try {
      const result = await verifyOnSepolia(challenge.id, address)
      setVerificationStatus(result)
      
      if (result.verified) {
        setStatus(`✅ Verified on-chain!\nTransaction: ${result.transactionHash}\nBlock: ${result.blockNumber}`)
        setStatusColor('#00ff00')
      } else {
        setStatus(`⚠️ Verification failed: ${result.error || 'Unknown error'}`)
        setStatusColor('#ff0000')
      }
    } catch (error) {
      setStatus(`Verification error: ${error.message}`)
      setStatusColor('#ff0000')
      setVerificationStatus({ success: false, verified: false, error: error.message })
    } finally {
      setIsVerifying(false)
    }
  }

  const extractContractName = (code) => {
    const match = code.match(/contract\s+(\w+)/)
    return match ? match[1] : null
  }

  const handleMouseDown = (e) => {
    setIsResizing(true)
    e.preventDefault()
  }

  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!isResizing) return
      const mainContent = document.querySelector('[data-main-content]')
      if (!mainContent) return
      const rect = mainContent.getBoundingClientRect()
      const newWidth = ((e.clientX - rect.left) / rect.width) * 100
      const clampedWidth = Math.max(20, Math.min(80, newWidth))
      setLeftPanelWidth(clampedWidth)
    }

    const handleMouseUp = () => {
      setIsResizing(false)
    }

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove)
      document.addEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = 'col-resize'
      document.body.style.userSelect = 'none'
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove)
      document.removeEventListener('mouseup', handleMouseUp)
      document.body.style.cursor = ''
      document.body.style.userSelect = ''
    }
  }, [isResizing])

  const challengeDetails = CHALLENGE_DETAILS[challenge.id]

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <button style={styles.backButton} onClick={onBack}>
          ← BACK
        </button>
        <div style={styles.title}>CHALLENGE {challenge.id}: {challenge.name}</div>
      </div>

      <div style={styles.mainContent} data-main-content>
        <div style={{...styles.leftPanel, width: `${leftPanelWidth}%`}}>
          <ChallengeDetailsPanel challenge={challenge} details={challengeDetails} />
        </div>

        <div
          style={styles.divider}
          onMouseDown={handleMouseDown}
        />

        <div style={{...styles.rightPanel, width: `${100 - leftPanelWidth}%`}}>
              <div style={styles.editorWrapper}>
                <CodeEditor
                  initialCode={exploitCode}
                  onCompile={handleCompileExploit}
              onRun={handleTestExploit}
              challengeId={challenge.id}
                  compact={true}
                />
              </div>
              </div>
            </div>

      {status && (
        <div style={{...styles.status, color: statusColor}}>
          {status}
          {testPassed && (
            <div style={styles.nextChallengeContainer}>
              <button
                style={styles.verifyButton}
                onClick={handleVerifyOnSepolia}
                disabled={isVerifying}
              >
                {isVerifying ? 'Verifying...' : 'Verify on-chain'}
              </button>
                <button
                style={styles.nextChallengeButton}
                onClick={() => {
                  const nextChallenge = CHALLENGES.find(c => c.id === challenge.id + 1)
                  if (nextChallenge && onNextChallenge) {
                    onNextChallenge(nextChallenge)
                  } else {
                    onBack()
                  }
                }}
              >
                Next Challenge
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: 'calc(100vh - 80px)',
    backgroundColor: '#000000',
    color: '#ffffff',
    fontFamily: 'monospace',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    padding: '16px 24px',
    borderBottom: '2px solid #ff0000',
    gap: '16px',
    flexShrink: 0,
  },
  backButton: {
    backgroundColor: '#000000',
    color: '#ffffff',
    border: '2px solid #ffffff',
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'monospace',
    textTransform: 'uppercase',
  },
  title: {
    fontSize: '18px',
    fontWeight: 'bold',
  },
  mainContent: {
    display: 'flex',
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  leftPanel: {
    height: '100%',
    overflow: 'hidden',
    flexShrink: 0,
  },
  divider: {
    width: '4px',
    height: '100%',
    backgroundColor: '#ff0000',
    cursor: 'col-resize',
    flexShrink: 0,
    position: 'relative',
    zIndex: 10,
  },
  rightPanel: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    flexShrink: 0,
    flex: 1,
  },
  stepsContainer: {
    flex: 1,
    overflow: 'auto',
    padding: '24px',
  },
  stepSection: {
    marginBottom: '24px',
  },
  stepTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '12px',
    color: '#ff0000',
    textTransform: 'uppercase',
  },
  button: {
    backgroundColor: '#000000',
    color: '#ffffff',
    border: '2px solid #ffffff',
    padding: '12px 24px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'monospace',
    textTransform: 'uppercase',
  },
  address: {
    fontSize: '12px',
    color: '#ffffff',
    fontFamily: 'monospace',
    padding: '8px',
    backgroundColor: '#1a1a1a',
    border: '1px solid #ffffff',
  },
  editorWrapper: {
    height: '100%',
    border: '2px solid #ff0000',
    display: 'flex',
    flexDirection: 'column',
  },
  status: {
    padding: '12px 24px',
    backgroundColor: '#1a1a1a',
    borderTop: '2px solid #ff0000',
    fontSize: '12px',
    fontFamily: 'monospace',
    color: '#ffffff',
    flexShrink: 0,
    whiteSpace: 'pre-wrap',
    maxHeight: '300px',
    overflow: 'auto',
  },
  testSection: {
    marginTop: '12px',
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
  },
  testButton: {
    backgroundColor: '#00ff00',
    color: '#000000',
    border: '2px solid #00ff00',
    padding: '12px 24px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'monospace',
    textTransform: 'uppercase',
  },
  testResult: {
    padding: '12px',
    fontSize: '12px',
    fontFamily: 'monospace',
    fontWeight: 'bold',
    border: '2px solid #000000',
  },
  testError: {
    marginTop: '8px',
    fontSize: '11px',
    fontFamily: 'monospace',
  },
  hint: {
    fontSize: '11px',
    color: '#888888',
    fontStyle: 'italic',
    marginTop: '4px',
  },
  nextChallengeContainer: {
    marginTop: '16px',
    display: 'flex',
    justifyContent: 'center',
    gap: '12px',
  },
  verifyButton: {
    backgroundColor: '#ffff00',
    color: '#000000',
    border: '2px solid #ffff00',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'monospace',
    textTransform: 'uppercase',
  },
  nextChallengeButton: {
    backgroundColor: '#00ff00',
    color: '#000000',
    border: '2px solid #00ff00',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'monospace',
    textTransform: 'uppercase',
  },
}

export default ChallengeInteraction
