import { ArrowUpRight, ArrowDownRight } from 'lucide-react'

interface Position {
  id: number
  symbol: string
  underlying: string
  option_type: string
  strike: number
  expiration: string
  quantity: number
  avg_cost: number
  current_price: number
  strategy_tag: string
  status: string
  opened_at: string
  pnl: number
}

interface RecentTradesProps {
  positions: Position[]
}

const strategyColors: Record<string, string> = {
  'wheel-csp': 'bg-blue-500/20 text-blue-400',
  'wheel-cc': 'bg-blue-500/20 text-blue-400',
  'pmcc': 'bg-green-500/20 text-green-400',
  'bull-put-spread': 'bg-purple-500/20 text-purple-400',
  'bear-call-spread': 'bg-purple-500/20 text-purple-400',
  'iron-condor': 'bg-orange-500/20 text-orange-400',
  'long-call': 'bg-emerald-500/20 text-emerald-400',
  'long-put': 'bg-red-500/20 text-red-400',
}

export default function RecentTrades({ positions }: RecentTradesProps) {
  // Format relative time
  const getRelativeTime = (dateString: string) => {
    if (!dateString) return 'Unknown'
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    if (diffMins < 60) return `${diffMins}m ago`
    if (diffHours < 24) return `${diffHours}h ago`
    if (diffDays < 7) return `${diffDays}d ago`
    return date.toLocaleDateString()
  }

  // Calculate P&L for a position
  const calculatePnl = (position: Position) => {
    const costBasis = position.avg_cost * Math.abs(position.quantity) * 100
    const currentValue = (position.current_price || position.avg_cost) * Math.abs(position.quantity) * 100

    if (position.quantity < 0) {
      return costBasis - currentValue
    }
    return currentValue - costBasis
  }

  return (
    <div className="card h-full">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-white">Recent Activity</h2>
        <a href="/journal" className="text-sm text-primary hover:underline">
          View Journal
        </a>
      </div>

      {positions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No positions yet</p>
          <p className="text-gray-600 text-sm mt-1">Open your first trade to get started</p>
        </div>
      ) : (
        <div className="space-y-3">
          {positions.slice(0, 5).map((position) => {
            const pnl = calculatePnl(position)
            const action = position.quantity < 0 ? 'Sold to Open' : 'Bought to Open'

            return (
              <div
                key={position.id}
                className="flex items-center justify-between p-3 bg-dark-bg rounded-lg"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-white">{position.symbol}</span>
                    <span
                      className={`text-xs px-2 py-0.5 rounded ${
                        strategyColors[position.strategy_tag] || 'bg-gray-500/20 text-gray-400'
                      }`}
                    >
                      {position.strategy_tag?.replace(/-/g, ' ').toUpperCase() || 'OTHER'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-sm text-gray-400">{action}</span>
                    <span className="text-xs text-gray-500">
                      {getRelativeTime(position.opened_at)}
                    </span>
                  </div>
                </div>

                <div className="text-right">
                  <div className="flex items-center gap-1">
                    {pnl >= 0 ? (
                      <ArrowUpRight className="w-4 h-4 text-profit" />
                    ) : (
                      <ArrowDownRight className="w-4 h-4 text-loss" />
                    )}
                    <span
                      className={`font-medium ${
                        pnl >= 0 ? 'text-profit' : 'text-loss'
                      }`}
                    >
                      {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-500">
                    Entry: ${position.avg_cost.toFixed(2)}
                  </span>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
