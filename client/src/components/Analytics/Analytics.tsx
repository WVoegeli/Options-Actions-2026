import { useState, useEffect } from 'react'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from 'recharts'
import { TrendingUp, TrendingDown, Target, Award, RefreshCw, Calendar } from 'lucide-react'
import { analyticsApi, positionsApi } from '../../services/api'

interface StrategyStats {
  strategy: string
  total_trades: number
  winning_trades: number
  win_rate: number
  avg_pnl: number
  total_pnl: number
}

interface OverallStats {
  total_trades: number
  winning_trades: number
  losing_trades: number
  win_rate: number
  total_pnl: number
  largest_win: number
  largest_loss: number
  avg_win: number
  avg_loss: number
  profit_factor: number
}

interface Position {
  id: number
  symbol: string
  underlying: string
  strategy_tag: string
  pnl: number
  closed_at: string
  status: string
}

const strategyLabels: Record<string, string> = {
  'wheel-csp': 'Wheel CSP',
  'wheel-cc': 'Wheel CC',
  'pmcc': 'PMCC',
  'bull-put-spread': 'Bull Put Spread',
  'bear-call-spread': 'Bear Call Spread',
  'iron-condor': 'Iron Condor',
  'long-call': 'Long Call',
  'long-put': 'Long Put',
  'other': 'Other',
}

export default function Analytics() {
  const [analytics, setAnalytics] = useState<{
    overall: OverallStats
    by_strategy: StrategyStats[]
  } | null>(null)
  const [closedPositions, setClosedPositions] = useState<Position[]>([])
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  const fetchData = async () => {
    try {
      const [analyticsRes, positionsRes] = await Promise.all([
        analyticsApi.get(1),
        positionsApi.getAll(1),
      ])

      setAnalytics(analyticsRes.data)

      // Filter to closed positions and sort by P&L
      const closed = positionsRes.data.filter((p: Position) => p.status !== 'open')
      setClosedPositions(closed)
    } catch (error) {
      console.error('Failed to fetch analytics:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading analytics...</div>
      </div>
    )
  }

  const overall = analytics?.overall || {
    total_trades: 0,
    winning_trades: 0,
    losing_trades: 0,
    win_rate: 0,
    total_pnl: 0,
    largest_win: 0,
    largest_loss: 0,
    avg_win: 0,
    avg_loss: 0,
    profit_factor: 0,
  }

  const strategyData = (analytics?.by_strategy || []).map(s => ({
    name: strategyLabels[s.strategy] || s.strategy?.replace(/-/g, ' ').toUpperCase() || 'Unknown',
    winRate: s.win_rate,
    avgReturn: s.avg_pnl,
    trades: s.total_trades,
    pnl: s.total_pnl,
  }))

  const winLossData = [
    { name: 'Wins', value: overall.winning_trades, color: '#10B981' },
    { name: 'Losses', value: overall.losing_trades, color: '#EF4444' },
  ].filter(d => d.value > 0)

  // Calculate monthly P&L from closed positions
  const monthlyPnl = closedPositions.reduce((acc: Record<string, number>, pos) => {
    if (pos.closed_at) {
      const month = new Date(pos.closed_at).toLocaleString('en-US', { month: 'short', year: '2-digit' })
      acc[month] = (acc[month] || 0) + (pos.pnl || 0)
    }
    return acc
  }, {})

  const monthlyPnlData = Object.entries(monthlyPnl)
    .map(([month, pnl]) => ({ month, pnl }))
    .slice(-6) // Last 6 months

  // Get best and worst trades
  const sortedByPnl = [...closedPositions].sort((a, b) => (b.pnl || 0) - (a.pnl || 0))
  const bestTrades = sortedByPnl.filter(p => (p.pnl || 0) > 0).slice(0, 3)
  const worstTrades = sortedByPnl.filter(p => (p.pnl || 0) < 0).slice(-3).reverse()

  const hasData = overall.total_trades > 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Analytics</h1>
          <p className="text-gray-400">Track your trading performance and improve</p>
        </div>
        <button
          onClick={handleRefresh}
          disabled={refreshing}
          className="btn-secondary flex items-center gap-2"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Top Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-500/20">
              <Target className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Total Trades</p>
              <p className="text-xl font-bold text-white">{overall.total_trades}</p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20">
              <Award className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Win Rate</p>
              <p className={`text-xl font-bold ${overall.win_rate >= 50 ? 'text-profit' : 'text-loss'}`}>
                {overall.win_rate.toFixed(0)}%
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${overall.total_pnl >= 0 ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
              {overall.total_pnl >= 0 ? (
                <TrendingUp className="w-5 h-5 text-green-400" />
              ) : (
                <TrendingDown className="w-5 h-5 text-red-400" />
              )}
            </div>
            <div>
              <p className="text-sm text-gray-400">Total P&L</p>
              <p className={`text-xl font-bold ${overall.total_pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                {overall.total_pnl >= 0 ? '+' : ''}${overall.total_pnl.toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-500/20">
              <Calendar className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-sm text-gray-400">Profit Factor</p>
              <p className="text-xl font-bold text-white">
                {overall.profit_factor > 0 ? overall.profit_factor.toFixed(2) : 'N/A'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="card bg-dark-bg">
          <p className="text-sm text-gray-400">Largest Win</p>
          <p className="text-lg font-bold text-profit">
            +${(overall.largest_win || 0).toFixed(2)}
          </p>
        </div>
        <div className="card bg-dark-bg">
          <p className="text-sm text-gray-400">Largest Loss</p>
          <p className="text-lg font-bold text-loss">
            ${(overall.largest_loss || 0).toFixed(2)}
          </p>
        </div>
        <div className="card bg-dark-bg">
          <p className="text-sm text-gray-400">Avg Win</p>
          <p className="text-lg font-bold text-profit">
            +${(overall.avg_win || 0).toFixed(2)}
          </p>
        </div>
        <div className="card bg-dark-bg">
          <p className="text-sm text-gray-400">Avg Loss</p>
          <p className="text-lg font-bold text-loss">
            ${(overall.avg_loss || 0).toFixed(2)}
          </p>
        </div>
      </div>

      {hasData ? (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Monthly P&L Chart */}
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4">Monthly P&L</h2>
              {monthlyPnlData.length > 0 ? (
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={monthlyPnlData}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                      <XAxis dataKey="month" stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 12 }} />
                      <YAxis stroke="#64748B" tick={{ fill: '#94A3B8', fontSize: 12 }} tickFormatter={(v) => `$${v}`} />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1E293B',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                        }}
                        formatter={(value: number) => [`$${value.toFixed(2)}`, 'P&L']}
                      />
                      <Bar
                        dataKey="pnl"
                        radius={[4, 4, 0, 0]}
                      >
                        {monthlyPnlData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.pnl >= 0 ? '#10B981' : '#EF4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No monthly data yet
                </div>
              )}
            </div>

            {/* Win/Loss Pie Chart */}
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4">Win/Loss Distribution</h2>
              {winLossData.length > 0 ? (
                <div className="h-64 relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={winLossData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {winLossData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: '#1E293B',
                          border: '1px solid #334155',
                          borderRadius: '8px',
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-2xl font-bold text-white">{overall.win_rate.toFixed(0)}%</span>
                    <span className="text-sm text-gray-400">Win Rate</span>
                  </div>
                </div>
              ) : (
                <div className="h-64 flex items-center justify-center text-gray-500">
                  No trades to display
                </div>
              )}
              <div className="flex justify-center gap-6 mt-4">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-500"></div>
                  <span className="text-sm text-gray-400">{overall.winning_trades} Wins</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500"></div>
                  <span className="text-sm text-gray-400">{overall.losing_trades} Losses</span>
                </div>
              </div>
            </div>
          </div>

          {/* Strategy Performance Table */}
          {strategyData.length > 0 && (
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4">Strategy Performance</h2>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="text-left text-sm text-gray-400 border-b border-dark-border">
                      <th className="pb-3 font-medium">Strategy</th>
                      <th className="pb-3 font-medium text-right">Trades</th>
                      <th className="pb-3 font-medium text-right">Win Rate</th>
                      <th className="pb-3 font-medium text-right">Avg P&L</th>
                      <th className="pb-3 font-medium text-right">Total P&L</th>
                    </tr>
                  </thead>
                  <tbody className="text-sm">
                    {strategyData.map((strategy) => (
                      <tr
                        key={strategy.name}
                        className="border-b border-dark-border/50"
                      >
                        <td className="py-3 font-medium text-white">{strategy.name}</td>
                        <td className="py-3 text-right text-gray-300">{strategy.trades}</td>
                        <td className="py-3 text-right">
                          <span className={strategy.winRate >= 50 ? 'text-profit' : 'text-loss'}>
                            {strategy.winRate?.toFixed(0) || 0}%
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <span className={(strategy.avgReturn || 0) >= 0 ? 'text-profit' : 'text-loss'}>
                            {(strategy.avgReturn || 0) >= 0 ? '+' : ''}${(strategy.avgReturn || 0).toFixed(2)}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <span className={(strategy.pnl || 0) >= 0 ? 'text-profit' : 'text-loss'}>
                            {(strategy.pnl || 0) >= 0 ? '+' : ''}${(strategy.pnl || 0).toFixed(2)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Best/Worst Trades */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4">Best Trades</h2>
              {bestTrades.length > 0 ? (
                <div className="space-y-3">
                  {bestTrades.map((trade) => (
                    <div key={trade.id} className="flex justify-between items-center p-3 bg-dark-bg rounded-lg">
                      <div>
                        <span className="font-medium text-white">{trade.symbol}</span>
                        <span className="ml-2 text-xs text-gray-500">
                          {trade.closed_at ? new Date(trade.closed_at).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <span className="text-profit font-medium">+${(trade.pnl || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">No winning trades yet</div>
              )}
            </div>

            <div className="card">
              <h2 className="text-lg font-semibold text-white mb-4">Worst Trades</h2>
              {worstTrades.length > 0 ? (
                <div className="space-y-3">
                  {worstTrades.map((trade) => (
                    <div key={trade.id} className="flex justify-between items-center p-3 bg-dark-bg rounded-lg">
                      <div>
                        <span className="font-medium text-white">{trade.symbol}</span>
                        <span className="ml-2 text-xs text-gray-500">
                          {trade.closed_at ? new Date(trade.closed_at).toLocaleDateString() : ''}
                        </span>
                      </div>
                      <span className="text-loss font-medium">${(trade.pnl || 0).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">No losing trades yet</div>
              )}
            </div>
          </div>
        </>
      ) : (
        <div className="card text-center py-12">
          <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Trade Data Yet</h3>
          <p className="text-gray-400">
            Close some positions to see your trading analytics and performance metrics.
          </p>
        </div>
      )}
    </div>
  )
}
