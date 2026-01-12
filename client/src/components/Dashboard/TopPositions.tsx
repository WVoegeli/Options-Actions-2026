import { useState } from 'react'
import { Clock, X, MoreVertical } from 'lucide-react'
import { positionsApi } from '../../services/api'

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
}

interface TopPositionsProps {
  positions: Position[]
  onRefresh: () => void
}

const strategyColors: Record<string, string> = {
  'wheel-csp': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'wheel-cc': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'pmcc': 'bg-green-500/20 text-green-400 border-green-500/30',
  'bull-put-spread': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'bear-call-spread': 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  'iron-condor': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'long-call': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'long-put': 'bg-red-500/20 text-red-400 border-red-500/30',
}

export default function TopPositions({ positions, onRefresh }: TopPositionsProps) {
  const [closingId, setClosingId] = useState<number | null>(null)
  const [closePrice, setClosePrice] = useState('')
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)

  const getDTE = (expiration: string) => {
    if (!expiration) return null
    const exp = new Date(expiration)
    const today = new Date()
    const diff = Math.ceil((exp.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const handleClosePosition = async () => {
    if (!selectedPosition || !closePrice) return

    setClosingId(selectedPosition.id)
    try {
      await positionsApi.close(selectedPosition.id, parseFloat(closePrice))
      setShowCloseModal(false)
      setSelectedPosition(null)
      setClosePrice('')
      onRefresh()
    } catch (error) {
      console.error('Failed to close position:', error)
    } finally {
      setClosingId(null)
    }
  }

  const openCloseModal = (position: Position) => {
    setSelectedPosition(position)
    setClosePrice(position.current_price?.toString() || position.avg_cost?.toString() || '')
    setShowCloseModal(true)
  }

  // Calculate P&L for a position
  const calculatePnl = (position: Position) => {
    const costBasis = position.avg_cost * Math.abs(position.quantity) * 100
    const currentValue = (position.current_price || position.avg_cost) * Math.abs(position.quantity) * 100

    // For short positions (selling), profit when price goes down
    if (position.quantity < 0) {
      return costBasis - currentValue
    }
    // For long positions (buying), profit when price goes up
    return currentValue - costBasis
  }

  if (positions.length === 0) {
    return null
  }

  // Calculate totals
  const totalPnl = positions.reduce((sum, p) => sum + calculatePnl(p), 0)
  const totalDelta = positions.reduce((sum, p) => {
    const multiplier = p.quantity < 0 ? -1 : 1
    const delta = p.option_type === 'put' ? -0.25 : 0.35
    return sum + (multiplier * delta * Math.abs(p.quantity))
  }, 0)
  const totalTheta = positions.reduce((sum, p) => {
    return sum + (p.quantity < 0 ? 5 : -3) * Math.abs(p.quantity)
  }, 0)

  return (
    <>
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white">Open Positions</h2>
          <span className="text-sm text-gray-400">{positions.length} positions</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left text-sm text-gray-400 border-b border-dark-border">
                <th className="pb-3 font-medium">Position</th>
                <th className="pb-3 font-medium">Underlying</th>
                <th className="pb-3 font-medium text-right">Entry</th>
                <th className="pb-3 font-medium text-right">Current</th>
                <th className="pb-3 font-medium text-right">P&L</th>
                <th className="pb-3 font-medium text-right">Delta</th>
                <th className="pb-3 font-medium text-right">Theta</th>
                <th className="pb-3 font-medium text-center">DTE</th>
                <th className="pb-3 font-medium">Strategy</th>
                <th className="pb-3 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {positions.map((position) => {
                const pnl = calculatePnl(position)
                const pnlPercent = (pnl / (position.avg_cost * Math.abs(position.quantity) * 100)) * 100
                const dte = getDTE(position.expiration)
                const delta = position.quantity < 0 ?
                  (position.option_type === 'put' ? 0.25 : -0.35) :
                  (position.option_type === 'put' ? -0.25 : 0.35)
                const theta = position.quantity < 0 ? 5 : -3

                return (
                  <tr
                    key={position.id}
                    className="border-b border-dark-border/50 hover:bg-dark-border/30 transition-colors"
                  >
                    <td className="py-3">
                      <span className="font-medium text-white">{position.symbol}</span>
                      <span className="ml-2 text-gray-500">
                        ×{Math.abs(position.quantity)}
                        {position.quantity < 0 ? ' (Short)' : ' (Long)'}
                      </span>
                    </td>
                    <td className="py-3">
                      <span className="text-gray-300">{position.underlying}</span>
                    </td>
                    <td className="py-3 text-right text-gray-300">
                      ${position.avg_cost?.toFixed(2) || '0.00'}
                    </td>
                    <td className="py-3 text-right text-gray-300">
                      ${(position.current_price || position.avg_cost)?.toFixed(2) || '0.00'}
                    </td>
                    <td className="py-3 text-right">
                      <span className={pnl >= 0 ? 'text-profit' : 'text-loss'}>
                        {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                      </span>
                      <span className="ml-1 text-gray-500">
                        ({pnlPercent >= 0 ? '+' : ''}{pnlPercent.toFixed(1)}%)
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span className={delta > 0 ? 'text-profit' : delta < 0 ? 'text-loss' : 'text-gray-400'}>
                        {delta > 0 ? '+' : ''}{delta.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <span className={theta > 0 ? 'text-profit' : 'text-loss'}>
                        {theta > 0 ? '+' : ''}${theta.toFixed(2)}
                      </span>
                    </td>
                    <td className="py-3 text-center">
                      {dte !== null ? (
                        <div className="flex items-center justify-center gap-1">
                          <Clock className="w-3 h-3 text-gray-500" />
                          <span
                            className={`${
                              dte <= 7
                                ? 'text-loss'
                                : dte <= 21
                                ? 'text-yellow-400'
                                : 'text-gray-300'
                            }`}
                          >
                            {dte}d
                          </span>
                        </div>
                      ) : (
                        <span className="text-gray-500">-</span>
                      )}
                    </td>
                    <td className="py-3">
                      <span
                        className={`text-xs px-2 py-1 rounded border ${
                          strategyColors[position.strategy_tag] || 'bg-gray-500/20 text-gray-400'
                        }`}
                      >
                        {position.strategy_tag?.replace(/-/g, ' ').toUpperCase() || 'OTHER'}
                      </span>
                    </td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => openCloseModal(position)}
                        className="text-gray-400 hover:text-white p-1 rounded hover:bg-dark-border transition-colors"
                        title="Close position"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Summary Row */}
        <div className="mt-4 pt-4 border-t border-dark-border flex justify-between items-center">
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-gray-400">Net Delta: </span>
              <span className="text-white font-medium">{totalDelta > 0 ? '+' : ''}{totalDelta.toFixed(2)}</span>
            </div>
            <div>
              <span className="text-gray-400">Daily Theta: </span>
              <span className={`font-medium ${totalTheta >= 0 ? 'text-profit' : 'text-loss'}`}>
                {totalTheta >= 0 ? '+' : ''}${totalTheta.toFixed(2)}
              </span>
            </div>
            <div>
              <span className="text-gray-400">Total P&L: </span>
              <span className={`font-medium ${totalPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                {totalPnl >= 0 ? '+' : ''}${totalPnl.toFixed(2)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Close Position Modal */}
      {showCloseModal && selectedPosition && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-card rounded-xl border border-dark-border w-full max-w-md p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Close Position</h3>
            <p className="text-gray-400 mb-4">
              Closing: <span className="text-white">{selectedPosition.symbol}</span>
            </p>

            <div className="mb-4">
              <label className="block text-sm text-gray-400 mb-2">Close Price (per share)</label>
              <input
                type="number"
                value={closePrice}
                onChange={(e) => setClosePrice(e.target.value)}
                className="input-field w-full"
                step="0.01"
              />
            </div>

            {closePrice && (
              <div className="mb-4 p-3 bg-dark-bg rounded-lg">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">
                    {selectedPosition.quantity < 0 ? 'Buy to Close:' : 'Sell to Close:'}
                  </span>
                  <span className="text-white">
                    ${(parseFloat(closePrice) * Math.abs(selectedPosition.quantity) * 100).toFixed(2)}
                  </span>
                </div>
                <div className="flex justify-between text-sm mt-1">
                  <span className="text-gray-400">Estimated P&L:</span>
                  <span className={
                    (selectedPosition.quantity < 0
                      ? (selectedPosition.avg_cost - parseFloat(closePrice))
                      : (parseFloat(closePrice) - selectedPosition.avg_cost)
                    ) * Math.abs(selectedPosition.quantity) * 100 >= 0
                      ? 'text-profit' : 'text-loss'
                  }>
                    ${((selectedPosition.quantity < 0
                      ? (selectedPosition.avg_cost - parseFloat(closePrice))
                      : (parseFloat(closePrice) - selectedPosition.avg_cost)
                    ) * Math.abs(selectedPosition.quantity) * 100).toFixed(2)}
                  </span>
                </div>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowCloseModal(false)
                  setSelectedPosition(null)
                  setClosePrice('')
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={handleClosePosition}
                disabled={!closePrice || closingId === selectedPosition.id}
                className="btn-primary disabled:opacity-50"
              >
                {closingId === selectedPosition.id ? 'Closing...' : 'Close Position'}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
