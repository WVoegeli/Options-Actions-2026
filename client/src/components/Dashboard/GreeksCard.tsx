import { CheckCircle, AlertCircle } from 'lucide-react'

interface GreeksCardProps {
  label: string
  value: number
  prefix?: string
  description: string
  target: string
  isGood: boolean
}

export default function GreeksCard({
  label,
  value,
  prefix = '',
  description,
  target,
  isGood,
}: GreeksCardProps) {
  return (
    <div className="card">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400">{label}</p>
          <p className="text-xl font-bold text-white mt-1">
            {prefix}{value.toFixed(2)}
          </p>
        </div>
        {isGood ? (
          <CheckCircle className="w-5 h-5 text-profit" />
        ) : (
          <AlertCircle className="w-5 h-5 text-yellow-400" />
        )}
      </div>
      <div className="mt-3 pt-3 border-t border-dark-border">
        <p className="text-xs text-gray-500">{description}</p>
        <p className="text-xs text-gray-400 mt-1">Target: {target}</p>
      </div>
    </div>
  )
}
