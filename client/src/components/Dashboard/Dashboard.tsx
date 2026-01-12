import { useState, useEffect, useCallback } from 'react'
import { TrendingUp, TrendingDown, DollarSign, Activity, Target, RefreshCw, Plus } from 'lucide-react'
import PortfolioChart from './PortfolioChart'
import GreeksCard from './GreeksCard'
import RecentTrades from './RecentTrades'
import TopPositions from './TopPositions'
import NewPositionModal from '../common/NewPositionModal'
import { accountApi, positionsApi, analyticsApi } from '../../services/api'

interface AccountData {
  id: number
  name: string
  type: string
  starting_balance: number
  current_balance: number
  positions_count: number
  positions_value: number
  unrealized_pnl: number
  total_value: number
}

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
  pnl: number
  opened_at: string
}

export default function Dashboard() {
  const [account, setAccount] = useState<AccountData | null>(null)
  const [positions, setPositions] = useState<Position[]>([])
  const [analytics, setAnalytics] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [isModalOpen, setIsModalOpen] = useState(false)

  const fetchData = useCallback(async () => {
    try {
      const [accountRes, positionsRes, analyticsRes] = await Promise.all([
        accountApi.getById(1),
        positionsApi.getOpen(1),
        analyticsApi.get(1),
      ])

      setAccount(accountRes.data)
      setPositions(positionsRes.data)
      setAnalytics(analyticsRes.data)
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, [])

  useEffect(() => {
    fetchData()
    // Refresh every 60 seconds
    const interval = setInterval(fetchData, 60000)
    return () => clearInterval(interval)
  }, [fetchData])

  const handleRefresh = () => {
    setRefreshing(true)
    fetchData()
  }

  const handlePositionCreated = () => {
    fetchData()
  }

  // Calculate Greeks from positions
  const calculateGreeks = () => {
    let totalDelta = 0
    let totalTheta = 0
    let totalGamma = 0
    let totalVega = 0

    positions.forEach((pos) => {
      // Simplified Greek calculations based on position type
      // In reality, these would come from the API with real Greeks
      const multiplier = pos.quantity < 0 ? -1 : 1

      // Estimate delta based on position type and direction
      if (pos.option_type === 'put') {
        totalDelta += multiplier * -0.25 * Math.abs(pos.quantity)
      } else {
        totalDelta += multiplier * 0.35 * Math.abs(pos.quantity)
      }

      // Theta (selling = positive, buying = negative)
      totalTheta += pos.quantity < 0 ? 5 * Math.abs(pos.quantity) : -3 * Math.abs(pos.quantity)

      // Gamma
      totalGamma += 0.02 * Math.abs(pos.quantity)

      // Vega (selling = negative, buying = positive)
      totalVega += pos.quantity < 0 ? -0.10 * Math.abs(pos.quantity) : 0.10 * Math.abs(pos.quantity)
    })

    return { totalDelta, totalTheta, totalGamma, totalVega }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading dashboard...</div>
      </div>
    )
  }

  const startingBalance = account?.starting_balance || 10000
  const totalValue = account?.total_value || account?.current_balance || 10000
  const totalPnl = totalValue - startingBalance
  const totalPnlPercent = (totalPnl / startingBalance) * 100

  // Day P&L (simplified - would need historical data)
  const dayPnl = account?.unrealized_pnl || 0
  const dayPnlPercent = (dayPnl / startingBalance) * 100

  const greeks = calculateGreeks()

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Dashboard</h1>
          <p className="text-gray-400">
            {account?.name || 'Paper Trading'} Account • ${startingBalance.toLocaleString()} Starting Capital
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={handleRefresh}
            disabled={refreshing}
            className="btn-secondary flex items-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            New Position
          </button>
        </div>
      </div>

      {/* Top Stats Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Portfolio Value */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Portfolio Value</p>
              <p className="text-2xl font-bold text-white">
                ${totalValue.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className={`text-sm ${totalPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)} ({totalPnlPercent.toFixed(2)}%)
              </p>
            </div>
            <div className={`p-3 rounded-lg ${totalPnl >= 0 ? 'bg-profit' : 'bg-loss'}`}>
              {totalPnl >= 0 ? (
                <TrendingUp className="w-6 h-6 text-emerald-400" />
              ) : (
                <TrendingDown className="w-6 h-6 text-red-400" />
              )}
            </div>
          </div>
        </div>

        {/* Unrealized P&L */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Unrealized P&L</p>
              <p className="text-2xl font-bold text-white">
                {dayPnl >= 0 ? '+' : ''}${dayPnl.toFixed(2)}
              </p>
              <p className={`text-sm ${dayPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                {dayPnl >= 0 ? '+' : ''}{dayPnlPercent.toFixed(2)}% of capital
              </p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/20">
              <DollarSign className="w-6 h-6 text-blue-400" />
            </div>
          </div>
        </div>

        {/* Cash Available */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Cash Available</p>
              <p className="text-2xl font-bold text-white">
                ${(account?.current_balance || 10000).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </p>
              <p className="text-sm text-gray-400">
                {((account?.current_balance || 10000) / totalValue * 100).toFixed(1)}% of portfolio
              </p>
            </div>
            <div className="p-3 rounded-lg bg-purple-500/20">
              <Activity className="w-6 h-6 text-purple-400" />
            </div>
          </div>
        </div>

        {/* Open Positions */}
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-400">Open Positions</p>
              <p className="text-2xl font-bold text-white">{positions.length}</p>
              <p className="text-sm text-gray-400">
                {new Set(positions.map(p => p.strategy_tag)).size} strategies active
              </p>
            </div>
            <div className="p-3 rounded-lg bg-orange-500/20">
              <Target className="w-6 h-6 text-orange-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Greeks Summary Row */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <GreeksCard
          label="Portfolio Delta"
          value={greeks.totalDelta}
          description="Net directional exposure"
          target="-30 to +30"
          isGood={Math.abs(greeks.totalDelta) <= 30}
        />
        <GreeksCard
          label="Daily Theta"
          value={greeks.totalTheta}
          prefix="+$"
          description="Time decay income/day"
          target="+$10 to +$30"
          isGood={greeks.totalTheta >= 0}
        />
        <GreeksCard
          label="Portfolio Gamma"
          value={greeks.totalGamma}
          description="Delta sensitivity"
          target="< 2.0"
          isGood={greeks.totalGamma < 2.0}
        />
        <GreeksCard
          label="Portfolio Vega"
          value={greeks.totalVega}
          description="IV sensitivity"
          target="Negative = IV crush helps"
          isGood={greeks.totalVega < 0}
        />
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Portfolio Chart */}
        <div className="lg:col-span-2">
          <div className="card">
            <h2 className="text-lg font-semibold text-white mb-4">Portfolio Performance</h2>
            <PortfolioChart startingValue={startingBalance} currentValue={totalValue} />
          </div>
        </div>

        {/* Recent Trades */}
        <div>
          <RecentTrades positions={positions} />
        </div>
      </div>

      {/* Top Positions */}
      <TopPositions positions={positions} onRefresh={fetchData} />

      {/* Strategy Performance Summary */}
      {analytics && analytics.by_strategy && analytics.by_strategy.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-white mb-4">Strategy Performance</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {analytics.by_strategy.slice(0, 3).map((strategy: any) => (
              <div key={strategy.strategy} className="bg-dark-bg rounded-lg p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                  <span className="text-white font-medium">
                    {strategy.strategy?.replace(/-/g, ' ').toUpperCase() || 'Unknown'}
                  </span>
                </div>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-400">Win Rate</span>
                    <span className={strategy.win_rate >= 50 ? 'text-profit' : 'text-loss'}>
                      {strategy.win_rate?.toFixed(0) || 0}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Trades</span>
                    <span className="text-white">{strategy.total_trades || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Total P&L</span>
                    <span className={strategy.total_pnl >= 0 ? 'text-profit' : 'text-loss'}>
                      {strategy.total_pnl >= 0 ? '+' : ''}${strategy.total_pnl?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {positions.length === 0 && (
        <div className="card text-center py-12">
          <Target className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-white mb-2">No Open Positions</h3>
          <p className="text-gray-400 mb-4">
            Start trading by opening your first position. Your $10,000 paper trading account is ready.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="btn-primary inline-flex items-center gap-2"
          >
            <Plus className="w-4 h-4" />
            Open Your First Position
          </button>
        </div>
      )}

      {/* New Position Modal */}
      <NewPositionModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handlePositionCreated}
      />
    </div>
  )
}
