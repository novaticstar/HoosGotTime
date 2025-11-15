"use client"

import React, { useEffect, useRef, useState } from 'react'

export default function ChatClient() {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { id: 1, role: 'bot', text: "Hi — I'm your scheduling assistant. Ask me to plan your day, build a study schedule, or draft a weekly routine." },
  ])
  const messagesRef = useRef(null)

  useEffect(() => {
    // auto-scroll to bottom on new message
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [messages])

  function handleSubmit(e) {
    e.preventDefault()
    const val = input.trim()
    if (!val) return

    const userMsg = { id: Date.now(), role: 'user', text: val }
    setMessages((prev) => [...prev, userMsg])
    setInput('')

    // mock bot reply (replace with real API call later)
    setTimeout(() => {
      const reply = { id: Date.now() + 1, role: 'bot', text: `Nice — I can help plan: "${val}". (This is a mock reply.)` }
      setMessages((prev) => [...prev, reply])
    }, 700)
  }

  return (
    <div className="chat-area">
      <div className="chat-header">Welcome to HoosGotTime</div>

      <div className="messages" ref={messagesRef}>
        {messages.map((m) => (
          <div key={m.id} className={`message ${m.role === 'bot' ? 'bot' : 'user'}`}>
            {m.text}
          </div>
        ))}
      </div>

      <form className="input-area" onSubmit={handleSubmit}>
        <input aria-label="Message" placeholder="Try: Plan my study schedule" value={input} onChange={(e) => setInput(e.target.value)} />
        <button className="send" type="submit">Send</button>
      </form>
    </div>
  )
}
