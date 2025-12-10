import { useState } from 'react'
import CodeViewer from './CodeViewer'

function ChallengeDetailsPanel({ challenge, details }) {
  const [hintExpanded, setHintExpanded] = useState(false)

  if (!details) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading challenge details...</div>
      </div>
    )
  }

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.title}>{details.title}</div>
        
        <div style={styles.tags}>
          {details.tags.map((tag, index) => (
            <span key={index} style={styles.tag}>{tag}</span>
          ))}
          <span style={styles.points}>{details.points} points</span>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>Scenario</div>
          <div style={styles.scenario}>{details.scenario}</div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>Vulnerable Contract Code</div>
          <div style={styles.codeContainer}>
            <CodeViewer code={details.vulnerableCode} />
          </div>
        </div>

        <div style={styles.section}>
          <div style={styles.sectionTitle}>
            Tasks {details.tasks.filter(t => t.completed).length} / {details.tasks.length}
          </div>
          {details.tasks.map((task) => (
            <div key={task.id} style={styles.task}>
              <input
                type="checkbox"
                checked={task.completed}
                readOnly
                style={styles.checkbox}
              />
              <span style={styles.taskText}>{task.description}</span>
            </div>
          ))}
        </div>

        <div style={styles.section}>
          <div
            style={styles.hintHeader}
            onClick={() => setHintExpanded(!hintExpanded)}
          >
            <span style={styles.sectionTitle}>Hint</span>
            <span style={styles.hintToggle}>{hintExpanded ? '▼' : '▶'}</span>
          </div>
          {hintExpanded && (
            <div style={styles.hints}>
              {details.hints.map((hint, index) => (
                <div key={index} style={styles.hint}>
                  {hint}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

const styles = {
  container: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000000',
    color: '#ffffff',
    fontFamily: 'monospace',
    overflow: 'auto',
    borderRight: '2px solid #ff0000',
  },
  content: {
    padding: '24px',
  },
  title: {
    fontSize: '24px',
    fontWeight: 'bold',
    marginBottom: '16px',
    color: '#ffffff',
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '24px',
  },
  tag: {
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    padding: '4px 8px',
    fontSize: '12px',
    border: '1px solid #333333',
  },
  points: {
    backgroundColor: '#ff0000',
    color: '#000000',
    padding: '4px 8px',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: '24px',
  },
  sectionTitle: {
    fontSize: '14px',
    fontWeight: 'bold',
    marginBottom: '12px',
    color: '#ff0000',
    textTransform: 'uppercase',
  },
  scenario: {
    fontSize: '13px',
    lineHeight: '1.6',
    color: '#ffffff',
    marginBottom: '16px',
  },
  codeContainer: {
    height: '400px',
    marginBottom: '16px',
  },
  task: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    marginBottom: '12px',
    fontSize: '13px',
    lineHeight: '1.6',
  },
  checkbox: {
    marginTop: '2px',
    cursor: 'default',
  },
  taskText: {
    color: '#ffffff',
    flex: 1,
  },
  hintHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    userSelect: 'none',
  },
  hintToggle: {
    color: '#ff0000',
    fontSize: '12px',
  },
  hints: {
    marginTop: '12px',
    paddingLeft: '16px',
  },
  hint: {
    fontSize: '13px',
    lineHeight: '1.6',
    color: '#ffffff',
    marginBottom: '8px',
  },
  loading: {
    padding: '24px',
    textAlign: 'center',
    color: '#ffffff',
  },
}

export default ChallengeDetailsPanel

