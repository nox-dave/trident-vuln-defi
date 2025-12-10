function ChallengeCard({ challenge, isSolved, onSelect }) {
  return (
    <div 
      style={{...styles.card, borderColor: isSolved ? '#ff0000' : '#ffffff'}}
      onClick={() => onSelect(challenge)}
    >
      <div style={styles.header}>
        <div style={styles.title}>CHALLENGE {challenge.id}</div>
        {isSolved && <div style={styles.solvedBadge}>SOLVED</div>}
      </div>
      <div style={styles.name}>{challenge.name}</div>
      <div style={styles.difficulty}>DIFFICULTY: {challenge.difficulty}</div>
      {challenge.ascii && (
        <pre style={styles.ascii}>{challenge.ascii}</pre>
      )}
      <div style={styles.description}>{challenge.description}</div>
    </div>
  )
}

const styles = {
  card: {
    border: '2px solid #ffffff',
    padding: '16px',
    backgroundColor: '#000000',
    color: '#ffffff',
    cursor: 'pointer',
    fontFamily: 'monospace',
    minHeight: '120px',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px',
  },
  title: {
    fontSize: '14px',
    fontWeight: 'bold',
    color: '#ffffff',
  },
  solvedBadge: {
    backgroundColor: '#ff0000',
    color: '#000000',
    padding: '2px 8px',
    fontSize: '10px',
    fontWeight: 'bold',
  },
  name: {
    fontSize: '16px',
    fontWeight: 'bold',
    marginBottom: '8px',
    color: '#ffffff',
  },
  difficulty: {
    fontSize: '12px',
    marginBottom: '8px',
    color: '#ffffff',
  },
  description: {
    fontSize: '12px',
    color: '#ffffff',
  },
  ascii: {
    fontSize: '10px',
    lineHeight: '1.2',
    color: '#ffffff',
    fontFamily: 'monospace',
    margin: '8px 0',
    whiteSpace: 'pre',
    textAlign: 'center',
  },
}

export default ChallengeCard
