import { useState, useEffect } from 'react'
import { Plus, Search, Calendar, ChevronDown, ChevronUp, Edit2, X, BookOpen, TrendingUp, TrendingDown, Filter } from 'lucide-react'
import { positionsApi, journalApi, analyticsApi } from '../../services/api'

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
  close_price: number
  strategy_tag: string
  status: string
  opened_at: string
  closed_at: string
  pnl: number
  notes: string
}

interface JournalEntry {
  id: number
  position_id: number
  trade_id: number
  thesis: string
  analysis: string
  grade: string
  emotion: string
  lessons_learned: string
  created_at: string
  symbol?: string
  underlying?: string
  strategy_tag?: string
}

interface Analytics {
  overall: {
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
  by_strategy: Array<{
    strategy: string
    total_trades: number
    winning_trades: number
    win_rate: number
    avg_pnl: number
    total_pnl: number
  }>
}

const gradeColors: Record<string, string> = {
  'A': 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  'B': 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  'C': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'D': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'F': 'bg-red-500/20 text-red-400 border-red-500/30',
}

const emotionOptions = [
  'Confident', 'Uncertain', 'FOMO', 'Greedy', 'Fearful', 'Neutral', 'Excited', 'Anxious'
]

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

export default function Journal() {
  const [positions, setPositions] = useState<Position[]>([])
  const [journalEntries, setJournalEntries] = useState<Map<number, JournalEntry>>(new Map())
  const [analytics, setAnalytics] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all')
  const [expandedId, setExpandedId] = useState<number | null>(null)
  const [showJournalModal, setShowJournalModal] = useState(false)
  const [selectedPosition, setSelectedPosition] = useState<Position | null>(null)
  const [journalForm, setJournalForm] = useState({
    thesis: '',
    analysis: '',
    grade: '',
    emotion: '',
    lessons_learned: '',
  })
  const [saving, setSaving] = useState(false)
  const [editingEntryId, setEditingEntryId] = useState<number | null>(null)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [positionsRes, journalRes, analyticsRes] = await Promise.all([
        positionsApi.getAll(1),
        journalApi.getAll(),
        analyticsApi.get(1),
      ])

      // Sort by most recent first
      const sortedPositions = positionsRes.data.sort((a: Position, b: Position) =>
        new Date(b.opened_at).getTime() - new Date(a.opened_at).getTime()
      )
      setPositions(sortedPositions)

      // Create a map of position_id to journal entry
      const entryMap = new Map<number, JournalEntry>()
      journalRes.data.forEach((entry: JournalEntry) => {
        entryMap.set(entry.position_id, entry)
      })
      setJournalEntries(entryMap)

      setAnalytics(analyticsRes.data)
    } catch (error) {
      console.error('Failed to fetch journal data:', error)
    } finally {
      setLoading(false)
    }
  }

  const openJournalModal = (position: Position) => {
    setSelectedPosition(position)
    const existingEntry = journalEntries.get(position.id)
    if (existingEntry) {
      setJournalForm({
        thesis: existingEntry.thesis || '',
        analysis: existingEntry.analysis || '',
        grade: existingEntry.grade || '',
        emotion: existingEntry.emotion || '',
        lessons_learned: existingEntry.lessons_learned || '',
      })
      setEditingEntryId(existingEntry.id)
    } else {
      setJournalForm({
        thesis: position.notes || '',
        analysis: '',
        grade: '',
        emotion: '',
        lessons_learned: '',
      })
      setEditingEntryId(null)
    }
    setShowJournalModal(true)
  }

  const saveJournalEntry = async () => {
    if (!selectedPosition) return

    setSaving(true)
    try {
      if (editingEntryId) {
        await journalApi.update(editingEntryId, journalForm)
      } else {
        await journalApi.create({
          position_id: selectedPosition.id,
          ...journalForm,
          grade: journalForm.grade as 'A' | 'B' | 'C' | 'D' | 'F' | undefined,
        })
      }
      await fetchData()
      setShowJournalModal(false)
      setSelectedPosition(null)
    } catch (error) {
      console.error('Failed to save journal entry:', error)
    } finally {
      setSaving(false)
    }
  }

  const calculatePnl = (position: Position) => {
    if (position.pnl !== null && position.pnl !== undefined) {
      return position.pnl
    }
    const costBasis = position.avg_cost * Math.abs(position.quantity) * 100
    const currentValue = (position.close_price || position.current_price || position.avg_cost) * Math.abs(position.quantity) * 100

    if (position.quantity < 0) {
      return costBasis - currentValue
    }
    return currentValue - costBasis
  }

  const filteredPositions = positions.filter(position => {
    const matchesSearch = position.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      position.underlying.toLowerCase().includes(searchQuery.toLowerCase()) ||
      position.strategy_tag?.toLowerCase().includes(searchQuery.toLowerCase())

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'open' && position.status === 'open') ||
      (statusFilter === 'closed' && position.status !== 'open')

    return matchesSearch && matchesStatus
  })

  const stats = {
    totalTrades: analytics?.overall.total_trades || positions.filter(p => p.status !== 'open').length,
    winRate: analytics?.overall.win_rate || 0,
    avgReturn: analytics?.overall.total_trades
      ? (analytics.overall.total_pnl / analytics.overall.total_trades)
      : 0,
    totalPnl: analytics?.overall.total_pnl || 0,
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-gray-400">Loading journal...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Trade Journal</h1>
          <p className="text-gray-400">Track, analyze, and learn from every trade</p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search trades..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-10 w-64"
            />
          </div>
          <div className="flex items-center gap-1 bg-dark-bg rounded-lg p-1">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                statusFilter === 'all' ? 'bg-dark-card text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              All
            </button>
            <button
              onClick={() => setStatusFilter('open')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                statusFilter === 'open' ? 'bg-dark-card text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Open
            </button>
            <button
              onClick={() => setStatusFilter('closed')}
              className={`px-3 py-1.5 text-sm rounded-md transition-colors ${
                statusFilter === 'closed' ? 'bg-dark-card text-white' : 'text-gray-400 hover:text-white'
              }`}
            >
              Closed
            </button>
          </div>
        </div>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="card">
          <p className="text-sm text-gray-400">Total Trades</p>
          <p className="text-2xl font-bold text-white">{stats.totalTrades}</p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-400">Win Rate</p>
          <p className={`text-2xl font-bold ${stats.winRate >= 50 ? 'text-profit' : 'text-loss'}`}>
            {stats.winRate.toFixed(0)}%
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-400">Avg. Return</p>
          <p className={`text-2xl font-bold ${stats.avgReturn >= 0 ? 'text-profit' : 'text-loss'}`}>
            {stats.avgReturn >= 0 ? '+' : ''}${stats.avgReturn.toFixed(2)}
          </p>
        </div>
        <div className="card">
          <p className="text-sm text-gray-400">Total P&L</p>
          <p className={`text-2xl font-bold ${stats.totalPnl >= 0 ? 'text-profit' : 'text-loss'}`}>
            {stats.totalPnl >= 0 ? '+' : ''}${stats.totalPnl.toFixed(2)}
          </p>
        </div>
      </div>

      {/* Trade List */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5" />
            Trade History ({filteredPositions.length})
          </h2>
        </div>

        {filteredPositions.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-12 h-12 text-gray-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-white mb-2">No Trades Found</h3>
            <p className="text-gray-400">
              {searchQuery || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Start trading to build your journal'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredPositions.map((position) => {
              const pnl = calculatePnl(position)
              const journalEntry = journalEntries.get(position.id)
              const isExpanded = expandedId === position.id

              return (
                <div
                  key={position.id}
                  className="bg-dark-bg rounded-lg overflow-hidden"
                >
                  {/* Trade Row */}
                  <div
                    className="p-4 hover:bg-dark-border/30 transition-colors cursor-pointer"
                    onClick={() => setExpandedId(isExpanded ? null : position.id)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <span className="font-medium text-white">{position.symbol}</span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            strategyColors[position.strategy_tag] || 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {position.strategy_tag?.replace(/-/g, ' ').toUpperCase() || 'OTHER'}
                          </span>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            position.status === 'open'
                              ? 'bg-blue-500/20 text-blue-400'
                              : 'bg-gray-500/20 text-gray-400'
                          }`}>
                            {position.status.toUpperCase()}
                          </span>
                          {journalEntry?.grade && (
                            <span className={`text-xs px-2 py-0.5 rounded border ${gradeColors[journalEntry.grade]}`}>
                              Grade: {journalEntry.grade}
                            </span>
                          )}
                          {!journalEntry && (
                            <span className="text-xs px-2 py-0.5 rounded bg-yellow-500/20 text-yellow-400">
                              No Journal Entry
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-400 mt-1">
                          {journalEntry?.thesis || position.notes || 'No thesis recorded'}
                        </p>
                        <div className="flex items-center gap-4 mt-2 text-sm">
                          <span className="text-gray-500">
                            {new Date(position.opened_at).toLocaleDateString()}
                          </span>
                          <span className="text-gray-400">
                            {position.quantity < 0 ? 'Sold' : 'Bought'} {Math.abs(position.quantity)} @ ${position.avg_cost.toFixed(2)}
                          </span>
                          {position.close_price && (
                            <span className="text-gray-400">
                              Closed @ ${position.close_price.toFixed(2)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          {position.status !== 'open' ? (
                            <span className={`text-lg font-bold ${pnl >= 0 ? 'text-profit' : 'text-loss'}`}>
                              {pnl >= 0 ? '+' : ''}${pnl.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-gray-400">Open</span>
                          )}
                        </div>
                        <button
                          onClick={(e) => {
                            e.stopPropagation()
                            openJournalModal(position)
                          }}
                          className="p-2 text-gray-400 hover:text-white hover:bg-dark-border rounded-lg transition-colors"
                          title={journalEntry ? 'Edit journal entry' : 'Add journal entry'}
                        >
                          {journalEntry ? <Edit2 className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
                        </button>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded Details */}
                  {isExpanded && (
                    <div className="px-4 pb-4 pt-0 border-t border-dark-border/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
                        {/* Trade Details */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-gray-400">Trade Details</h4>
                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <span className="text-gray-500">Underlying:</span>
                              <span className="ml-2 text-white">{position.underlying}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Type:</span>
                              <span className="ml-2 text-white">{position.option_type?.toUpperCase()}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Strike:</span>
                              <span className="ml-2 text-white">${position.strike}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Expiration:</span>
                              <span className="ml-2 text-white">
                                {position.expiration ? new Date(position.expiration).toLocaleDateString() : '-'}
                              </span>
                            </div>
                            <div>
                              <span className="text-gray-500">Entry:</span>
                              <span className="ml-2 text-white">${position.avg_cost.toFixed(2)}</span>
                            </div>
                            <div>
                              <span className="text-gray-500">Exit:</span>
                              <span className="ml-2 text-white">
                                {position.close_price ? `$${position.close_price.toFixed(2)}` : '-'}
                              </span>
                            </div>
                          </div>
                        </div>

                        {/* Journal Entry */}
                        <div className="space-y-3">
                          <h4 className="text-sm font-medium text-gray-400">Journal Entry</h4>
                          {journalEntry ? (
                            <div className="space-y-2 text-sm">
                              {journalEntry.thesis && (
                                <div>
                                  <span className="text-gray-500 block">Thesis:</span>
                                  <p className="text-white">{journalEntry.thesis}</p>
                                </div>
                              )}
                              {journalEntry.analysis && (
                                <div>
                                  <span className="text-gray-500 block">Analysis:</span>
                                  <p className="text-white">{journalEntry.analysis}</p>
                                </div>
                              )}
                              {journalEntry.emotion && (
                                <div>
                                  <span className="text-gray-500">Emotion:</span>
                                  <span className="ml-2 text-white">{journalEntry.emotion}</span>
                                </div>
                              )}
                              {journalEntry.lessons_learned && (
                                <div>
                                  <span className="text-gray-500 block">Lessons Learned:</span>
                                  <p className="text-white">{journalEntry.lessons_learned}</p>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center py-4">
                              <p className="text-gray-500 mb-2">No journal entry yet</p>
                              <button
                                onClick={() => openJournalModal(position)}
                                className="btn-primary text-sm"
                              >
                                Add Entry
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* Journal Entry Modal */}
      {showJournalModal && selectedPosition && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-dark-card rounded-xl border border-dark-border w-full max-w-xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between p-4 border-b border-dark-border">
              <div>
                <h2 className="text-lg font-semibold text-white">
                  {editingEntryId ? 'Edit Journal Entry' : 'Add Journal Entry'}
                </h2>
                <p className="text-sm text-gray-400">{selectedPosition.symbol}</p>
              </div>
              <button
                onClick={() => {
                  setShowJournalModal(false)
                  setSelectedPosition(null)
                }}
                className="text-gray-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 space-y-4">
              {/* Trade Summary */}
              <div className="p-3 bg-dark-bg rounded-lg flex items-center justify-between">
                <div>
                  <span className="text-white font-medium">{selectedPosition.symbol}</span>
                  <span className="text-gray-400 ml-2">
                    {selectedPosition.quantity < 0 ? 'Short' : 'Long'} @ ${selectedPosition.avg_cost.toFixed(2)}
                  </span>
                </div>
                {selectedPosition.status !== 'open' && (
                  <span className={`font-bold ${calculatePnl(selectedPosition) >= 0 ? 'text-profit' : 'text-loss'}`}>
                    {calculatePnl(selectedPosition) >= 0 ? '+' : ''}${calculatePnl(selectedPosition).toFixed(2)}
                  </span>
                )}
              </div>

              {/* Thesis */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Trade Thesis</label>
                <textarea
                  value={journalForm.thesis}
                  onChange={(e) => setJournalForm({ ...journalForm, thesis: e.target.value })}
                  placeholder="Why did you enter this trade? What was your reasoning?"
                  rows={3}
                  className="input-field w-full resize-none"
                />
              </div>

              {/* Analysis */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Post-Trade Analysis</label>
                <textarea
                  value={journalForm.analysis}
                  onChange={(e) => setJournalForm({ ...journalForm, analysis: e.target.value })}
                  placeholder="How did the trade play out? What went right/wrong?"
                  rows={3}
                  className="input-field w-full resize-none"
                />
              </div>

              {/* Grade & Emotion */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Trade Grade</label>
                  <div className="flex gap-2">
                    {['A', 'B', 'C', 'D', 'F'].map((grade) => (
                      <button
                        key={grade}
                        onClick={() => setJournalForm({ ...journalForm, grade })}
                        className={`flex-1 py-2 rounded-lg border transition-colors ${
                          journalForm.grade === grade
                            ? gradeColors[grade]
                            : 'border-dark-border text-gray-400 hover:border-gray-500'
                        }`}
                      >
                        {grade}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="block text-sm text-gray-400 mb-2">Emotion During Trade</label>
                  <select
                    value={journalForm.emotion}
                    onChange={(e) => setJournalForm({ ...journalForm, emotion: e.target.value })}
                    className="input-field w-full"
                  >
                    <option value="">Select emotion</option>
                    {emotionOptions.map((emotion) => (
                      <option key={emotion} value={emotion}>{emotion}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Lessons Learned */}
              <div>
                <label className="block text-sm text-gray-400 mb-2">Lessons Learned</label>
                <textarea
                  value={journalForm.lessons_learned}
                  onChange={(e) => setJournalForm({ ...journalForm, lessons_learned: e.target.value })}
                  placeholder="What will you do differently next time?"
                  rows={2}
                  className="input-field w-full resize-none"
                />
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 p-4 border-t border-dark-border">
              <button
                onClick={() => {
                  setShowJournalModal(false)
                  setSelectedPosition(null)
                }}
                className="btn-secondary"
              >
                Cancel
              </button>
              <button
                onClick={saveJournalEntry}
                disabled={saving}
                className="btn-primary disabled:opacity-50"
              >
                {saving ? 'Saving...' : editingEntryId ? 'Update Entry' : 'Save Entry'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
