"use client"
import React, { useState } from 'react'

export default function AuthEntry() {
  const [mode, setMode] = useState('login') // 'login' | 'signup'
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [email, setEmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  async function handlePasswordSignup(e) {
    e.preventDefault()
    setError('')
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !username.trim() || !password.trim()) {
      setError('All fields are required.')
      return
    }
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      setError('Invalid email format.')
      return
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ firstName, lastName, email, username, password })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Signup failed.')
        setLoading(false)
        return
      }
      // Successful signup, redirect to home
      window.location.href = '/'
    } catch (err) {
      setError('Network error during signup.')
      setLoading(false)
    }
  }

  async function handlePasswordLogin(e) {
    e.preventDefault()
    setError('')
    if (!username.trim() || !password.trim()) {
      setError('Username and password are required.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error || 'Login failed.')
        setLoading(false)
        return
      }
      // Successful login, redirect to home
      window.location.href = '/'
    } catch (err) {
      setError('Network error during login.')
      setLoading(false)
    }
  }

  return (
    <div className="home-wrap" style={{ padding: '2rem', width: '100%' }}>
      <div className="chat-card" style={{ maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column' }}>
        <div className="chat-header" style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div className="tabs">
            <button className={`tab ${mode === 'login' ? 'tab-active' : ''}`} onClick={() => setMode('login')}>Log In</button>
            <button className={`tab ${mode === 'signup' ? 'tab-active' : ''}`} onClick={() => setMode('signup')}>Create Account</button>
          </div>
        </div>
        <div style={{ padding: '1.6rem 1.8rem', display: 'flex', flexDirection: 'column', gap: '1.4rem' }}>
          {/* Password Auth - Login */}
          {mode === 'login' && (
            <form onSubmit={handlePasswordLogin} className="stack-md" style={{ width: '100%' }}>
              <p style={{ margin: 0, fontSize: '.85rem', color: 'var(--muted-2)', lineHeight: '1.4' }}>Enter your username and password.</p>
              <div className="form-grid" style={{ gridTemplateColumns: '1fr' }}>
                <label className="form-field">
                  <span>Username</span>
                  <input value={username} onChange={e => setUsername(e.target.value)} placeholder="your_username" autoComplete="username" />
                </label>
                <label className="form-field">
                  <span>Password</span>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="current-password" />
                </label>
              </div>
              {error && <div className="error-banner">{error}</div>}
              <button disabled={loading} type="submit" className="btn btn-accent" style={{ width: '100%' }}>{loading ? 'Logging in...' : 'Log In'}</button>
            </form>
          )}

          {/* Signup */}
          {mode === 'signup' && (
            <form onSubmit={handlePasswordSignup} className="stack-md" style={{ width: '100%' }}>
              <p style={{ margin: 0, fontSize: '.85rem', color: 'var(--muted-2)', lineHeight: '1.4' }}>Create your account with username and password.</p>
              <div className="form-grid">
                <label className="form-field">
                  <span>First Name</span>
                  <input value={firstName} onChange={e => setFirstName(e.target.value)} placeholder="Jane" autoComplete="given-name" />
                </label>
                <label className="form-field">
                  <span>Last Name</span>
                  <input value={lastName} onChange={e => setLastName(e.target.value)} placeholder="Doe" autoComplete="family-name" />
                </label>
                <label className="form-field" style={{ gridColumn: '1 / -1' }}>
                  <span>Email</span>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="jane.doe@example.com" autoComplete="email" />
                </label>
                <label className="form-field" style={{ gridColumn: '1 / -1' }}>
                  <span>Username</span>
                  <input value={username} onChange={e => setUsername(e.target.value)} placeholder="your_username" autoComplete="username" />
                </label>
                <label className="form-field" style={{ gridColumn: '1 / -1' }}>
                  <span>Password (min 6 characters)</span>
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" autoComplete="new-password" />
                </label>
              </div>
              {error && <div className="error-banner">{error}</div>}
              <button disabled={loading} type="submit" className="btn btn-accent" style={{ width: '100%' }}>{loading ? 'Creating...' : 'Create Account'}</button>
            </form>
          )}

          <div style={{ fontSize: '.65rem', lineHeight: 1.4, color: 'var(--muted-2)', marginTop: '.25rem' }}>
            <p style={{ margin: 0 }}>All accounts require first name, last name, email, username, and password.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
