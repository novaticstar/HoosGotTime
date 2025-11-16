"use client"
import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function Settings() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [userData, setUserData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    username: '',
    phoneNumber: '',
    walkingTime: 10, // minutes before event to send notification
    notificationsEnabled: false
  })

  useEffect(() => {
    async function loadUserData() {
      try {
        const res = await fetch('/api/auth/session', {
          credentials: 'include'
        })
        const data = await res.json()
        
        if (!data.userId) {
          router.push('/login')
          return
        }

        // Fetch full user profile
        const profileRes = await fetch(`/api/user/profile?userId=${data.userId}`, {
          credentials: 'include'
        })
        const profile = await profileRes.json()
        
        setUserData({
          firstName: profile.firstName || '',
          lastName: profile.lastName || '',
          email: profile.email || '',
          username: profile.username || '',
          phoneNumber: profile.phoneNumber || '',
          walkingTime: profile.walkingTime || 10,
          notificationsEnabled: profile.notificationsEnabled || false
        })
        setLoading(false)
      } catch (error) {
        console.error('Failed to load user data:', error)
        router.push('/login')
      }
    }
    
    loadUserData()
  }, [router])

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setMessage('')

    try {
      const res = await fetch('/api/user/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(userData)
      })

      const data = await res.json()

      if (res.ok) {
        setMessage('Settings saved successfully!')
        setTimeout(() => setMessage(''), 3000)
      } else {
        setMessage(`Error: ${data.error}`)
      }
    } catch (error) {
      setMessage('Failed to save settings')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="home-wrap" style={{ padding: '2rem' }}>
        <div style={{ textAlign: 'center' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="home-wrap" style={{ padding: '2rem' }}>
      <div className="chat-card" style={{ maxWidth: 800, margin: '0 auto' }}>
        <div className="chat-header" style={{ borderBottom: '1px solid var(--card-border)', padding: '1.5rem 2rem' }}>
          <h1 style={{ margin: 0, fontSize: '1.5rem' }}>Settings</h1>
        </div>

        <form onSubmit={handleSave} style={{ padding: '2rem' }}>
          <div className="stack-md">
            <section>
              <h2 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--muted-2)' }}>Profile Information</h2>
              
              <div className="form-grid">
                <label className="form-field">
                  <span>First Name</span>
                  <input 
                    value={userData.firstName}
                    onChange={e => setUserData({...userData, firstName: e.target.value})}
                    required
                  />
                </label>

                <label className="form-field">
                  <span>Last Name</span>
                  <input 
                    value={userData.lastName}
                    onChange={e => setUserData({...userData, lastName: e.target.value})}
                    required
                  />
                </label>

                <label className="form-field" style={{ gridColumn: '1 / -1' }}>
                  <span>Email</span>
                  <input 
                    type="email"
                    value={userData.email}
                    onChange={e => setUserData({...userData, email: e.target.value})}
                    required
                  />
                </label>

                <label className="form-field" style={{ gridColumn: '1 / -1' }}>
                  <span>Username</span>
                  <input 
                    value={userData.username}
                    disabled
                    style={{ opacity: 0.6, cursor: 'not-allowed' }}
                  />
                  <small style={{ fontSize: '.65rem', color: 'var(--muted-2)', marginTop: '.25rem' }}>
                    Username cannot be changed
                  </small>
                </label>
              </div>
            </section>

            <section style={{ marginTop: '2rem' }}>
              <h2 style={{ fontSize: '1rem', marginBottom: '1rem', color: 'var(--muted-2)' }}>SMS Notifications</h2>
              
              <div className="form-grid">
                <label className="form-field" style={{ gridColumn: '1 / -1' }}>
                  <span>Phone Number</span>
                  <input 
                    type="tel"
                    value={userData.phoneNumber}
                    onChange={e => setUserData({...userData, phoneNumber: e.target.value})}
                    placeholder="+1 (555) 123-4567"
                  />
                  <small style={{ fontSize: '.65rem', color: 'var(--muted-2)', marginTop: '.25rem' }}>
                    Include country code (e.g., +1 for US)
                  </small>
                </label>

                <label className="form-field">
                  <span>Walking Time (minutes)</span>
                  <input 
                    type="number"
                    min="1"
                    max="60"
                    value={userData.walkingTime}
                    onChange={e => setUserData({...userData, walkingTime: parseInt(e.target.value)})}
                  />
                  <small style={{ fontSize: '.65rem', color: 'var(--muted-2)', marginTop: '.25rem' }}>
                    Minutes before event to send reminder
                  </small>
                </label>

                <label className="form-field" style={{ display: 'flex', flexDirection: 'row', alignItems: 'center', gap: '.5rem' }}>
                  <input 
                    type="checkbox"
                    checked={userData.notificationsEnabled}
                    onChange={e => setUserData({...userData, notificationsEnabled: e.target.checked})}
                    style={{ width: 'auto', margin: 0 }}
                  />
                  <span>Enable SMS notifications</span>
                </label>
              </div>

              <div style={{ 
                marginTop: '1rem', 
                padding: '1rem', 
                background: 'rgba(232,119,34,.1)', 
                border: '1px solid rgba(232,119,34,.3)',
                borderRadius: 'var(--radius-md)',
                fontSize: '.75rem',
                color: 'var(--muted-2)'
              }}>
                <strong>How it works:</strong> You'll receive a text message {userData.walkingTime} minutes before each event, 
                giving you time to walk to your next location.
              </div>
            </section>

            {message && (
              <div className={message.includes('Error') ? 'error-banner' : 'success-banner'}>
                {message}
              </div>
            )}

            <div className="row-md" style={{ marginTop: '1rem' }}>
              <button 
                type="button" 
                className="btn"
                onClick={() => router.push('/')}
              >
                Cancel
              </button>
              <button 
                type="submit" 
                className="btn btn-accent"
                disabled={saving}
              >
                {saving ? 'Saving...' : 'Save Settings'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  )
}
