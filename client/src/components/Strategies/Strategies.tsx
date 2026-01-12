import { Target, TrendingUp, Shield, Zap } from 'lucide-react'

const strategies = [
  {
    id: 'wheel',
    name: 'The Wheel',
    description: 'Sell cash-secured puts, get assigned, sell covered calls. Repeat.',
    targetReturn: '2-4% monthly',
    riskLevel: 'Medium',
    icon: Target,
    color: 'blue',
    stats: {
      winRate: 78,
      avgReturn: 3.2,
      totalTrades: 12,
    },
  },
  {
    id: 'pmcc',
    name: 'Poor Man\'s Covered Call',
    description: 'Buy LEAPS, sell short-term calls against them for leveraged returns.',
    targetReturn: '50-100% annually',
    riskLevel: 'Medium-High',
    icon: TrendingUp,
    color: 'green',
    stats: {
      winRate: null,
      avgReturn: 7.0,
      totalTrades: 1,
    },
  },
  {
    id: 'spreads',
    name: 'Credit Spreads',
    description: 'Bull put or bear call spreads for defined-risk income.',
    targetReturn: '15-30% per trade',
    riskLevel: 'Low-Medium',
    icon: Shield,
    color: 'purple',
    stats: {
      winRate: 65,
      avgReturn: 18.5,
      totalTrades: 8,
    },
  },
  {
    id: 'earnings',
    name: 'Earnings Plays',
    description: 'Sell premium before earnings to capture IV crush.',
    targetReturn: '20-50% per trade',
    riskLevel: 'High',
    icon: Zap,
    color: 'orange',
    stats: {
      winRate: 55,
      avgReturn: 25.0,
      totalTrades: 3,
    },
  },
]

const colorClasses: Record<string, { bg: string; text: string; border: string }> = {
  blue: { bg: 'bg-blue-500/20', text: 'text-blue-400', border: 'border-blue-500/30' },
  green: { bg: 'bg-green-500/20', text: 'text-green-400', border: 'border-green-500/30' },
  purple: { bg: 'bg-purple-500/20', text: 'text-purple-400', border: 'border-purple-500/30' },
  orange: { bg: 'bg-orange-500/20', text: 'text-orange-400', border: 'border-orange-500/30' },
}

export default function Strategies() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Strategy Lab</h1>
        <p className="text-gray-400">Learn, practice, and track your options strategies</p>
      </div>

      {/* Strategy Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {strategies.map((strategy) => {
          const colors = colorClasses[strategy.color]
          return (
            <div
              key={strategy.id}
              className={`card border ${colors.border} hover:border-opacity-60 transition-colors cursor-pointer`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${colors.bg}`}>
                  <strategy.icon className={`w-6 h-6 ${colors.text}`} />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-white">{strategy.name}</h3>
                  <p className="text-sm text-gray-400 mt-1">{strategy.description}</p>

                  <div className="flex gap-4 mt-3 text-sm">
                    <div>
                      <span className="text-gray-500">Target: </span>
                      <span className="text-profit">{strategy.targetReturn}</span>
                    </div>
                    <div>
                      <span className="text-gray-500">Risk: </span>
                      <span className="text-white">{strategy.riskLevel}</span>
                    </div>
                  </div>

                  <div className="flex gap-4 mt-4 pt-4 border-t border-dark-border">
                    <div>
                      <p className="text-xs text-gray-500">Win Rate</p>
                      <p className={`font-medium ${strategy.stats.winRate ? 'text-profit' : 'text-gray-400'}`}>
                        {strategy.stats.winRate ? `${strategy.stats.winRate}%` : 'N/A'}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Avg Return</p>
                      <p className="font-medium text-profit">+{strategy.stats.avgReturn}%</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500">Trades</p>
                      <p className="font-medium text-white">{strategy.stats.totalTrades}</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Strategy Calculator */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4">Strategy Calculator</h2>
        <p className="text-gray-400">
          Coming in Phase 4: Interactive P&L calculators, what-if scenarios, and backtesting.
        </p>
      </div>
    </div>
  )
}
