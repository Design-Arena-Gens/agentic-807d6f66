import { useState, useEffect, useRef } from 'react'
import Head from 'next/head'

interface Target {
  id: number
  x: number
  y: number
  active: boolean
  hit: boolean
}

export default function Home() {
  const [targets, setTargets] = useState<Target[]>([])
  const [score, setScore] = useState(0)
  const [misses, setMisses] = useState(0)
  const [gameActive, setGameActive] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)
  const [difficulty, setDifficulty] = useState<'easy' | 'medium' | 'hard'>('medium')
  const arenaRef = useRef<HTMLDivElement>(null)
  const gameTimerRef = useRef<NodeJS.Timeout | null>(null)
  const targetTimerRef = useRef<NodeJS.Timeout | null>(null)

  const difficultySettings = {
    easy: { targetDuration: 2000, spawnInterval: 1500, targetSize: 80 },
    medium: { targetDuration: 1500, spawnInterval: 1200, targetSize: 60 },
    hard: { targetDuration: 1000, spawnInterval: 800, targetSize: 45 }
  }

  useEffect(() => {
    return () => {
      if (gameTimerRef.current) clearInterval(gameTimerRef.current)
      if (targetTimerRef.current) clearInterval(targetTimerRef.current)
    }
  }, [])

  const startGame = () => {
    setScore(0)
    setMisses(0)
    setTimeLeft(30)
    setTargets([])
    setGameActive(true)

    gameTimerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          endGame()
          return 0
        }
        return prev - 1
      })
    }, 1000)

    spawnTargets()
  }

  const endGame = () => {
    setGameActive(false)
    if (gameTimerRef.current) clearInterval(gameTimerRef.current)
    if (targetTimerRef.current) clearInterval(targetTimerRef.current)
    setTargets([])
  }

  const spawnTargets = () => {
    const settings = difficultySettings[difficulty]

    targetTimerRef.current = setInterval(() => {
      if (arenaRef.current) {
        const arenaRect = arenaRef.current.getBoundingClientRect()
        const newTarget: Target = {
          id: Date.now(),
          x: Math.random() * (arenaRect.width - settings.targetSize),
          y: Math.random() * (arenaRect.height - settings.targetSize),
          active: true,
          hit: false
        }

        setTargets(prev => [...prev, newTarget])

        setTimeout(() => {
          setTargets(prev => prev.filter(t => t.id !== newTarget.id))
          if (gameActive) {
            setMisses(m => m + 1)
          }
        }, settings.targetDuration)
      }
    }, settings.spawnInterval)
  }

  const hitTarget = (targetId: number) => {
    setTargets(prev =>
      prev.map(t => t.id === targetId ? { ...t, hit: true } : t)
    )
    setScore(s => s + 1)

    setTimeout(() => {
      setTargets(prev => prev.filter(t => t.id !== targetId))
    }, 200)
  }

  const handleArenaClick = () => {
    if (gameActive) {
      setMisses(m => m + 1)
    }
  }

  return (
    <>
      <Head>
        <title>Mobile Arena Targeting Test</title>
        <meta name="description" content="Test your targeting skills on mobile" />
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no" />
      </Head>

      <main style={styles.main}>
        <div style={styles.container}>
          <h1 style={styles.title}>🎯 Arena Targeting</h1>

          {!gameActive && (
            <div style={styles.menu}>
              <div style={styles.stats}>
                {score > 0 && (
                  <>
                    <div style={styles.finalScore}>
                      <h2>Game Over!</h2>
                      <p style={styles.scoreText}>Score: {score}</p>
                      <p style={styles.missText}>Misses: {misses}</p>
                      <p style={styles.accuracyText}>
                        Accuracy: {score > 0 ? Math.round((score / (score + misses)) * 100) : 0}%
                      </p>
                    </div>
                  </>
                )}
              </div>

              <div style={styles.difficultySelector}>
                <h3 style={styles.difficultyTitle}>Select Difficulty:</h3>
                <div style={styles.difficultyButtons}>
                  {(['easy', 'medium', 'hard'] as const).map(level => (
                    <button
                      key={level}
                      onClick={() => setDifficulty(level)}
                      style={{
                        ...styles.difficultyButton,
                        ...(difficulty === level ? styles.difficultyButtonActive : {})
                      }}
                    >
                      {level.toUpperCase()}
                    </button>
                  ))}
                </div>
              </div>

              <button onClick={startGame} style={styles.startButton}>
                START GAME
              </button>
            </div>
          )}

          {gameActive && (
            <>
              <div style={styles.scoreboard}>
                <div style={styles.scoreItem}>
                  <span style={styles.label}>Score:</span>
                  <span style={styles.value}>{score}</span>
                </div>
                <div style={styles.scoreItem}>
                  <span style={styles.label}>Time:</span>
                  <span style={styles.value}>{timeLeft}s</span>
                </div>
                <div style={styles.scoreItem}>
                  <span style={styles.label}>Misses:</span>
                  <span style={styles.value}>{misses}</span>
                </div>
              </div>

              <div
                ref={arenaRef}
                style={styles.arena}
                onClick={handleArenaClick}
              >
                {targets.map(target => (
                  <button
                    key={target.id}
                    onClick={(e) => {
                      e.stopPropagation()
                      if (!target.hit) hitTarget(target.id)
                    }}
                    style={{
                      ...styles.target,
                      left: `${target.x}px`,
                      top: `${target.y}px`,
                      width: `${difficultySettings[difficulty].targetSize}px`,
                      height: `${difficultySettings[difficulty].targetSize}px`,
                      ...(target.hit ? styles.targetHit : {})
                    }}
                    aria-label="Target"
                  >
                    🎯
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
    </>
  )
}

const styles: { [key: string]: React.CSSProperties } = {
  main: {
    minHeight: '100vh',
    padding: '20px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  container: {
    width: '100%',
    maxWidth: '600px',
  },
  title: {
    fontSize: '2.5rem',
    fontWeight: 'bold',
    color: 'white',
    textAlign: 'center',
    marginBottom: '20px',
    textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
  },
  menu: {
    backgroundColor: 'white',
    borderRadius: '20px',
    padding: '30px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
  },
  stats: {
    marginBottom: '20px',
  },
  finalScore: {
    textAlign: 'center',
    padding: '20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '10px',
    marginBottom: '20px',
  },
  scoreText: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#667eea',
    margin: '10px 0',
  },
  missText: {
    fontSize: '1.2rem',
    color: '#e74c3c',
    margin: '5px 0',
  },
  accuracyText: {
    fontSize: '1.2rem',
    color: '#27ae60',
    margin: '5px 0',
  },
  difficultySelector: {
    marginBottom: '20px',
  },
  difficultyTitle: {
    fontSize: '1.2rem',
    marginBottom: '10px',
    color: '#333',
    textAlign: 'center',
  },
  difficultyButtons: {
    display: 'flex',
    gap: '10px',
    justifyContent: 'center',
  },
  difficultyButton: {
    padding: '10px 20px',
    border: '2px solid #667eea',
    borderRadius: '10px',
    backgroundColor: 'white',
    color: '#667eea',
    fontSize: '1rem',
    fontWeight: 'bold',
    cursor: 'pointer',
    transition: 'all 0.3s ease',
  },
  difficultyButtonActive: {
    backgroundColor: '#667eea',
    color: 'white',
  },
  startButton: {
    width: '100%',
    padding: '15px',
    fontSize: '1.3rem',
    fontWeight: 'bold',
    color: 'white',
    backgroundColor: '#27ae60',
    border: 'none',
    borderRadius: '10px',
    cursor: 'pointer',
    boxShadow: '0 4px 15px rgba(39, 174, 96, 0.4)',
    transition: 'transform 0.2s ease',
  },
  scoreboard: {
    display: 'flex',
    justifyContent: 'space-around',
    backgroundColor: 'white',
    borderRadius: '15px',
    padding: '15px',
    marginBottom: '15px',
    boxShadow: '0 5px 20px rgba(0,0,0,0.2)',
  },
  scoreItem: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  label: {
    fontSize: '0.9rem',
    color: '#666',
    marginBottom: '5px',
  },
  value: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: '#667eea',
  },
  arena: {
    position: 'relative',
    width: '100%',
    height: '500px',
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderRadius: '20px',
    boxShadow: '0 10px 40px rgba(0,0,0,0.2)',
    overflow: 'hidden',
    touchAction: 'manipulation',
  },
  target: {
    position: 'absolute',
    border: 'none',
    borderRadius: '50%',
    backgroundColor: '#e74c3c',
    color: 'white',
    fontSize: '2rem',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 15px rgba(231, 76, 60, 0.4)',
    transition: 'transform 0.1s ease',
    touchAction: 'manipulation',
    animation: 'pulse 0.5s ease-in-out',
  },
  targetHit: {
    backgroundColor: '#27ae60',
    transform: 'scale(1.2)',
    animation: 'explode 0.2s ease-out',
  },
}
