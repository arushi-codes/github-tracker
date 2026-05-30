import { useState, useEffect } from 'react'
import { Bar, Doughnut } from 'react-chartjs-2'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Title, Tooltip, Legend, Filler)

function App() {
  const [username, setUsername] = useState('')
  const [username2, setUsername2] = useState('')
  const [data, setData] = useState(null)
  const [compareData, setCompareData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [cacheStatus, setCacheStatus] = useState(null)
  const [typedText, setTypedText] = useState('')
  const [mode, setMode] = useState('single')

  const fullTitle = 'GitHub Activity Tracker'

  useEffect(() => {
    let i = 0
    const interval = setInterval(() => {
      setTypedText(fullTitle.slice(0, i + 1))
      i++
      if (i === fullTitle.length) clearInterval(interval)
    }, 80)
    return () => clearInterval(interval)
  }, [])

  const searchUser = async (e) => {
    e.preventDefault()
    if (!username.trim()) return

    setLoading(true)
    setError(null)
    setData(null)
    setCompareData(null)
    setCacheStatus(null)

    try {
      const res = await fetch(`https://github-tracker-8hzx.onrender.com/api/user/${username}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Something went wrong')
      }
      // Browser fetch lowercases header names, but we set it as X-Cache
      // Try both cases
      const cacheHeader = res.headers.get('X-Cache') || res.headers.get('x-cache')
      console.log('CACHE HEADER RAW:', cacheHeader)
      setCacheStatus(cacheHeader)
      const result = await res.json()
      setData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const compareUsers = async (e) => {
    e.preventDefault()
    if (!username.trim() || !username2.trim()) return

    setLoading(true)
    setError(null)
    setData(null)
    setCompareData(null)
    setCacheStatus(null)

    try {
      const res = await fetch(`https://github-tracker-8hzx.onrender.com/api/compare/${username}/${username2}`)
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.error || 'Something went wrong')
      }
      const cacheHeader = res.headers.get('X-Cache') || res.headers.get('x-cache')
      setCacheStatus(cacheHeader)
      const result = await res.json()
      setCompareData(result)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getBarData = (commitFrequency) => {
    if (!commitFrequency) return null
    const sortedDates = Object.keys(commitFrequency).sort()
    const counts = sortedDates.map((date) => commitFrequency[date])
    const gradientColors = sortedDates.map((_, i) => {
      const alpha = 0.4 + (i / sortedDates.length) * 0.6
      return `rgba(99, 102, 241, ${alpha})`
    })
    return {
      labels: sortedDates,
      datasets: [{ label: 'Commits', data: counts, backgroundColor: gradientColors, borderRadius: 6, borderSkipped: false }],
    }
  }

  const getCompareBarData = () => {
    if (!compareData) return null
    const allDates = new Set([
      ...Object.keys(compareData.user1.commitFrequency || {}),
      ...Object.keys(compareData.user2.commitFrequency || {}),
    ])
    const sortedDates = [...allDates].sort()

    return {
      labels: sortedDates,
      datasets: [
        {
          label: compareData.user1.username,
          data: sortedDates.map((d) => compareData.user1.commitFrequency?.[d] || 0),
          backgroundColor: '#6366f1',
          borderRadius: 4,
        },
        {
          label: compareData.user2.username,
          data: sortedDates.map((d) => compareData.user2.commitFrequency?.[d] || 0),
          backgroundColor: '#f59e0b',
          borderRadius: 4,
        },
      ],
    }
  }

  const getDoughnutData = (languageBreakdown) => {
    if (!languageBreakdown) return null
    const labels = Object.keys(languageBreakdown)
    const values = Object.values(languageBreakdown)
    const colors = ['#818cf8', '#6366f1', '#4f46e5', '#a78bfa', '#c4b5fd', '#ddd6fe', '#e0e7ff']
    return {
      labels,
      datasets: [{ data: values, backgroundColor: colors.slice(0, labels.length), borderWidth: 2, borderColor: '#18181b' }],
    }
  }

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#71717a', maxTicksLimit: 8 } },
      y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#71717a', stepSize: 1 } },
    },
  }

  const compareChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'top', labels: { color: '#a1a1aa', usePointStyle: true, padding: 16 } },
    },
    scales: {
      x: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#71717a', maxTicksLimit: 8 } },
      y: { grid: { color: 'rgba(255,255,255,0.03)' }, ticks: { color: '#71717a', stepSize: 1 } },
    },
  }

  const doughnutOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true, color: '#a1a1aa', font: { size: 12 } } },
    },
    cutout: '65%',
  }

  const ProfileCard = ({ userData, color = 'indigo', children }) => (
    <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-3xl p-8 backdrop-blur-xl relative group hover:border-zinc-700/50 transition-all">
      <div className={`absolute top-0 right-0 w-40 h-40 bg-${color}-500/5 rounded-full blur-2xl group-hover:bg-${color}-500/10 transition-colors pointer-events-none`} />
      <div className="relative flex items-center gap-6 flex-wrap">
        <div className="relative shrink-0">
          <img
            src={userData.profile.avatar_url}
            alt={userData.profile.login}
            className="w-24 h-24 rounded-2xl ring-2 ring-indigo-500/30 ring-offset-4 ring-offset-zinc-950"
          />
          <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-green-500 rounded-full border-2 border-zinc-950" />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-3xl font-bold">{userData.profile.name || userData.profile.login}</h2>
          </div>
          <p className="text-zinc-400 mt-1">@{userData.profile.login}</p>
          {userData.profile.bio && <p className="text-zinc-300 mt-2 max-w-lg">{userData.profile.bio}</p>}
          <div className="flex gap-8 mt-4 text-sm flex-wrap">
            <div className="flex items-center gap-2">
              <span className="text-zinc-100 font-semibold">{userData.profile.followers.toLocaleString()}</span>
              <span className="text-zinc-500">followers</span>
            </div>
            <div>
              <span className="text-zinc-100 font-semibold">{userData.profile.following}</span>
              <span className="text-zinc-500 ml-1">following</span>
            </div>
            <div>
              <span className="text-zinc-100 font-semibold">{userData.repoCount}</span>
              <span className="text-zinc-500 ml-1">repos</span>
            </div>
            <div>
              <span className="text-zinc-100 font-semibold">{userData.totalStars}</span>
              <span className="text-zinc-500 ml-1">stars</span>
            </div>
          </div>
        </div>
      </div>
      {children}
    </div>
  )

  const StatCompareBar = ({ label, val1, val2, max }) => {
    const pct1 = max > 0 ? (val1 / max) * 100 : 0
    const pct2 = max > 0 ? (val2 / max) * 100 : 0
    return (
      <div className="mb-5">
        <div className="flex justify-between text-sm mb-2">
          <span className="text-zinc-400">{label}</span>
          <div className="flex gap-4">
            <span className="text-indigo-400 font-semibold">{val1.toLocaleString()}</span>
            <span className="text-zinc-600">vs</span>
            <span className="text-amber-400 font-semibold">{val2.toLocaleString()}</span>
          </div>
        </div>
        <div className="flex gap-2 h-4 rounded-full overflow-hidden bg-zinc-800">
          <div className="bg-indigo-500 h-full transition-all duration-700 rounded-full" style={{ width: `${pct1}%` }} />
          <div className="bg-amber-500 h-full transition-all duration-700 rounded-full" style={{ width: `${pct2}%` }} />
        </div>
      </div>
    )
  }

  const CacheBadge = ({ status }) => {
    if (!status) return null
    const config = {
      HIT: { bg: 'bg-green-500/10', text: 'text-green-400', border: 'border-green-500/30', label: '⚡ Cached' },
      MISS: { bg: 'bg-blue-500/10', text: 'text-blue-400', border: 'border-blue-500/30', label: '🔄 Fresh' },
      STALE: { bg: 'bg-amber-500/10', text: 'text-amber-400', border: 'border-amber-500/30', label: '⚠ Stale' },
    }
    const c = config[status] || config.MISS
    return (
      <span className={`text-xs px-3 py-1.5 rounded-full backdrop-blur-sm border font-medium ${c.bg} ${c.text} ${c.border}`}>
        {c.label}
      </span>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100 selection:bg-indigo-500/30">
      <div className="fixed inset-0 -z-10">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl animate-pulse" />
      </div>

      <header className="border-b border-zinc-800/50 bg-zinc-950/80 backdrop-blur-xl sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl flex items-center justify-center text-sm font-bold shadow-lg shadow-indigo-500/20">G</div>
            <h1 className="text-lg font-semibold tracking-tight bg-gradient-to-r from-white to-zinc-400 bg-clip-text text-transparent">
              {typedText}<span className="animate-pulse ml-0.5 text-indigo-400">|</span>
            </h1>
          </div>
          {/* Cache badge in header for single mode */}
          {mode === 'single' && cacheStatus && <CacheBadge status={cacheStatus} />}
          {mode === 'compare' && cacheStatus && <CacheBadge status={cacheStatus} />}
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-16">
        <div className={`text-center mb-12 transition-all duration-500 ${data || compareData ? 'mt-0' : 'mt-20'}`}>
          <h2 className="text-4xl font-bold mb-3 tracking-tight">
            Explore any{' '}
            <span className="bg-gradient-to-r from-indigo-400 to-violet-400 bg-clip-text text-transparent">developer</span>
          </h2>
          <p className="text-zinc-500 mb-8 text-lg">Instant insights. Zero API spam. Smart caching.</p>

          {/* Mode toggle */}
          <div className="flex justify-center gap-2 mb-6">
            <button
              onClick={() => { setMode('single'); setData(null); setCompareData(null); setError(null); setCacheStatus(null); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${mode === 'single' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Single User
            </button>
            <button
              onClick={() => { setMode('compare'); setData(null); setCompareData(null); setError(null); setCacheStatus(null); }}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${mode === 'compare' ? 'bg-indigo-500/20 text-indigo-400 border border-indigo-500/30' : 'text-zinc-500 hover:text-zinc-300'}`}
            >
              Compare Users
            </button>
          </div>

          {/* Single user form */}
          {mode === 'single' && (
            <form onSubmit={searchUser} className="flex gap-3 max-w-xl mx-auto">
              <div className="flex-1 relative group">
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter GitHub username..."
                  className="w-full bg-zinc-900/80 border border-zinc-700/50 rounded-2xl px-5 py-4 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all backdrop-blur-sm"
                />
              </div>
              <button type="submit" disabled={loading} className="bg-gradient-to-r from-indigo-500 to-violet-600 hover:from-indigo-400 hover:to-violet-500 text-white font-semibold px-8 py-4 rounded-2xl transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2">
                {loading ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Searching</> : <>Search <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg></>}
              </button>
            </form>
          )}

          {/* Compare form */}
          {mode === 'compare' && (
            <form onSubmit={compareUsers} className="flex gap-3 max-w-2xl mx-auto items-end">
              <div className="flex-1">
                <label className="block text-xs text-zinc-500 mb-1 text-left">User 1</label>
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="e.g. torvalds"
                  className="w-full bg-zinc-900/80 border border-zinc-700/50 rounded-2xl px-5 py-4 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-indigo-500/50 focus:ring-4 focus:ring-indigo-500/10 transition-all backdrop-blur-sm"
                />
              </div>
              <div className="text-zinc-500 text-2xl pb-3">vs</div>
              <div className="flex-1">
                <label className="block text-xs text-zinc-500 mb-1 text-left">User 2</label>
                <input
                  type="text"
                  value={username2}
                  onChange={(e) => setUsername2(e.target.value)}
                  placeholder="e.g. gaearon"
                  className="w-full bg-zinc-900/80 border border-zinc-700/50 rounded-2xl px-5 py-4 text-zinc-100 placeholder-zinc-500 focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 transition-all backdrop-blur-sm"
                />
              </div>
              <button type="submit" disabled={loading} className="bg-gradient-to-r from-indigo-500 to-amber-500 hover:from-indigo-400 hover:to-amber-400 text-white font-semibold px-8 py-4 rounded-2xl transition-all shadow-xl shadow-indigo-500/20 disabled:opacity-50 flex items-center gap-2">
                {loading ? <><svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>Comparing</> : <>Compare <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg></>}
              </button>
            </form>
          )}
        </div>

        {error && (
          <div className="max-w-xl mx-auto mb-8 bg-red-500/5 border border-red-500/20 rounded-2xl px-5 py-4 text-red-400 backdrop-blur-sm flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {error}
          </div>
        )}

        {data?.stale && (
          <div className="max-w-xl mx-auto mb-8 bg-amber-500/5 border border-amber-500/20 rounded-2xl px-5 py-4 text-amber-400 backdrop-blur-sm flex items-center gap-3">
            <svg className="w-5 h-5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-2.694-.833-3.464 0L3.34 16.5c-.77.833.192 2.5 1.732 2.5z" /></svg>
            Rate limit reached. Showing cached data.
          </div>
        )}

        {/* SINGLE USER VIEW */}
        {data && mode === 'single' && (
          <div className="space-y-6">
            <ProfileCard userData={data} />
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-3xl p-8 backdrop-blur-xl">
                <h3 className="text-lg font-semibold mb-4">Languages</h3>
                {getDoughnutData(data.languageBreakdown) ? (
                  <div className="h-64"><Doughnut data={getDoughnutData(data.languageBreakdown)} options={doughnutOptions} /></div>
                ) : <p className="text-zinc-500">No language data</p>}
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-3xl p-8 backdrop-blur-xl">
                <h3 className="text-lg font-semibold mb-4">Commit Activity</h3>
                {getBarData(data.commitFrequency) ? (
                  <div className="h-64"><Bar data={getBarData(data.commitFrequency)} options={chartOptions} /></div>
                ) : <p className="text-zinc-500">No commit data</p>}
              </div>
            </div>
            <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-3xl p-8 backdrop-blur-xl">
              <h3 className="text-lg font-semibold mb-4">Repository Languages</h3>
              <div className="flex flex-wrap gap-3">
                {Object.entries(data.languageBreakdown).map(([lang, count]) => (
                  <span key={lang} className="px-4 py-2 bg-zinc-800/80 rounded-xl text-sm text-zinc-300 border border-zinc-700/30 hover:border-indigo-500/30 transition-all">
                    {lang}<span className="ml-2 px-2 py-0.5 bg-zinc-700/50 rounded-full text-xs text-zinc-400">{count}</span>
                  </span>
                ))}
              </div>
            </div>
            {data.repoList?.length > 0 && (
              <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-3xl p-8 backdrop-blur-xl">
                <div className="flex items-center gap-2 mb-6">
                  <h3 className="text-lg font-semibold">Repositories</h3>
                  <span className="text-sm text-zinc-500">({data.repoList.length})</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {data.repoList.slice(0, 10).map((repo) => (
                    <a key={repo.name} href={repo.html_url} target="_blank" rel="noopener noreferrer" className="block bg-zinc-800/50 border border-zinc-700/30 rounded-2xl p-5 hover:border-indigo-500/30 hover:bg-zinc-800 transition-all group">
                      <div className="flex items-center gap-2 mb-2">
                        <svg className="w-4 h-4 text-zinc-500 group-hover:text-indigo-400 transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
                        <span className="font-medium text-zinc-200 group-hover:text-white">{repo.name}</span>
                      </div>
                      {repo.description && <p className="text-sm text-zinc-500 line-clamp-2 ml-6">{repo.description}</p>}
                      <div className="flex items-center gap-4 mt-3 ml-6 text-xs text-zinc-500">
                        {repo.language && <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-indigo-400" />{repo.language}</span>}
                        <span>⭐ {repo.stargazers_count}</span>
                        <span>🍴 {repo.forks_count}</span>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* COMPARE VIEW */}
        {compareData && mode === 'compare' && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ProfileCard userData={compareData.user1} color="indigo" />
              <ProfileCard userData={compareData.user2} color="amber" />
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-3xl p-8 backdrop-blur-xl">
              <h3 className="text-lg font-semibold mb-6">Head-to-Head Stats</h3>
              <StatCompareBar
                label="Followers"
                val1={compareData.user1.profile.followers}
                val2={compareData.user2.profile.followers}
                max={Math.max(compareData.user1.profile.followers, compareData.user2.profile.followers)}
              />
              <StatCompareBar
                label="Public Repos"
                val1={compareData.user1.repoCount}
                val2={compareData.user2.repoCount}
                max={Math.max(compareData.user1.repoCount, compareData.user2.repoCount)}
              />
              <StatCompareBar
                label="Total Stars"
                val1={compareData.user1.totalStars}
                val2={compareData.user2.totalStars}
                max={Math.max(compareData.user1.totalStars, compareData.user2.totalStars)}
              />
              <StatCompareBar
                label="Total Forks"
                val1={compareData.user1.totalForks}
                val2={compareData.user2.totalForks}
                max={Math.max(compareData.user1.totalForks, compareData.user2.totalForks)}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-3xl p-8 backdrop-blur-xl">
                <h3 className="text-lg font-semibold mb-4">{compareData.user1.username}'s Languages</h3>
                {getDoughnutData(compareData.user1.languageBreakdown) ? (
                  <div className="h-64"><Doughnut data={getDoughnutData(compareData.user1.languageBreakdown)} options={doughnutOptions} /></div>
                ) : <p className="text-zinc-500">No data</p>}
              </div>
              <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-3xl p-8 backdrop-blur-xl">
                <h3 className="text-lg font-semibold mb-4">{compareData.user2.username}'s Languages</h3>
                {getDoughnutData(compareData.user2.languageBreakdown) ? (
                  <div className="h-64"><Doughnut data={getDoughnutData(compareData.user2.languageBreakdown)} options={doughnutOptions} /></div>
                ) : <p className="text-zinc-500">No data</p>}
              </div>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800/50 rounded-3xl p-8 backdrop-blur-xl">
              <h3 className="text-lg font-semibold mb-4">Commit Activity Comparison</h3>
              {getCompareBarData() ? (
                <div className="h-80"><Bar data={getCompareBarData()} options={compareChartOptions} /></div>
              ) : <p className="text-zinc-500">No commit data</p>}
            </div>
          </div>
        )}

        {/* Empty state */}
        {!data && !compareData && !loading && !error && (
          <div className="text-center py-12">
            <div className="w-20 h-20 bg-zinc-900/80 rounded-3xl flex items-center justify-center mx-auto mb-6 border border-zinc-800/50 backdrop-blur-sm">
              <svg className="w-10 h-10 text-zinc-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>
            </div>
            <p className="text-zinc-500 text-lg">
              {mode === 'compare' ? 'Enter two usernames to compare' : 'Search a GitHub username to get started'}
            </p>
            <p className="text-zinc-600 text-sm mt-2">
              Try <button onClick={() => { setUsername('torvalds'); if (mode === 'compare') setUsername2('gaearon'); }} className="text-indigo-400 hover:text-indigo-300 transition-colors">
                {mode === 'compare' ? 'torvalds vs gaearon' : 'torvalds'}
              </button>
            </p>
          </div>
        )}
      </main>
    </div>
  )
}

export default App