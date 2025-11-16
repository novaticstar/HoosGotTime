"use client"
import ChatClient from '../components/ChatClient'
import CalendarView from '../components/CalendarView'
import WalkingCharacter from '../components/WalkingCharacter'
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter()
  const [userId, setUserId] = useState(null)
  const [refreshTrigger, setRefreshTrigger] = useState(0)
  const [loading, setLoading] = useState(true)
  const [isThinking, setIsThinking] = useState(false)

  useEffect(() => {
    // Check session and get userId
    async function checkSession() {
      try {
        const res = await fetch('/api/auth/session')
        const data = await res.json()
        
        if (!data.userId) {
          router.push('/login')
        } else {
          setUserId(data.userId)
          setLoading(false)
        }
      } catch (error) {
        router.push('/login')
      }
    }
    
    checkSession()
  }, [router])

  function handleEventsUpdated() {
    setRefreshTrigger(prev => prev + 1)
  }

  function handleThinkingChange(thinking) {
    setIsThinking(thinking)
  }

  function handleLogout() {
    fetch('/api/auth/logout', { method: 'POST' })
      .then(() => router.push('/login'))
  }

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>
  }

  return (
    <>      
      <div className="home-wrap">
        <div className="chat-card" style={{ position: 'relative' }}>
          <WalkingCharacter isThinking={isThinking} />
          
          <aside className="sidebar">
            <div className="sidebar-brand">HoosGotTime</div>

            <div className="examples">
              <h3>Examples</h3>
              <button className="example">Create a study schedule for 2 weeks</button>
              <button className="example">Plan a weekend project</button>
              <button className="example">Suggest time blocks for productivity</button>
            </div>

            <div className="nav-links" style={{ marginTop: 'auto', padding: '1rem', borderTop: '1px solid var(--card-border)' }}>
              <button 
                onClick={() => router.push('/settings')}
                className="nav-link"
                style={{ 
                  display: 'block', 
                  width: '100%', 
                  padding: '.5rem', 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--muted-2)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'background .2s'
                }}
                onMouseOver={e => e.target.style.background = 'var(--bg-2)'}
                onMouseOut={e => e.target.style.background = 'none'}
              >
                ⚙️ Settings
              </button>
              <button 
                onClick={handleLogout}
                className="nav-link"
                style={{ 
                  display: 'block', 
                  width: '100%', 
                  padding: '.5rem', 
                  background: 'none', 
                  border: 'none', 
                  color: 'var(--muted-2)',
                  cursor: 'pointer',
                  textAlign: 'left',
                  borderRadius: 'var(--radius-sm)',
                  transition: 'background .2s',
                  marginTop: '.25rem'
                }}
                onMouseOver={e => e.target.style.background = 'var(--bg-2)'}
                onMouseOut={e => e.target.style.background = 'none'}
              >
                🚪 Logout
              </button>
            </div>

            <div className="footer-help">AI-powered scheduling</div>
          </aside>

          {/* ChatClient is a Client Component — keeps event handlers out of Server Components */}
          <ChatClient 
            userId={userId} 
            onEventsUpdated={handleEventsUpdated}
            onThinkingChange={handleThinkingChange}
          />
        </div>

        <div className="calendar-panel">
          <CalendarView userId={userId} refreshTrigger={refreshTrigger} />
        </div>
      </div>
    </>
  )
}
