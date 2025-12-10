import { useAccount, useConnect, useDisconnect } from 'wagmi'

export default function WalletConnect() {
  const { address, isConnected } = useAccount()
  const { connect, connectors, isPending } = useConnect()
  const { disconnect } = useDisconnect()

  const metaMaskConnector = connectors.find(c => c.id === 'metaMask')

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
    <div style={styles.container}>
      <button
        style={{...styles.connectButton, opacity: isPending ? 0.6 : 1}}
        onClick={() => metaMaskConnector && connect({ connector: metaMaskConnector })}
        disabled={isPending || !metaMaskConnector}
      >
        {isPending ? 'CONNECTING...' : 'CONNECT METAMASK'}
      </button>
    </div>
  )
}

const styles = {
  container: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  connectButton: {
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
}
