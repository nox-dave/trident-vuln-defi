import { useState, useEffect, useRef } from 'react'
import Editor from '@monaco-editor/react'
import { compileSolidity, extractContractName } from '../utils/compiler'
import { runTest } from '../utils/testRunner'

function CodeEditor({ initialCode, onCompile, onRun, challengeId, compact = false }) {
  const [code, setCode] = useState(initialCode || '')
  const [output, setOutput] = useState('')
  const [outputColor, setOutputColor] = useState('#ffffff')
  const [isCompiling, setIsCompiling] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [compiledContract, setCompiledContract] = useState(null)
  const editorRef = useRef(null)

  useEffect(() => {
    if (initialCode !== undefined) {
      setCode(initialCode)
    }
  }, [initialCode])

  const handleEditorWillMount = (monaco) => {
    monaco.languages.register({ id: 'solidity' })

    monaco.languages.setMonarchTokensProvider('solidity', {
      keywords: [
        'pragma', 'solidity', 'contract', 'interface', 'library', 'is', 'import',
        'function', 'modifier', 'constructor', 'receive', 'fallback', 'event',
        'struct', 'enum', 'mapping', 'address', 'uint', 'int', 'bool', 'string',
        'bytes', 'memory', 'storage', 'calldata', 'public', 'private', 'internal',
        'external', 'view', 'pure', 'payable', 'returns', 'return', 'if', 'else',
        'for', 'while', 'do', 'break', 'continue', 'new', 'delete', 'emit',
        'this', 'super', 'selfdestruct', 'assembly', 'using', 'constant', 'immutable',
        'indexed', 'anonymous', 'override', 'virtual', 'abstract'
      ],
      typeKeywords: [
        'address', 'bool', 'string', 'bytes', 'uint8', 'uint16', 'uint32', 'uint64',
        'uint128', 'uint256', 'int8', 'int16', 'int32', 'int64', 'int128', 'int256',
        'bytes1', 'bytes2', 'bytes3', 'bytes4', 'bytes5', 'bytes6', 'bytes7', 'bytes8',
        'bytes9', 'bytes10', 'bytes11', 'bytes12', 'bytes13', 'bytes14', 'bytes15', 'bytes16',
        'bytes17', 'bytes18', 'bytes19', 'bytes20', 'bytes21', 'bytes22', 'bytes23', 'bytes24',
        'bytes25', 'bytes26', 'bytes27', 'bytes28', 'bytes29', 'bytes30', 'bytes31', 'bytes32'
      ],
      operators: [
        '=', '>', '<', '!', '~', '?', ':', '==', '<=', '>=', '!=',
        '&&', '||', '++', '--', '+', '-', '*', '/', '&', '|', '^', '%',
        '<<', '>>', '>>>', '+=', '-=', '*=', '/=', '&=', '|=', '^=',
        '%=', '<<=', '>>=', '>>>='
      ],
      symbols: /[=><!~?:&|+\-*\/\^%]+/,
      tokenizer: {
        root: [
          [/\/\//, 'comment'],
          [/\/\*/, 'comment', '@comment'],
          [/pragma\s+solidity/, 'keyword'],
          [/[a-z_$][\w$]*/, {
            cases: {
              '@keywords': 'keyword',
              '@typeKeywords': 'type',
              '@default': 'identifier'
            }
          }],
          [/[A-Z][\w\$]*/, 'type'],
          [/\d*\.\d+([eE][\-+]?\d+)?/, 'number.float'],
          [/0[xX][0-9a-fA-F]+/, 'number.hex'],
          [/\d+/, 'number'],
          [/[;,.]/, 'delimiter'],
          [/["']/, 'string', '@string'],
          [/[{}()\[\]]/, '@brackets'],
          [/@symbols/, {
            cases: {
              '@operators': 'operator',
              '@default': ''
            }
          }],
          [/\s+/, 'white']
        ],
        comment: [
          [/[^/*]+/, 'comment'],
          [/\/\*/, 'comment', '@push'],
          [/\*\//, 'comment', '@pop'],
          [/[/*]/, 'comment']
        ],
        string: [
          [/[^"']+/, 'string'],
          [/["']/, 'string', '@pop']
        ]
      }
    })

    monaco.editor.defineTheme('brutalist', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '6A9955' },
        { token: 'keyword', foreground: 'C586C0', fontStyle: 'bold' },
        { token: 'type', foreground: '4EC9B0', fontStyle: 'bold' },
        { token: 'string', foreground: 'CE9178' },
        { token: 'number', foreground: 'B5CEA8' },
        { token: 'number.hex', foreground: 'B5CEA8' },
        { token: 'number.float', foreground: 'B5CEA8' },
        { token: 'operator', foreground: 'D4D4D4' },
        { token: 'identifier', foreground: '9CDCFE' },
        { token: 'delimiter', foreground: 'D4D4D4' },
      ],
      colors: {
        'editor.background': '#000000',
        'editor.foreground': '#D4D4D4',
        'editor.lineHighlightBackground': '#1a1a1a',
        'editor.selectionBackground': '#ff0000',
        'editor.inactiveSelectionBackground': '#330000',
        'editorCursor.foreground': '#ff0000',
        'editorLineNumber.foreground': '#666666',
        'editorLineNumber.activeForeground': '#ffffff',
        'editorIndentGuide.background': '#1a1a1a',
        'editorIndentGuide.activeBackground': '#333333',
        'editor.selectionHighlightBorder': '#ff0000',
        'scrollbar.shadow': '#000000',
        'scrollbarSlider.background': '#1a1a1a',
        'scrollbarSlider.hoverBackground': '#ff0000',
        'scrollbarSlider.activeBackground': '#ff0000',
      },
    })
  }

  const handleEditorChange = (value) => {
    setCode(value || '')
  }

  const handleEditorDidMount = (editor) => {
    editorRef.current = editor
  }

  const handleCompile = async () => {
    setIsCompiling(true)
    setOutput('Compiling...')
    setOutputColor('#ffffff')
    
    let currentCode = code
    if (editorRef.current) {
      currentCode = editorRef.current.getValue() || code
    }
    
    try {
      const result = await compileSolidity(currentCode)
      
      if (result.errors && result.errors.length > 0) {
        const errorMessages = result.errors
          .filter(e => e.severity === 'error')
          .map(e => e.formattedMessage || e.message)
          .join('\n')
        setOutput('')
        setOutputColor('#ff0000')
        setCompiledContract(null)
        if (onCompile) {
          onCompile(currentCode, { ...result, compilationError: errorMessages })
        }
        return
      } else {
        const contractName = extractContractName(currentCode)
        if (contractName && result.contracts) {
          const contracts = result.contracts['contract.sol']
          if (contracts && contracts[contractName]) {
            setCompiledContract(contracts[contractName])
            setOutput('')
            setOutputColor('#00ff00')
          } else {
            setOutput('Compilation successful but contract not found in output')
            setOutputColor('#ff0000')
          }
        } else {
          setOutput('')
          setOutputColor('#00ff00')
        }
      }
      
      if (onCompile) {
        onCompile(currentCode, result)
      }
    } catch (error) {
      setOutput('')
      setOutputColor('#ff0000')
      setCompiledContract(null)
      if (onCompile) {
        onCompile(currentCode, { compilationError: error.message })
      }
    } finally {
      setIsCompiling(false)
    }
  }

  const handleRun = async () => {
    let currentCode = code
    if (editorRef.current) {
      currentCode = editorRef.current.getValue() || code
    }
    
    if (!currentCode || !challengeId) {
      setOutput('Please write your exploit code first')
      return
    }
    
    setIsRunning(true)
    setOutput('Compiling...')
    setOutputColor('#ffffff')
    
    try {
      const compileResult = await compileSolidity(currentCode)
      
      if (compileResult.errors && compileResult.errors.length > 0) {
        const errorMessages = compileResult.errors
          .filter(e => e.severity === 'error')
          .map(e => e.formattedMessage || e.message)
          .join('\n')
        setOutput('')
        setOutputColor('#ff0000')
        if (onCompile) {
          onCompile(currentCode, { ...compileResult, compilationError: errorMessages })
        }
        setIsRunning(false)
        return
      }
      
      const contractName = extractContractName(currentCode)
      if (contractName && compileResult.contracts) {
        const contracts = compileResult.contracts['contract.sol']
        if (contracts && contracts[contractName]) {
          setCompiledContract(contracts[contractName])
        }
      }
      
      if (onCompile) {
        onCompile(currentCode, compileResult)
      }
      
      setOutput('Running test...')
      setOutputColor('#ffffff')
      
      const result = await runTest(challengeId, currentCode)
      
      if (result.passed) {
        setOutput('')
      } else {
        setOutput('')
        const errorOutput = formatFoundryError(result.output || result.error || 'Test failed')
        if (onRun) {
          onRun(currentCode, { ...result, formattedError: errorOutput })
        }
        return
      }
      
      if (onRun) {
        onRun(currentCode, result)
      }
    } catch (error) {
      setOutput('')
      setOutputColor('#ff0000')
      if (error.message && error.message.includes('compilation')) {
        if (onCompile) {
          onCompile(currentCode, { compilationError: error.message })
        }
      } else {
        if (onRun) {
          onRun(currentCode, { success: false, passed: false, error: error.message })
        }
      }
    } finally {
      setIsRunning(false)
    }
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

  return (
    <div style={{...styles.container, height: '100%', display: 'flex', flexDirection: 'column'}}>
      {!compact && (
        <div style={styles.topHeader}>
          <div style={styles.tridentLogo}>
            <pre style={styles.logoAscii}>     ┌─────┼─────┐{'\n'}     ▼     ▼     ▼</pre>
          </div>
          <div style={styles.tridentText}>TRIDENT</div>
        </div>
      )}
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.solidityBadge}>SOLIDITY 0.8.30</span>
        </div>
        <div style={styles.headerRight}>
          <button 
            style={{...styles.runButton, opacity: isRunning || !code ? 0.6 : 1}} 
            onClick={handleRun}
            disabled={isRunning || !code}
          >
            ▶ {isRunning ? 'RUNNING...' : 'RUN'}
          </button>
        </div>
      </div>
      
      <div style={styles.editorContainer}>
        <Editor
          height="100%"
          defaultLanguage="solidity"
          value={code}
          onChange={handleEditorChange}
          onMount={handleEditorDidMount}
          theme="brutalist"
          beforeMount={handleEditorWillMount}
          options={{
            minimap: { enabled: false },
            fontSize: 14,
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            automaticLayout: true,
            tabSize: 4,
            wordWrap: 'on',
            fontFamily: 'monospace',
            padding: { top: 10, bottom: 10 },
            renderLineHighlight: 'none',
            overviewRulerBorder: false,
            hideCursorInOverviewRuler: true,
            scrollbar: {
              vertical: 'auto',
              horizontal: 'auto',
              useShadows: false,
            },
          }}
        />
      </div>
      
      {output && (
        <div style={styles.output}>
          <pre style={{...styles.outputText, color: outputColor}}>{output}</pre>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: '#000000',
    color: '#ffffff',
    fontFamily: 'monospace',
  },
  topHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: '16px',
    padding: '16px 24px',
    backgroundColor: '#ff0000',
    color: '#000000',
    borderBottom: '4px solid #000000',
  },
  tridentLogo: {
    display: 'flex',
    alignItems: 'center',
  },
  logoAscii: {
    margin: 0,
    padding: 0,
    fontSize: '14px',
    lineHeight: '1.2',
    fontFamily: 'monospace',
    color: '#000000',
    fontWeight: 'bold',
  },
  tridentText: {
    fontSize: '32px',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    color: '#000000',
    letterSpacing: '4px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '12px 16px',
    borderBottom: '2px solid #ff0000',
    backgroundColor: '#000000',
  },
  headerLeft: {
    display: 'flex',
    alignItems: 'center',
  },
  solidityBadge: {
    backgroundColor: '#ff0000',
    color: '#000000',
    padding: '4px 8px',
    fontSize: '12px',
    fontWeight: 'bold',
    border: '2px solid #ff0000',
  },
  headerRight: {
    display: 'flex',
    gap: '8px',
  },
  formatButton: {
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
  compileButton: {
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
  runButton: {
    backgroundColor: '#ff0000',
    color: '#000000',
    border: '2px solid #ff0000',
    padding: '8px 16px',
    fontSize: '12px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'monospace',
    textTransform: 'uppercase',
  },
  editorContainer: {
    flex: 1,
    overflow: 'hidden',
  },
  output: {
    padding: '12px 16px',
    backgroundColor: '#000000',
    borderTop: '2px solid #ff0000',
    color: '#ffffff',
    fontSize: '12px',
    fontFamily: 'monospace',
    minHeight: '40px',
    maxHeight: '200px',
    overflow: 'auto',
  },
  outputText: {
    margin: 0,
    padding: 0,
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  },
}

export default CodeEditor

