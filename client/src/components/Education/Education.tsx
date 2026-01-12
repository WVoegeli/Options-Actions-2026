import { BookOpen, TrendingUp, Clock, Activity, Zap } from 'lucide-react'

const lessons = [
  {
    id: 'greeks',
    title: 'Understanding the Greeks',
    description: 'Delta, Theta, Gamma, Vega - what they mean and how to use them.',
    icon: Activity,
    duration: '15 min',
    difficulty: 'Beginner',
    topics: ['Delta', 'Theta', 'Gamma', 'Vega', 'Portfolio Greeks'],
  },
  {
    id: 'wheel',
    title: 'The Wheel Strategy Deep Dive',
    description: 'Master the wheel strategy for consistent monthly income.',
    icon: TrendingUp,
    duration: '25 min',
    difficulty: 'Intermediate',
    topics: ['Cash-Secured Puts', 'Covered Calls', 'Strike Selection', 'Rolling'],
  },
  {
    id: 'spreads',
    title: 'Credit Spreads Mastery',
    description: 'Learn defined-risk strategies for any market condition.',
    icon: Zap,
    duration: '20 min',
    difficulty: 'Intermediate',
    topics: ['Bull Put Spread', 'Bear Call Spread', 'Iron Condor', 'Width Selection'],
  },
  {
    id: 'iv',
    title: 'Implied Volatility & IV Rank',
    description: 'The #1 concept that separates profitable traders from losers.',
    icon: Clock,
    duration: '15 min',
    difficulty: 'Beginner',
    topics: ['IV vs HV', 'IV Rank', 'IV Crush', 'When to Sell vs Buy Premium'],
  },
]

const quickFacts = [
  {
    term: 'Delta',
    definition: 'How much the option price moves per $1 stock move. 0.50 delta = $0.50 per $1.',
  },
  {
    term: 'Theta',
    definition: 'Time decay. How much value the option loses per day. Positive theta = you profit from time.',
  },
  {
    term: 'IV Rank',
    definition: 'Where current IV sits vs. past year. >50% = sell premium, <30% = consider buying.',
  },
  {
    term: 'DTE',
    definition: 'Days to expiration. Sweet spot for selling: 30-45 DTE. Close positions at <14 DTE.',
  },
]

export default function Education() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Learn Options</h1>
        <p className="text-gray-400">Master options trading with interactive lessons</p>
      </div>

      {/* Quick Reference */}
      <div className="card">
        <h2 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-primary" />
          Quick Reference
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickFacts.map((fact) => (
            <div key={fact.term} className="p-4 bg-dark-bg rounded-lg">
              <h3 className="font-medium text-primary">{fact.term}</h3>
              <p className="text-sm text-gray-400 mt-1">{fact.definition}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Lessons */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {lessons.map((lesson) => (
          <div
            key={lesson.id}
            className="card hover:border-primary transition-colors cursor-pointer"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-lg bg-primary/20">
                <lesson.icon className="w-6 h-6 text-primary" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-white">{lesson.title}</h3>
                <p className="text-sm text-gray-400 mt-1">{lesson.description}</p>

                <div className="flex gap-4 mt-3 text-sm">
                  <span className="text-gray-500">{lesson.duration}</span>
                  <span className="text-gray-500">•</span>
                  <span className="text-gray-500">{lesson.difficulty}</span>
                </div>

                <div className="flex flex-wrap gap-2 mt-3">
                  {lesson.topics.map((topic) => (
                    <span
                      key={topic}
                      className="text-xs px-2 py-1 rounded bg-dark-border text-gray-400"
                    >
                      {topic}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Coming Soon */}
      <div className="card border-dashed border-2">
        <div className="text-center py-8">
          <h3 className="text-lg font-semibold text-white">Interactive Lessons Coming Soon</h3>
          <p className="text-gray-400 mt-2">
            Phase 4 will include step-by-step tutorials with real examples,
            <br />
            interactive Greeks calculators, and strategy quizzes.
          </p>
        </div>
      </div>
    </div>
  )
}
