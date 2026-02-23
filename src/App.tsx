import { useState, useEffect, useMemo } from 'react'
import './App.css'
import movesData from './data/pokemon_moves.json'

interface PokemonMove {
  name: string
  type: string
  category: string
  power: number | null
  accuracy: number | null
  pp: number
  effect: string
  probability: number | null
  makes_contact: boolean
  introduced: number
  priority: number
}

type ComparisonResult = 'correct' | 'higher' | 'lower' | 'wrong'

interface GuessResult {
  move: PokemonMove
  comparisons: {
    name: ComparisonResult
    type: ComparisonResult
    category: ComparisonResult
    power: ComparisonResult
    accuracy: ComparisonResult
    pp: ComparisonResult
    makes_contact: ComparisonResult
    introduced: ComparisonResult
    priority: ComparisonResult
  }
}

// Seeded random number generator
function seededRandom(seed: number): number {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

// Get today's date as a seed (YYYYMMDD format)
function getTodaySeed(): number {
  const today = new Date()
  const year = today.getFullYear()
  const month = today.getMonth() + 1
  const day = today.getDate()
  return year * 10000 + month * 100 + day
}

function App() {
  const [moves, setMoves] = useState<PokemonMove[]>([])
  const [targetMove, setTargetMove] = useState<PokemonMove | null>(null)
  const [guesses, setGuesses] = useState<GuessResult[]>([])
  const [input, setInput] = useState('')
  const [showAutocomplete, setShowAutocomplete] = useState(false)
  const [gameWon, setGameWon] = useState(false)

  useEffect(() => {
    const data = movesData as Record<string, unknown>[]
    const parsedMoves: PokemonMove[] = data.map(item => {
      const powerRaw = item.power
      const accuracyRaw = item.accuracy
      const introducedRaw = item.introduced
      
      return {
        name: String(item.name || ''),
        type: String(item.type || ''),
        category: String(item.category || ''),
        power: powerRaw != null && powerRaw !== '-' && powerRaw !== '' ? Number(powerRaw) : null,
        accuracy: accuracyRaw != null && accuracyRaw !== '-' && accuracyRaw !== '' ? Number(accuracyRaw) : null,
        pp: Number(item.pp) || 0,
        effect: String(item.description || ''),
        probability: null,
        makes_contact: item.makes_contact === true || item.makes_contact === 'true' || item.makes_contact === 1 || item.makes_contact === 'yes',
        introduced: introducedRaw != null && !isNaN(Number(introducedRaw)) && Number(introducedRaw) > 0 ? Number(introducedRaw) : 1,
        priority: Number(item.priority) || 0,
      }
    }).filter(m => m.name)
    
    console.log('Sample moves with introduced:', parsedMoves.slice(0, 5).map(m => ({ name: m.name, introduced: m.introduced })))
    
    setMoves(parsedMoves)
    
    // Use today's date as seed to pick the same move for everyone
    const seed = getTodaySeed()
    const randomIndex = Math.floor(seededRandom(seed) * parsedMoves.length)
    setTargetMove(parsedMoves[randomIndex])
  }, [])

  const filteredMoves = useMemo(() => {
    if (!input.trim()) return []
    const guessedNames = guesses.map(g => g.move.name.toLowerCase())
    return moves
      .filter(m => 
        m.name.toLowerCase().includes(input.toLowerCase()) &&
        !guessedNames.includes(m.name.toLowerCase())
      )
      .slice(0, 8)
  }, [input, moves, guesses])

  const compareValues = (guess: number | null, target: number | null): ComparisonResult => {
    if (guess === target) return 'correct'
    if (guess === null || target === null) return 'wrong'
    return guess < target ? 'higher' : 'lower'
  }

  const compareNumbers = (guess: number, target: number): ComparisonResult => {
    if (guess === target) return 'correct'
    return guess < target ? 'higher' : 'lower'
  }

  const makeGuess = (move: PokemonMove) => {
    if (!targetMove || gameWon) return

    const result: GuessResult = {
      move,
      comparisons: {
        name: move.name === targetMove.name ? 'correct' : 'wrong',
        type: move.type === targetMove.type ? 'correct' : 'wrong',
        category: move.category === targetMove.category ? 'correct' : 'wrong',
        power: compareValues(move.power, targetMove.power),
        accuracy: compareValues(move.accuracy, targetMove.accuracy),
        pp: compareValues(move.pp, targetMove.pp),
        makes_contact: move.makes_contact === targetMove.makes_contact ? 'correct' : 'wrong',
        introduced: compareNumbers(move.introduced, targetMove.introduced),
        priority: compareNumbers(move.priority, targetMove.priority),
      }
    }

    setGuesses(prev => [...prev, result])
    setInput('')
    setShowAutocomplete(false)

    if (move.name === targetMove.name) {
      setGameWon(true)
    }
  }

  const resetGame = () => {
    // Reset to today's move (same for everyone)
    const seed = getTodaySeed()
    const randomIndex = Math.floor(seededRandom(seed) * moves.length)
    setTargetMove(moves[randomIndex])
    setGuesses([])
    setGameWon(false)
    setInput('')
  }

  const getResultStyle = (result: ComparisonResult): React.CSSProperties => {
    switch (result) {
      case 'correct': return { backgroundColor: '#538d4e', color: 'white' }
      case 'higher': return { backgroundColor: '#b59f3b', color: 'white' }
      case 'lower': return { backgroundColor: '#b59f3b', color: 'white' }
      case 'wrong': return { backgroundColor: '#3a3a3c', color: 'white' }
    }
  }

  const getIndicator = (result: ComparisonResult): string => {
    switch (result) {
      case 'correct': return '✓'
      case 'higher': return '↑'
      case 'lower': return '↓'
      case 'wrong': return '✗'
    }
  }

  if (!targetMove) return <div>Loading moves...</div>

  return (
    <div style={{ padding: '20px', maxWidth: '1100px', margin: '0 auto' }}>
      <h1>Hidden Machines</h1>
      <p>Guess the Pokémon move! Arrows indicate if the target value is higher (↑) or lower (↓).</p>

      {gameWon ? (
        <div style={{ marginBottom: '20px' }}>
          <h2 style={{ color: '#538d4e' }}>🎉 You got it in {guesses.length} guesses!</h2>
          <button onClick={resetGame} style={{ padding: '10px 20px', fontSize: '16px' }}>
            Play Again
          </button>
        </div>
      ) : (
        <div style={{ position: 'relative', marginBottom: '20px' }}>
          <input
            type="text"
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              setShowAutocomplete(true)
            }}
            onFocus={() => setShowAutocomplete(true)}
            placeholder="Type a move name..."
            style={{ padding: '10px', width: '300px', fontSize: '16px' }}
          />
          {showAutocomplete && filteredMoves.length > 0 && (
            <div style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              backgroundColor: '#1a1a1a',
              border: '1px solid #444',
              borderRadius: '4px',
              width: '300px',
              maxHeight: '200px',
              overflowY: 'auto',
              zIndex: 10
            }}>
              {filteredMoves.map(move => (
                <div
                  key={move.name}
                  onClick={() => makeGuess(move)}
                  style={{
                    padding: '10px',
                    cursor: 'pointer',
                    borderBottom: '1px solid #333',
                  }}
                  onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#333'}
                  onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                >
                  {move.name} <span style={{ color: '#888', fontSize: '12px' }}>({move.type})</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {guesses.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ borderCollapse: 'collapse', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ padding: '10px', border: '1px solid #444' }}>Name</th>
                <th style={{ padding: '10px', border: '1px solid #444' }}>Type</th>
                <th style={{ padding: '10px', border: '1px solid #444' }}>Category</th>
                <th style={{ padding: '10px', border: '1px solid #444' }}>Power</th>
                <th style={{ padding: '10px', border: '1px solid #444' }}>Accuracy</th>
                <th style={{ padding: '10px', border: '1px solid #444' }}>PP</th>
                <th style={{ padding: '10px', border: '1px solid #444' }}>Contact</th>
                <th style={{ padding: '10px', border: '1px solid #444' }}>Gen</th>
                <th style={{ padding: '10px', border: '1px solid #444' }}>Priority</th>
              </tr>
            </thead>
            <tbody>
              {guesses.map((guess, i) => (
                <tr key={i}>
                  <td style={{ ...getResultStyle(guess.comparisons.name), padding: '10px', border: '1px solid #444', textAlign: 'center' }}>
                    {guess.move.name} {getIndicator(guess.comparisons.name)}
                  </td>
                  <td style={{ ...getResultStyle(guess.comparisons.type), padding: '10px', border: '1px solid #444', textAlign: 'center' }}>
                    {guess.move.type} {getIndicator(guess.comparisons.type)}
                  </td>
                  <td style={{ ...getResultStyle(guess.comparisons.category), padding: '10px', border: '1px solid #444', textAlign: 'center' }}>
                    {guess.move.category} {getIndicator(guess.comparisons.category)}
                  </td>
                  <td style={{ ...getResultStyle(guess.comparisons.power), padding: '10px', border: '1px solid #444', textAlign: 'center' }}>
                    {guess.move.power ?? '-'} {getIndicator(guess.comparisons.power)}
                  </td>
                  <td style={{ ...getResultStyle(guess.comparisons.accuracy), padding: '10px', border: '1px solid #444', textAlign: 'center' }}>
                    {guess.move.accuracy ?? '-'} {getIndicator(guess.comparisons.accuracy)}
                  </td>
                  <td style={{ ...getResultStyle(guess.comparisons.pp), padding: '10px', border: '1px solid #444', textAlign: 'center' }}>
                    {guess.move.pp} {getIndicator(guess.comparisons.pp)}
                  </td>
                  <td style={{ ...getResultStyle(guess.comparisons.makes_contact), padding: '10px', border: '1px solid #444', textAlign: 'center' }}>
                    {guess.move.makes_contact ? 'Yes' : 'No'} {getIndicator(guess.comparisons.makes_contact)}
                  </td>
                  <td style={{ ...getResultStyle(guess.comparisons.introduced), padding: '10px', border: '1px solid #444', textAlign: 'center' }}>
                    {guess.move.introduced} {getIndicator(guess.comparisons.introduced)}
                  </td>
                  <td style={{ ...getResultStyle(guess.comparisons.priority), padding: '10px', border: '1px solid #444', textAlign: 'center' }}>
                    {guess.move.priority} {getIndicator(guess.comparisons.priority)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div style={{ marginTop: '20px', color: '#888', fontSize: '14px' }}>
        <p><strong>Legend:</strong> ✓ = Correct | ✗ = Wrong | ↑ = Target is higher | ↓ = Target is lower</p>
        <p>Green = Correct | Yellow = Close (higher/lower) | Gray = Wrong</p>
      </div>
    </div>
  )
}

export default App
