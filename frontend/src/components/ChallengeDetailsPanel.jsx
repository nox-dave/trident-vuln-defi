import { useState, useEffect } from 'react'
import CodeViewer from './CodeViewer'

function ChallengeDetailsPanel({ challenge, details }) {
  const [hintExpanded, setHintExpanded] = useState(false)
  
  const getStorageKey = (challengeId) => `challenge_${challengeId}_tasks`
  const getTaskExpandedKey = (challengeId) => `challenge_${challengeId}_task_expanded`
  
  const [taskCompletions, setTaskCompletions] = useState(() => {
    if (!challenge) return {}
    const stored = localStorage.getItem(getStorageKey(challenge.id))
    return stored ? JSON.parse(stored) : {}
  })

  const [taskExpandedStates, setTaskExpandedStates] = useState(() => {
    if (!challenge) return {}
    const stored = localStorage.getItem(getTaskExpandedKey(challenge.id))
    return stored ? JSON.parse(stored) : {}
  })

  useEffect(() => {
    if (challenge) {
      const stored = localStorage.getItem(getStorageKey(challenge.id))
      if (stored) {
        setTaskCompletions(JSON.parse(stored))
      } else {
        setTaskCompletions({})
      }
      const expandedStored = localStorage.getItem(getTaskExpandedKey(challenge.id))
      if (expandedStored) {
        setTaskExpandedStates(JSON.parse(expandedStored))
      } else {
        setTaskExpandedStates({})
      }
    }
  }, [challenge])

  const toggleTask = (taskId) => {
    if (!challenge) return
    const newCompletions = {
      ...taskCompletions,
      [taskId]: !taskCompletions[taskId]
    }
    setTaskCompletions(newCompletions)
    localStorage.setItem(getStorageKey(challenge.id), JSON.stringify(newCompletions))
  }

  const toggleTaskExpanded = (taskId) => {
    if (!challenge) return
    const newExpandedStates = {
      ...taskExpandedStates,
      [taskId]: !taskExpandedStates[taskId]
    }
    setTaskExpandedStates(newExpandedStates)
    localStorage.setItem(getTaskExpandedKey(challenge.id), JSON.stringify(newExpandedStates))
  }

  if (!details) {
    return (
      <div style={styles.container}>
        <div style={styles.loading}>Loading challenge details...</div>
      </div>
    )
  }

  const completedCount = details.tasks.filter(task => taskCompletions[task.id]).length

  return (
    <div style={styles.container}>
      <div style={styles.content}>
        <div style={styles.title}>{details.title}</div>

        <div style={styles.scenario}>{details.scenario}</div>

        <div style={styles.codeContainer}>
          <CodeViewer code={details.vulnerableCode} />
        </div>

        <div style={styles.section}>
          <div style={styles.tasksHeader}>
            <span style={styles.sectionTitle}>
              Tasks {completedCount} / {details.tasks.length}
            </span>
          </div>
          {details.tasks.map((task, index) => (
            <div key={task.id} style={styles.taskItem}>
              <div
                style={styles.taskHeader}
                onClick={() => toggleTaskExpanded(task.id)}
              >
                <div style={styles.taskHeaderLeft}>
                  <input
                    type="checkbox"
                    checked={!!taskCompletions[task.id]}
                    onChange={(e) => {
                      e.stopPropagation()
                      toggleTask(task.id)
                    }}
                    onClick={(e) => e.stopPropagation()}
                    style={styles.checkbox}
                  />
                  <span style={styles.taskNumber}>Task {index + 1}</span>
                </div>
                <span style={styles.taskToggle}>{taskExpandedStates[task.id] ? '▼' : '▶'}</span>
              </div>
              {taskExpandedStates[task.id] && (
                <div style={styles.taskContent}>
                  <span style={styles.taskText}>{task.description}</span>
                </div>
              )}
            </div>
          ))}
        </div>

        {details.hints && details.hints.length > 0 && (
          <div style={styles.section}>
            <div
              style={styles.hintHeader}
              onClick={() => setHintExpanded(!hintExpanded)}
            >
              <span style={styles.hintTitle}>Hint</span>
              <span style={styles.hintToggle}>{hintExpanded ? '▼' : '▶'}</span>
            </div>
            {hintExpanded && (
              <div style={styles.hints}>
                {details.hints.map((hint, index) => (
                  <div key={index} style={styles.hint}>
                    {hint}
                  </div>
                ))}
                {details.solution && (
                  <div style={styles.solutionContainer}>
                    <CodeViewer code={details.solution} />
                  </div>
                )}
              </div>
            )}
          </div>
        )}
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
    marginBottom: '12px',
    color: '#ffffff',
  },
  tags: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '8px',
    marginBottom: '12px',
  },
  tag: {
    backgroundColor: '#1a1a1a',
    color: '#ffffff',
    padding: '4px 8px',
    fontSize: '12px',
    border: '1px solid #333333',
  },
  stats: {
    display: 'flex',
    gap: '8px',
    marginBottom: '16px',
  },
  passed: {
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
  scenario: {
    fontSize: '13px',
    lineHeight: '1.6',
    color: '#ffffff',
    marginBottom: '16px',
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
  codeContainer: {
    height: '300px',
    marginBottom: '16px',
  },
  tasksHeader: {
    marginBottom: '12px',
  },
  taskItem: {
    marginBottom: '8px',
    border: '1px solid #333333',
    borderRadius: '4px',
  },
  taskHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    userSelect: 'none',
    padding: '12px',
    backgroundColor: '#1a1a1a',
  },
  taskHeaderLeft: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
  },
  taskNumber: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#ff0000',
  },
  taskToggle: {
    color: '#ff0000',
    fontSize: '12px',
  },
  taskContent: {
    padding: '12px',
    backgroundColor: '#0a0a0a',
  },
  checkbox: {
    cursor: 'pointer',
  },
  taskText: {
    color: '#ffffff',
    fontSize: '13px',
    lineHeight: '1.6',
  },
  hintSection: {
    marginTop: '16px',
    paddingTop: '16px',
    borderTop: '1px solid #333333',
  },
  hintHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    cursor: 'pointer',
    userSelect: 'none',
  },
  hintTitle: {
    fontSize: '13px',
    fontWeight: 'bold',
    color: '#ff0000',
    textTransform: 'uppercase',
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
  solutionContainer: {
    marginTop: '16px',
    marginLeft: '-16px',
    height: '250px',
    width: '100%',
  },
  loading: {
    padding: '24px',
    textAlign: 'center',
    color: '#ffffff',
  },
}

export default ChallengeDetailsPanel

