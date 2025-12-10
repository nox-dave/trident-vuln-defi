import { useState } from 'react'
import Editor from '@monaco-editor/react'
import { compileSolidity, extractContractName } from '../utils/compiler'

function CodeEditor({ initialCode, onCompile, onRun }) {
  const [code, setCode] = useState(initialCode || '')
  const [output, setOutput] = useState('')
  const [isCompiling, setIsCompiling] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [compiledContract, setCompiledContract] = useState(null)

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
        { token: 'comment', foreground: '808080' },
        { token: 'keyword', foreground: 'ffffff', fontStyle: 'bold' },
        { token: 'type', foreground: 'ffffff', fontStyle: 'bold' },
        { token: 'string', foreground: 'ffffff' },
        { token: 'number', foreground: 'ffffff' },
        { token: 'number.hex', foreground: 'ffffff' },
        { token: 'number.float', foreground: 'ffffff' },
        { token: 'operator', foreground: 'ffffff' },
        { token: 'identifier', foreground: 'ffffff' },
        { token: 'delimiter', foreground: 'ffffff' },
      ],
      colors: {
        'editor.background': '#000000',
        'editor.foreground': '#ffffff',
        'editor.lineHighlightBackground': '#1a1a1a',
        'editor.selectionBackground': '#ff0000',
        'editor.inactiveSelectionBackground': '#330000',
        'editorCursor.foreground': '#ff0000',
        'editorLineNumber.foreground': '#666666',
        'editorLineNumber.activeForeground': '#ffffff',
        'editorIndentGuide.background': '#1a1a1a',
        'editorIndentGuide.activeBackground': '#333333',
        'editor.selectionHighlightBorder': '#ff0000',
      },
    })
  }

  const handleEditorChange = (value) => {
    setCode(value || '')
  }

  const handleCompile = async () => {
    setIsCompiling(true)
    setOutput('Compiling...')
    
    try {
      const result = await compileSolidity(code)
      
      if (result.errors && result.errors.length > 0) {
        const errorMessages = result.errors
          .filter(e => e.severity === 'error')
          .map(e => `${e.message} (${e.sourceLocation?.file}:${e.sourceLocation?.start}:${e.sourceLocation?.end})`)
          .join('\n')
        setOutput(`Compilation failed:\n${errorMessages}`)
        setCompiledContract(null)
      } else {
        const contractName = extractContractName(code)
        if (contractName && result.contracts) {
          const contracts = result.contracts['contract.sol']
          if (contracts && contracts[contractName]) {
            setCompiledContract(contracts[contractName])
            setOutput(`Compilation successful!\nContract: ${contractName}\nABI: ${JSON.stringify(contracts[contractName].abi, null, 2).substring(0, 200)}...`)
          } else {
            setOutput('Compilation successful but contract not found in output')
          }
        } else {
          setOutput('Compilation successful')
        }
      }
      
      if (onCompile) {
        onCompile(code, result)
      }
    } catch (error) {
      setOutput(`Compilation error: ${error.message}`)
      setCompiledContract(null)
    } finally {
      setIsCompiling(false)
    }
  }

  const handleRun = async () => {
    if (!compiledContract) {
      setOutput('Please compile the contract first')
      return
    }
    
    setIsRunning(true)
    setOutput('Running contract...')
    
    try {
      if (onRun) {
        await onRun(code, compiledContract)
        setOutput('Contract executed successfully')
      } else {
        setOutput('Run handler not configured')
      }
    } catch (error) {
      setOutput(`Execution error: ${error.message}`)
    } finally {
      setIsRunning(false)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.topHeader}>
        <div style={styles.tridentLogo}>
          <pre style={styles.logoAscii}>     ┌─────┼─────┐{'\n'}     ▼     ▼     ▼</pre>
        </div>
        <div style={styles.tridentText}>TRIDENT</div>
      </div>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.solidityBadge}>SOLIDITY 0.8.30</span>
        </div>
        <div style={styles.headerRight}>
          <button style={styles.formatButton} onClick={() => {}}>
            &lt;/&gt; FORMAT
          </button>
          <button 
            style={{...styles.compileButton, opacity: isCompiling ? 0.6 : 1}} 
            onClick={handleCompile}
            disabled={isCompiling}
          >
            ⚙ {isCompiling ? 'COMPILING...' : 'COMPILE'}
          </button>
          <button 
            style={{...styles.runButton, opacity: isRunning || !compiledContract ? 0.6 : 1}} 
            onClick={handleRun}
            disabled={isRunning || !compiledContract}
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
          <pre style={styles.outputText}>{output}</pre>
        </div>
      )}
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100vh',
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

