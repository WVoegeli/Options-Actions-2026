import { Bell, Settings, RefreshCw } from 'lucide-react'
import { useState, useEffect } from 'react'
import { marketApi } from '../../services/api'

interface MarketQuote {
  symbol: string
  price: number
  change: number
  changePercent: number
}

export default function Header() {
  const [currentTime, setCurrentTime] = useState(new Date())
  const [isMarketOpen, setIsMarketOpen] = useState(false)
  const [quotes, setQuotes] = useState<MarketQuote[]>([])
  const [loading, setLoading] = useState(true)

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date()
      setCurrentTime(now)

      // Check if market is open (9:30 AM - 4:00 PM ET, Mon-Fri)
      const day = now.getDay()
      const hours = now.getHours()
      const minutes = now.getMinutes()
      const timeNum = hours * 100 + minutes

      setIsMarketOpen(
        day >= 1 && day <= 5 && // Mon-Fri
        timeNum >= 930 && timeNum < 1600 // 9:30 AM - 4:00 PM
      )
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  // Fetch market quotes
  const fetchQuotes = async () => {
    try {
      setLoading(true)
      const response = await marketApi.getQuotes(['SPY', 'QQQ', 'VIX'])
      setQuotes(response.data.filter((q: any) => !q.error))
    } catch (error) {
      console.error('Failed to fetch quotes:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchQuotes()
    // Refresh every 30 seconds
    const interval = setInterval(fetchQuotes, 30000)
    return () => clearInterval(interval)
  }, [])

  return (
    <header className="h-14 bg-dark-card border-b border-dark-border flex items-center justify-between px-6">
      {/* Market Status */}
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isMarketOpen ? 'bg-profit animate-pulse' : 'bg-gray-500'
            }`}
          />
          <span className="text-sm text-gray-400">
            Market {isMarketOpen ? 'Open' : 'Closed'}
          </span>
        </div>
        <span className="text-sm text-gray-500">
          {currentTime.toLocaleTimeString('en-US', {
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
          })}
        </span>
      </div>

      {/* Quick Market Data */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-4 text-sm">
          {loading ? (
            <span className="text-gray-500">Loading market data...</span>
          ) : quotes.length > 0 ? (
            quotes.map((quote) => (
              <div key={quote.symbol}>
                <span className="text-gray-400">{quote.symbol} </span>
                <span className="text-white">${quote.price?.toFixed(2)}</span>
                <span
                  className={`ml-1 ${
                    (quote.changePercent || 0) >= 0 ? 'text-profit' : 'text-loss'
                  }`}
                >
                  {(quote.changePercent || 0) >= 0 ? '+' : ''}
                  {(quote.changePercent || 0).toFixed(2)}%
                </span>
              </div>
            ))
          ) : (
            <span className="text-gray-500">No market data</span>
          )}
        </div>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={fetchQuotes}
          className="p-2 text-gray-400 hover:text-white hover:bg-dark-border rounded-lg transition-colors"
          title="Refresh market data"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? 'animate-spin' : ''}`} />
        </button>
        <button className="p-2 text-gray-400 hover:text-white hover:bg-dark-border rounded-lg transition-colors">
          <Bell className="w-5 h-5" />
        </button>
        <button className="p-2 text-gray-400 hover:text-white hover:bg-dark-border rounded-lg transition-colors">
          <Settings className="w-5 h-5" />
        </button>
      </div>
    </header>
  )
}
