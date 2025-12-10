import { useAccount, useConnect, useDisconnect } from 'wagmi'
import { useState, useEffect, useRef, useCallback } from 'react'

export default function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending, error } = useConnect()
  const { disconnect } = useDisconnect()
  const [errorMessage, setErrorMessage] = useState('')
  const connectingRef = useRef(false)

  const metaMaskConnector = connectors[0]

  useEffect(() => {
    if (error) {
      setErrorMessage(error.message)
      connectingRef.current = false
    } else {
      setErrorMessage('')
    }
  }, [error])

  useEffect(() => {
    if (isConnected) {
      connectingRef.current = false
    }
  }, [isConnected])

  const handleConnect = useCallback(() => {
    if (connectingRef.current || isPending || isConnected) {
      return
    }
    
    connectingRef.current = true
    setErrorMessage('')
    
    if (!metaMaskConnector) {
      setErrorMessage('MetaMask not found. Please install MetaMask extension.')
      connectingRef.current = false
      return
    }
    
    connect({ connector: metaMaskConnector })
  }, [connect, metaMaskConnector, isPending, isConnected])

  if (isConnected) {
    return (
      <div style={styles.container}>
        <div style={styles.address}>
          {address?.slice(0, 6)}...{address?.slice(-4)}
        </div>
        <button style={styles.disconnectButton} onClick={() => disconnect()}>
          DISCONNECT
        </button>
      </div>
    )
  }

  return (
    <div style={styles.wrapper}>
      <button
        style={{...styles.connectButton, opacity: (isPending || connectingRef.current) ? 0.6 : 1}}
        onClick={handleConnect}
        disabled={isPending || !metaMaskConnector || connectingRef.current}
      >
        {(isPending || connectingRef.current) ? 'CONNECTING...' : 'CONNECT WALLET'}
      </button>
      {errorMessage && (
        <div style={styles.error}>{errorMessage}</div>
      )}
      {!metaMaskConnector && connectors.length > 0 && (
        <div style={styles.error}>
          MetaMask connector not found. Available: {connectors.map(c => c.name || c.id).join(', ')}
        </div>
      )}
    </div>
  )
}

const styles = {
  wrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: '4px',
  },
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  connectButton: {
    backgroundColor: '#ff0000',
    color: '#000000',
    border: '2px solid #000000',
    padding: '12px 24px',
    fontSize: '14px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'monospace',
    textTransform: 'uppercase',
    outline: 'none',
  },
  address: {
    color: '#000000',
    fontSize: '12px',
    fontFamily: 'monospace',
    padding: '4px 8px',
    backgroundColor: '#ffffff',
    border: '1px solid #000000',
  },
  disconnectButton: {
    backgroundColor: '#000000',
    color: '#ffffff',
    border: '2px solid #000000',
    padding: '6px 12px',
    fontSize: '10px',
    fontWeight: 'bold',
    cursor: 'pointer',
    fontFamily: 'monospace',
    textTransform: 'uppercase',
  },
  error: {
    fontSize: '10px',
    color: '#ff0000',
    fontFamily: 'monospace',
    textAlign: 'right',
    maxWidth: '200px',
  },
}
