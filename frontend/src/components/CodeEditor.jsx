import { useState } from 'react'
import Editor from '@monaco-editor/react'

function CodeEditor({ initialCode, onCompile, onRun }) {
  const [code, setCode] = useState(initialCode || '')
  const [output, setOutput] = useState('')

  const handleEditorWillMount = (monaco) => {
    monaco.editor.defineTheme('brutalist', {
      base: 'vs-dark',
      inherit: true,
      rules: [
        { token: 'comment', foreground: '808080' },
        { token: 'keyword', foreground: 'ffffff', fontStyle: 'bold' },
        { token: 'string', foreground: 'ffffff' },
        { token: 'number', foreground: 'ffffff' },
        { token: 'type', foreground: 'ffffff' },
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

  const handleCompile = () => {
    setOutput('Compiling...')
    if (onCompile) {
      onCompile(code)
    }
    setTimeout(() => {
      setOutput('Compilation complete')
    }, 500)
  }

  const handleRun = () => {
    setOutput('Running...')
    if (onRun) {
      onRun(code)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerLeft}>
          <span style={styles.solidityBadge}>SOLIDITY 0.8.30</span>
        </div>
        <div style={styles.headerRight}>
          <button style={styles.formatButton} onClick={() => {}}>
            &lt;/&gt; FORMAT
          </button>
          <button style={styles.compileButton} onClick={handleCompile}>
            ⚙ COMPILE
          </button>
          <button style={styles.runButton} onClick={handleRun}>
            ▶ RUN
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
          {output}
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
  },
}

export default CodeEditor

