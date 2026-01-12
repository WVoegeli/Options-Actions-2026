import { useState, useEffect } from 'react'
import { X, Search, TrendingUp, TrendingDown } from 'lucide-react'
import { marketApi, positionsApi } from '../../services/api'

interface NewPositionModalProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const strategies = [
  { value: 'wheel-csp', label: 'Wheel - Cash Secured Put' },
  { value: 'wheel-cc', label: 'Wheel - Covered Call' },
  { value: 'pmcc', label: 'Poor Man\'s Covered Call' },
  { value: 'bull-put-spread', label: 'Bull Put Spread' },
  { value: 'bear-call-spread', label: 'Bear Call Spread' },
  { value: 'iron-condor', label: 'Iron Condor' },
  { value: 'long-call', label: 'Long Call' },
  { value: 'long-put', label: 'Long Put' },
  { value: 'other', label: 'Other' },
]

export default function NewPositionModal({ isOpen, onClose, onSuccess }: NewPositionModalProps) {
  const [step, setStep] = useState(1)
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [selectedStock, setSelectedStock] = useState<any>(null)
  const [stockQuote, setStockQuote] = useState<any>(null)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [optionType, setOptionType] = useState<'call' | 'put'>('put')
  const [action, setAction] = useState<'buy' | 'sell'>('sell')
  const [strike, setStrike] = useState('')
  const [expiration, setExpiration] = useState('')
  const [quantity, setQuantity] = useState('1')
  const [premium, setPremium] = useState('')
  const [strategy, setStrategy] = useState('wheel-csp')
  const [thesis, setThesis] = useState('')

  // Search for stocks
  useEffect(() => {
    if (searchQuery.length < 1) {
      setSearchResults([])
      return
    }

    const searchStocks = async () => {
      try {
        const response = await marketApi.search(searchQuery)
        setSearchResults(response.data.slice(0, 5))
      } catch (err) {
        console.error('Search error:', err)
      }
    }

    const debounce = setTimeout(searchStocks, 300)
    return () => clearTimeout(debounce)
  }, [searchQuery])

  // Fetch quote when stock selected
  useEffect(() => {
    if (!selectedStock) return

    const fetchQuote = async () => {
      try {
        setLoading(true)
        const response = await marketApi.getQuote(selectedStock.symbol)
        setStockQuote(response.data)
      } catch (err) {
        console.error('Quote error:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchQuote()
  }, [selectedStock])

  const handleSelectStock = (stock: any) => {
    setSelectedStock(stock)
    setSearchQuery(stock.symbol)
    setSearchResults([])
    setStep(2)
  }

  const handleSubmit = async () => {
    if (!selectedStock || !strike || !expiration || !premium) {
      setError('Please fill in all required fields')
      return
    }

    setSubmitting(true)
    setError('')

    try {
      // Build the option symbol (simplified format)
      const optionSymbol = `${selectedStock.symbol} $${strike}${optionType === 'call' ? 'C' : 'P'}`

      // Quantity is negative for selling, positive for buying
      const qty = action === 'sell' ? -parseInt(quantity) : parseInt(quantity)

      await positionsApi.create({
        symbol: optionSymbol,
        underlying: selectedStock.symbol,
        option_type: optionType,
        strike: parseFloat(strike),
        expiration: expiration,
        quantity: qty,
        price: parseFloat(premium),
        strategy_tag: strategy,
        notes: thesis || undefined,
      })

      onSuccess()
      handleClose()
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to create position')
    } finally {
      setSubmitting(false)
    }
  }

  const handleClose = () => {
    setStep(1)
    setSearchQuery('')
    setSelectedStock(null)
    setStockQuote(null)
    setStrike('')
    setExpiration('')
    setQuantity('1')
    setPremium('')
    setStrategy('wheel-csp')
    setThesis('')
    setError('')
    onClose()
  }

  // Generate expiration dates (next 8 Fridays)
  const getExpirationDates = () => {
    const dates = []
    const today = new Date()
    let current = new Date(today)

    // Find next Friday
    current.setDate(current.getDate() + ((5 - current.getDay() + 7) % 7 || 7))

    for (let i = 0; i < 8; i++) {
      dates.push(new Date(current))
      current.setDate(current.getDate() + 7)
    }

    return dates
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-dark-card rounded-xl border border-dark-border w-full max-w-xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-dark-border">
          <h2 className="text-lg font-semibold text-white">
            {step === 1 ? 'New Position - Select Stock' : 'New Position - Enter Details'}
          </h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step 1: Stock Search */}
        {step === 1 && (
          <div className="p-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search for a stock (e.g., AAPL, MSFT, NVDA)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value.toUpperCase())}
                className="input-field w-full pl-10"
                autoFocus
              />
            </div>

            {searchResults.length > 0 && (
              <div className="mt-2 border border-dark-border rounded-lg overflow-hidden">
                {searchResults.map((result) => (
                  <button
                    key={result.symbol}
                    onClick={() => handleSelectStock(result)}
                    className="w-full flex items-center justify-between p-3 hover:bg-dark-border transition-colors text-left"
                  >
                    <div>
                      <span className="font-medium text-white">{result.symbol}</span>
                      <span className="ml-2 text-sm text-gray-400">{result.name}</span>
                    </div>
                    <span className="text-xs text-gray-500">{result.exchange}</span>
                  </button>
                ))}
              </div>
            )}

            {/* Quick picks */}
            <div className="mt-4">
              <p className="text-sm text-gray-400 mb-2">Quick picks:</p>
              <div className="flex flex-wrap gap-2">
                {['AAPL', 'MSFT', 'NVDA', 'AMD', 'TSLA', 'SPY', 'QQQ', 'PLTR', 'SOFI'].map((symbol) => (
                  <button
                    key={symbol}
                    onClick={() => handleSelectStock({ symbol, name: symbol })}
                    className="px-3 py-1 bg-dark-bg rounded-lg text-sm text-gray-300 hover:bg-dark-border transition-colors"
                  >
                    {symbol}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Step 2: Position Details */}
        {step === 2 && selectedStock && (
          <div className="p-4 space-y-4">
            {/* Stock Info */}
            <div className="p-4 bg-dark-bg rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-white">{selectedStock.symbol}</h3>
                  <p className="text-sm text-gray-400">{selectedStock.name}</p>
                </div>
                {stockQuote && (
                  <div className="text-right">
                    <p className="text-xl font-bold text-white">${stockQuote.price?.toFixed(2)}</p>
                    <p className={stockQuote.changePercent >= 0 ? 'text-profit' : 'text-loss'}>
                      {stockQuote.changePercent >= 0 ? '+' : ''}{stockQuote.changePercent?.toFixed(2)}%
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Option Type */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Option Type</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setOptionType('put')}
                  className={`p-3 rounded-lg border flex items-center justify-center gap-2 transition-colors ${
                    optionType === 'put'
                      ? 'border-primary bg-primary/20 text-white'
                      : 'border-dark-border text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <TrendingDown className="w-4 h-4" />
                  PUT
                </button>
                <button
                  onClick={() => setOptionType('call')}
                  className={`p-3 rounded-lg border flex items-center justify-center gap-2 transition-colors ${
                    optionType === 'call'
                      ? 'border-primary bg-primary/20 text-white'
                      : 'border-dark-border text-gray-400 hover:border-gray-500'
                  }`}
                >
                  <TrendingUp className="w-4 h-4" />
                  CALL
                </button>
              </div>
            </div>

            {/* Buy/Sell */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Action</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setAction('sell')}
                  className={`p-3 rounded-lg border transition-colors ${
                    action === 'sell'
                      ? 'border-profit bg-profit/20 text-profit'
                      : 'border-dark-border text-gray-400 hover:border-gray-500'
                  }`}
                >
                  SELL (Collect Premium)
                </button>
                <button
                  onClick={() => setAction('buy')}
                  className={`p-3 rounded-lg border transition-colors ${
                    action === 'buy'
                      ? 'border-loss bg-loss/20 text-loss'
                      : 'border-dark-border text-gray-400 hover:border-gray-500'
                  }`}
                >
                  BUY (Pay Premium)
                </button>
              </div>
            </div>

            {/* Strike & Expiration */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Strike Price</label>
                <input
                  type="number"
                  value={strike}
                  onChange={(e) => setStrike(e.target.value)}
                  placeholder={stockQuote ? `Near $${Math.round(stockQuote.price)}` : 'Strike'}
                  className="input-field w-full"
                  step="0.5"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Expiration</label>
                <select
                  value={expiration}
                  onChange={(e) => setExpiration(e.target.value)}
                  className="input-field w-full"
                >
                  <option value="">Select date</option>
                  {getExpirationDates().map((date) => (
                    <option key={date.toISOString()} value={date.toISOString().split('T')[0]}>
                      {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })} (
                      {Math.ceil((date.getTime() - Date.now()) / (1000 * 60 * 60 * 24))} DTE)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Quantity & Premium */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Contracts</label>
                <input
                  type="number"
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  min="1"
                  className="input-field w-full"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">Premium (per share)</label>
                <input
                  type="number"
                  value={premium}
                  onChange={(e) => setPremium(e.target.value)}
                  placeholder="0.00"
                  step="0.01"
                  className="input-field w-full"
                />
              </div>
            </div>

            {/* Strategy */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Strategy</label>
              <select
                value={strategy}
                onChange={(e) => setStrategy(e.target.value)}
                className="input-field w-full"
              >
                {strategies.map((s) => (
                  <option key={s.value} value={s.value}>
                    {s.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Thesis */}
            <div>
              <label className="block text-sm text-gray-400 mb-2">Trade Thesis (optional)</label>
              <textarea
                value={thesis}
                onChange={(e) => setThesis(e.target.value)}
                placeholder="Why are you entering this trade?"
                rows={2}
                className="input-field w-full resize-none"
              />
            </div>

            {/* Summary */}
            {strike && premium && quantity && (
              <div className="p-4 bg-dark-bg rounded-lg">
                <h4 className="text-sm font-medium text-gray-400 mb-2">Trade Summary</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Position:</span>
                    <span className="text-white">
                      {action === 'sell' ? 'Short' : 'Long'} {quantity} {selectedStock.symbol} ${strike}
                      {optionType === 'call' ? 'C' : 'P'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">
                      {action === 'sell' ? 'Credit Received:' : 'Debit Paid:'}
                    </span>
                    <span className={action === 'sell' ? 'text-profit' : 'text-loss'}>
                      ${(parseFloat(premium) * parseInt(quantity) * 100).toFixed(2)}
                    </span>
                  </div>
                  {action === 'sell' && optionType === 'put' && (
                    <div className="flex justify-between">
                      <span className="text-gray-400">Capital Required:</span>
                      <span className="text-white">
                        ${(parseFloat(strike) * parseInt(quantity) * 100).toLocaleString()}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {error && (
              <div className="p-3 bg-loss/20 border border-loss rounded-lg text-loss text-sm">
                {error}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-dark-border">
          {step === 2 && (
            <button
              onClick={() => setStep(1)}
              className="btn-secondary"
            >
              Back
            </button>
          )}
          {step === 1 && <div />}
          <div className="flex gap-2">
            <button onClick={handleClose} className="btn-secondary">
              Cancel
            </button>
            {step === 2 && (
              <button
                onClick={handleSubmit}
                disabled={submitting || !strike || !expiration || !premium}
                className="btn-primary disabled:opacity-50"
              >
                {submitting ? 'Creating...' : 'Open Position'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
