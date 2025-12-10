import { useState, useEffect } from 'react'
import { useAccount, useConfig } from 'wagmi'
import { useReadContract, useWriteContract, useWaitForTransactionReceipt } from 'wagmi'
import CodeEditor from './CodeEditor'
import ChallengeDetailsPanel from './ChallengeDetailsPanel'
import {
  deployChallenge,
  verifySolution,
  getChallengeAddress,
  CHALLENGE_ABI,
} from '../utils/contractHelpers'
import { CONTRACT_ADDRESSES } from '../config/contracts'
import { CHALLENGE_DETAILS } from '../config/challengeDetails'
import { parseAbi, encodeFunctionData } from 'viem'
import { runTest, loadExploitTemplate } from '../utils/testRunner'

function ChallengeInteraction({ challenge, onBack }) {
  const { address } = useAccount()
  const config = useConfig()
  const [challengeAddress, setChallengeAddress] = useState(null)
  const [exploitAddress, setExploitAddress] = useState(null)
  const [isDeploying, setIsDeploying] = useState(false)
  const [isDeployingExploit, setIsDeployingExploit] = useState(false)
  const [isExecuting, setIsExecuting] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState(null)
  const [status, setStatus] = useState('')
  const [exploitCode, setExploitCode] = useState('')
  const [compiledExploit, setCompiledExploit] = useState(null)
  const [leftPanelWidth, setLeftPanelWidth] = useState(50)
  const [isResizing, setIsResizing] = useState(false)

  const { writeContract: deployChallengeWrite, data: deployHash, isPending: isDeployPending } = useWriteContract()
  const { writeContract: verifyWrite, data: verifyHash, isPending: isVerifyPending } = useWriteContract()
  const { writeContract: executeWrite, data: executeHash, isPending: isExecutePending } = useWriteContract()
  const { writeContract: deployExploitWrite, data: deployExploitHash, isPending: isDeployExploitPending } = useWriteContract()

  const { isLoading: isDeployConfirming } = useWaitForTransactionReceipt({ hash: deployHash })
  const { isLoading: isVerifyConfirming } = useWaitForTransactionReceipt({ hash: verifyHash })
  const { isLoading: isExecuteConfirming } = useWaitForTransactionReceipt({ hash: executeHash })
  const { data: deployExploitReceipt, isLoading: isDeployExploitConfirming } = useWaitForTransactionReceipt({ hash: deployExploitHash })

  useEffect(() => {
    if (challenge && CONTRACT_ADDRESSES.CHALLENGE_FACTORY) {
      loadChallengeAddress()
    }
  }, [challenge, config])

  useEffect(() => {
    if (challenge) {
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
      if (!CONTRACT_ADDRESSES.CHALLENGE_FACTORY) return
      const address = await getChallengeAddress(
        config,
        CONTRACT_ADDRESSES.CHALLENGE_FACTORY,
        challenge.id
      )
      if (address && address !== '0x0000000000000000000000000000000000000000') {
        setChallengeAddress(address)
      }
    } catch (error) {
      console.error('Failed to load challenge address:', error)
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
    if (!result) {
      setStatus('Compiling exploit contract...')
      try {
        const { compileSolidity } = await import('../utils/compiler')
        const compileResult = await compileSolidity(code)
        const contractName = extractContractName(code)
        if (contractName && compileResult.contracts) {
          const contracts = compileResult.contracts['contract.sol']
          if (contracts && contracts[contractName]) {
            setCompiledExploit(contracts[contractName])
            setStatus('Exploit contract compiled successfully')
            return compileResult
          }
        }
        setStatus('Compilation successful but contract not found')
      } catch (error) {
        setStatus(`Compilation failed: ${error.message}`)
        throw error
      }
    } else {
      const contractName = extractContractName(code)
      if (contractName && result.contracts) {
        const contracts = result.contracts['contract.sol']
        if (contracts && contracts[contractName]) {
          setCompiledExploit(contracts[contractName])
          setStatus('Exploit contract compiled successfully')
        }
      }
    }
  }

  const handleTestExploit = async () => {
    if (!exploitCode) {
      setStatus('Please write your exploit code first')
      return
    }

    setIsTesting(true)
    setTestResult(null)
    setStatus('Running browser test...')

    try {
      const result = await runTest(challenge.id, exploitCode)
      setTestResult(result)
      
      if (result.passed) {
        setStatus('✓ Browser test PASSED! You can now deploy on-chain.')
      } else {
        setStatus(`✗ Browser test FAILED: ${result.error || 'Test did not pass'}`)
      }
    } catch (error) {
      setTestResult({ success: false, passed: false, error: error.message })
      setStatus(`Test error: ${error.message}`)
    } finally {
      setIsTesting(false)
    }
  }

  useEffect(() => {
    if (deployExploitReceipt?.contractAddress) {
      setExploitAddress(deployExploitReceipt.contractAddress)
      setStatus('Exploit contract deployed successfully')
      setIsDeployingExploit(false)
    }
  }, [deployExploitReceipt])

  const handleDeployExploit = async () => {
    if (!compiledExploit || !challengeAddress) {
      setStatus('Please compile exploit contract first and deploy challenge')
      return
    }

    setIsDeployingExploit(true)
    setStatus('Deploying exploit contract...')
    try {
      const bytecode = compiledExploit.evm?.bytecode?.object || compiledExploit.bytecode
      const abi = compiledExploit.abi
      
      deployExploitWrite({
        abi: abi,
        bytecode: bytecode,
        args: [challengeAddress],
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
      executeWrite({
        address: exploitAddress,
        abi: parseAbi(['function attack() external payable']),
        functionName: 'attack',
        value: balance || BigInt(100000000000000000),
      })
    } catch (error) {
      setStatus(`Execution failed: ${error.message}`)
      setIsExecuting(false)
    }
  }

  useEffect(() => {
    if (executeHash && !isExecuteConfirming) {
      setStatus('Exploit executed. Check if challenge is solved.')
      setIsExecuting(false)
    }
  }, [executeHash, isExecuteConfirming])

  const handleVerify = async () => {
    if (!address || !challengeAddress) {
      setStatus('Please connect wallet and deploy challenge')
      return
    }

    setIsVerifying(true)
    setStatus('Verifying solution...')
    try {
      verifyWrite({
        address: CONTRACT_ADDRESSES.CHALLENGE_FACTORY,
        abi: parseAbi(['function verifyAndRecord(address user, uint256 challengeId) external']),
        functionName: 'verifyAndRecord',
        args: [address, BigInt(challenge.id)],
      })
    } catch (error) {
      setStatus(`Verification failed: ${error.message}`)
      setIsVerifying(false)
    }
  }

  useEffect(() => {
    if (verifyHash && !isVerifyConfirming) {
      setStatus('Solution verified! Challenge completed.')
      setIsVerifying(false)
    }
  }, [verifyHash, isVerifyConfirming])

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
          <div style={styles.stepsContainer}>
            <div style={styles.stepSection}>
              <div style={styles.stepTitle}>STEP 1: DEPLOY CHALLENGE</div>
              {challengeAddress ? (
                <div style={styles.address}>Deployed: {challengeAddress}</div>
              ) : (
                <button
                  style={{...styles.button, opacity: (isDeploying || isDeployPending || isDeployConfirming) ? 0.6 : 1}}
                  onClick={handleDeployChallenge}
                  disabled={isDeploying || isDeployPending || isDeployConfirming}
                >
                  {(isDeploying || isDeployPending || isDeployConfirming) ? 'DEPLOYING...' : 'DEPLOY CHALLENGE'}
                </button>
              )}
            </div>

            <div style={styles.stepSection}>
              <div style={styles.stepTitle}>STEP 2: WRITE & TEST EXPLOIT (FREE)</div>
              <div style={styles.editorWrapper}>
                <CodeEditor
                  initialCode={exploitCode}
                  onCompile={handleCompileExploit}
                  onRun={() => {}}
                  compact={true}
                />
              </div>
              <div style={styles.testSection}>
                <button
                  style={{...styles.testButton, opacity: (isTesting || !exploitCode) ? 0.6 : 1}}
                  onClick={handleTestExploit}
                  disabled={isTesting || !exploitCode}
                >
                  {isTesting ? 'TESTING...' : '🧪 TEST (FREE)'}
                </button>
                {testResult && (
                  <div style={{
                    ...styles.testResult,
                    backgroundColor: testResult.passed ? '#00ff00' : '#ff0000',
                    color: '#000000'
                  }}>
                    {testResult.passed ? '✓ TEST PASSED' : '✗ TEST FAILED'}
                    {testResult.error && (
                      <div style={styles.testError}>{testResult.error}</div>
                    )}
                  </div>
                )}
              </div>
            </div>

            <div style={styles.stepSection}>
              <div style={styles.stepTitle}>STEP 3: COMPILE EXPLOIT</div>
              <div style={styles.hint}>Compile your exploit before deploying on-chain</div>
            </div>

            <div style={styles.stepSection}>
              <div style={styles.stepTitle}>STEP 4: DEPLOY EXPLOIT (ON-CHAIN)</div>
              {exploitAddress ? (
                <div style={styles.address}>Deployed: {exploitAddress}</div>
              ) : (
                <button
                  style={{...styles.button, opacity: (isDeployingExploit || isDeployExploitPending || isDeployExploitConfirming || !compiledExploit) ? 0.6 : 1}}
                  onClick={handleDeployExploit}
                  disabled={isDeployingExploit || isDeployExploitPending || isDeployExploitConfirming || !compiledExploit}
                >
                  {(isDeployingExploit || isDeployExploitPending || isDeployExploitConfirming) ? 'DEPLOYING...' : 'DEPLOY EXPLOIT'}
                </button>
              )}
            </div>

            <div style={styles.stepSection}>
              <div style={styles.stepTitle}>STEP 5: EXECUTE EXPLOIT (ON-CHAIN)</div>
              <button
                style={{...styles.button, opacity: (isExecuting || isExecutePending || isExecuteConfirming || !exploitAddress) ? 0.6 : 1}}
                onClick={handleExecuteExploit}
                disabled={isExecuting || isExecutePending || isExecuteConfirming || !exploitAddress}
              >
                {(isExecuting || isExecutePending || isExecuteConfirming) ? 'EXECUTING...' : 'EXECUTE EXPLOIT'}
              </button>
            </div>

            <div style={styles.stepSection}>
              <div style={styles.stepTitle}>STEP 6: VERIFY SOLUTION (ON-CHAIN)</div>
              <button
                style={{...styles.button, opacity: (isVerifying || isVerifyPending || isVerifyConfirming) ? 0.6 : 1, backgroundColor: '#ff0000'}}
                onClick={handleVerify}
                disabled={isVerifying || isVerifyPending || isVerifyConfirming}
              >
                {(isVerifying || isVerifyPending || isVerifyConfirming) ? 'VERIFYING...' : 'VERIFY SOLUTION'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {status && (
        <div style={styles.status}>{status}</div>
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
    height: '500px',
    border: '2px solid #ff0000',
  },
  status: {
    padding: '12px 24px',
    backgroundColor: '#1a1a1a',
    borderTop: '2px solid #ff0000',
    fontSize: '12px',
    fontFamily: 'monospace',
    color: '#ffffff',
    flexShrink: 0,
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
}

export default ChallengeInteraction
