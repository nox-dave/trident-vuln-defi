import Editor from '@monaco-editor/react'

function CodeViewer({ code, language = 'solidity' }) {
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

  return (
    <div style={styles.container}>
      <Editor
        height="100%"
        defaultLanguage={language}
        value={code}
        theme="brutalist"
        beforeMount={handleEditorWillMount}
        options={{
          minimap: { enabled: false },
          fontSize: 13,
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
          readOnly: true,
          scrollbar: {
            vertical: 'auto',
            horizontal: 'auto',
            useShadows: false,
          },
        }}
      />
    </div>
  )
}

const styles = {
  container: {
    height: '100%',
    border: '1px solid #333333',
    backgroundColor: '#000000',
  },
}

export default CodeViewer

