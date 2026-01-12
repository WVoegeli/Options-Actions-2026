import { Plus, Filter, Download } from 'lucide-react'

export default function Positions() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">Positions</h1>
          <p className="text-gray-400">Manage your open and closed positions</p>
        </div>
        <div className="flex gap-3">
          <button className="btn-secondary flex items-center gap-2">
            <Filter className="w-4 h-4" />
            Filter
          </button>
          <button className="btn-secondary flex items-center gap-2">
            <Download className="w-4 h-4" />
            Export
          </button>
          <button className="btn-primary flex items-center gap-2">
            <Plus className="w-4 h-4" />
            New Position
          </button>
        </div>
      </div>

      <div className="card">
        <p className="text-gray-400 text-center py-12">
          Full positions management coming in Phase 2.
          <br />
          View the Dashboard for current positions summary.
        </p>
      </div>
    </div>
  )
}
