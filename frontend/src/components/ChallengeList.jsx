import { useAccount } from 'wagmi'
import { useReadContract } from 'wagmi'
import { useEffect, useState } from 'react'
import ChallengeCard from './ChallengeCard'
import { checkSolved, PROGRESS_TRACKER_ABI } from '../utils/contractHelpers'
import { CONTRACT_ADDRESSES, CHALLENGES } from '../config/contracts'
import { useConfig } from 'wagmi'

function ChallengeList({ onSelectChallenge }) {
  const { address } = useAccount()
  const config = useConfig()
  const [solvedChallenges, setSolvedChallenges] = useState(new Set())

  useEffect(() => {
    if (address && CONTRACT_ADDRESSES.PROGRESS_TRACKER) {
      loadSolvedChallenges()
    }
  }, [address, config])

  const loadSolvedChallenges = async () => {
    try {
      if (!address || !CONTRACT_ADDRESSES.PROGRESS_TRACKER) return
      
      const solved = new Set()
      for (const challenge of CHALLENGES) {
        try {
          const isSolved = await checkSolved(
            config,
            CONTRACT_ADDRESSES.PROGRESS_TRACKER,
            address,
            challenge.id
          )
          if (isSolved) {
            solved.add(challenge.id)
          }
        } catch (error) {
          console.error(`Failed to check challenge ${challenge.id}:`, error)
        }
      }
      setSolvedChallenges(solved)
    } catch (error) {
      console.error('Failed to load solved challenges:', error)
    }
  }

  return (
    <div style={styles.container}>
      <div style={styles.title}>CHALLENGES</div>
      <div style={styles.grid}>
        {CHALLENGES.map(challenge => (
          <ChallengeCard
            key={challenge.id}
            challenge={challenge}
            isSolved={solvedChallenges.has(challenge.id)}
            onSelect={onSelectChallenge}
          />
        ))}
      </div>
    </div>
  )
}

const styles = {
  container: {
    padding: '24px',
    backgroundColor: '#000000',
    color: '#ffffff',
    fontFamily: 'monospace',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '24px',
    borderBottom: '2px solid #ff0000',
    paddingBottom: '12px',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
    gap: '16px',
  },
}

export default ChallengeList
