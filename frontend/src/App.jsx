import { useState } from 'react'
import WalletConnect from './components/WalletConnect'
import ChallengeList from './components/ChallengeList'
import ChallengeInteraction from './components/ChallengeInteraction'

function App() {
  const [selectedChallenge, setSelectedChallenge] = useState(null)

  if (selectedChallenge) {
    return (
      <div style={styles.app}>
        <div style={styles.topBar}>
          <div style={styles.logo}>
            <pre style={styles.logoAscii}>     ┌─────┼─────┐{'\n'}     ▼     ▼     ▼</pre>
            <div style={styles.logoText}>TRIDENT</div>
          </div>
          <WalletConnect />
        </div>
        <ChallengeInteraction 
          challenge={selectedChallenge}
          onBack={() => setSelectedChallenge(null)}
        />
      </div>
    )
  }

  return (
    <div style={styles.app}>
      <div style={styles.topBar}>
        <div style={styles.logo}>
          <pre style={styles.logoAscii}>     ┌─────┼─────┐{'\n'}     ▼     ▼     ▼</pre>
          <div style={styles.logoText}>TRIDENT</div>
        </div>
        <WalletConnect />
      </div>
      <ChallengeList onSelectChallenge={setSelectedChallenge} />
    </div>
  )
}

const styles = {
  app: {
    minHeight: '100vh',
    backgroundColor: '#000000',
    color: '#ffffff',
    fontFamily: 'monospace',
  },
  topBar: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px 24px',
    backgroundColor: '#ff0000',
    color: '#000000',
    borderBottom: '4px solid #000000',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
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
  logoText: {
    fontSize: '32px',
    fontWeight: 'bold',
    fontFamily: 'monospace',
    color: '#000000',
    letterSpacing: '4px',
  },
}

export default App
