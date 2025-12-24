import { useState, useEffect, useCallback } from 'react'
import { RefreshCw, Check, X } from 'lucide-react'

/**
 * Simple math-based CAPTCHA component
 * For production, consider using reCAPTCHA or hCaptcha
 */
const SimpleCaptcha = ({ onVerify, onError }) => {
  const [challenge, setChallenge] = useState({ num1: 0, num2: 0, operator: '+' })
  const [answer, setAnswer] = useState('')
  const [isVerified, setIsVerified] = useState(false)
  const [error, setError] = useState('')
  const [attempts, setAttempts] = useState(0)

  const generateChallenge = useCallback(() => {
    const operators = ['+', '-', '*']
    const operator = operators[Math.floor(Math.random() * operators.length)]

    let num1, num2

    switch (operator) {
      case '+':
        num1 = Math.floor(Math.random() * 20) + 1
        num2 = Math.floor(Math.random() * 20) + 1
        break
      case '-':
        num1 = Math.floor(Math.random() * 20) + 10
        num2 = Math.floor(Math.random() * 10) + 1
        break
      case '*':
        num1 = Math.floor(Math.random() * 10) + 1
        num2 = Math.floor(Math.random() * 10) + 1
        break
      default:
        num1 = Math.floor(Math.random() * 20) + 1
        num2 = Math.floor(Math.random() * 20) + 1
    }

    setChallenge({ num1, num2, operator })
    setAnswer('')
    setError('')
    setIsVerified(false)
  }, [])

  useEffect(() => {
    generateChallenge()
  }, [generateChallenge])

  const calculateAnswer = () => {
    const { num1, num2, operator } = challenge
    switch (operator) {
      case '+':
        return num1 + num2
      case '-':
        return num1 - num2
      case '*':
        return num1 * num2
      default:
        return num1 + num2
    }
  }

  const handleVerify = () => {
    const correctAnswer = calculateAnswer()
    const userAnswer = parseInt(answer, 10)

    if (isNaN(userAnswer)) {
      setError('Please enter a number')
      return
    }

    if (userAnswer === correctAnswer) {
      setIsVerified(true)
      setError('')
      // Generate a simple token (in production, this would be server-side validated)
      const token = btoa(JSON.stringify({
        verified: true,
        timestamp: Date.now(),
        challenge: `${challenge.num1}${challenge.operator}${challenge.num2}`
      }))
      onVerify?.(token)
    } else {
      setError('Incorrect answer. Try again.')
      setAttempts(prev => prev + 1)
      if (attempts >= 2) {
        generateChallenge()
        setAttempts(0)
      }
      onError?.('Incorrect CAPTCHA answer')
    }
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleVerify()
    }
  }

  const getOperatorDisplay = (op) => {
    switch (op) {
      case '*':
        return '×'
      default:
        return op
    }
  }

  return (
    <div className="bg-dark-100 border border-dark-200 rounded-lg p-4">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm text-gray-400">Verify you're human</span>
        {!isVerified && (
          <button
            type="button"
            onClick={generateChallenge}
            className="p-1 hover:bg-dark-200 rounded transition-colors"
            title="New challenge"
          >
            <RefreshCw size={16} className="text-gray-400" />
          </button>
        )}
      </div>

      {isVerified ? (
        <div className="flex items-center gap-2 text-green-400">
          <div className="p-1 bg-green-500/20 rounded-full">
            <Check size={16} />
          </div>
          <span className="text-sm font-medium">Verified</span>
        </div>
      ) : (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="bg-dark-200 px-4 py-2 rounded-lg">
              <span className="text-lg font-mono text-white">
                {challenge.num1} {getOperatorDisplay(challenge.operator)} {challenge.num2} = ?
              </span>
            </div>
            <input
              type="text"
              value={answer}
              onChange={(e) => setAnswer(e.target.value.replace(/[^0-9-]/g, ''))}
              onKeyDown={handleKeyDown}
              placeholder="Answer"
              className="w-20 px-3 py-2 bg-dark-200 border border-dark-300 rounded-lg text-white text-center focus:outline-none focus:border-primary-500"
              autoComplete="off"
            />
            <button
              type="button"
              onClick={handleVerify}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg font-medium transition-colors"
            >
              Verify
            </button>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-400 text-sm">
              <X size={14} />
              <span>{error}</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export default SimpleCaptcha
