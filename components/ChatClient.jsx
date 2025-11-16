"use client"

import React, { useEffect, useRef, useState } from 'react'

export default function ChatClient({ userId, onEventsUpdated, onThinkingChange }) {
  const [input, setInput] = useState('')
  const [messages, setMessages] = useState([
    { id: 1, role: 'bot', text: "Hi — I'm your scheduling assistant. Ask me to plan your day, build a study schedule, or draft a weekly routine." },
  ])
  const [isLoading, setIsLoading] = useState(false)
  const [attachedFiles, setAttachedFiles] = useState([])
  const messagesRef = useRef(null)
  const fileInputRef = useRef(null)

  useEffect(() => {
    // Notify parent of thinking state
    onThinkingChange?.(isLoading)
  }, [isLoading, onThinkingChange])

  useEffect(() => {
    // auto-scroll to bottom on new message
    if (messagesRef.current) {
      messagesRef.current.scrollTop = messagesRef.current.scrollHeight
    }
  }, [messages])

  useEffect(() => {
    // Handle paste events for images
    function handlePaste(e) {
      const items = e.clipboardData?.items
      if (!items) return

      const imageFiles = []
      for (let i = 0; i < items.length; i++) {
        const item = items[i]
        if (item.type.indexOf('image') !== -1) {
          const file = item.getAsFile()
          if (file) {
            imageFiles.push(file)
          }
        }
      }

      if (imageFiles.length > 0) {
        e.preventDefault()
        setAttachedFiles(prev => [...prev, ...imageFiles])
      }
    }

    document.addEventListener('paste', handlePaste)
    return () => document.removeEventListener('paste', handlePaste)
  }, [])

  function handleFileSelect(e) {
    const files = Array.from(e.target.files)
    setAttachedFiles(prev => [...prev, ...files])
  }

  function removeFile(index) {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
  }

  function getFilePreview(file) {
    if (file.type.startsWith('image/')) {
      return URL.createObjectURL(file)
    }
    return null
  }

  async function handleSubmit(e) {
    e.preventDefault()
    const val = input.trim()
    if (!val && attachedFiles.length === 0) return
    if (isLoading) return

    // Create user message text
    let messageText = val
    if (attachedFiles.length > 0) {
      messageText += `\n\n📎 Attached files: ${attachedFiles.map(f => f.name).join(', ')}`
    }

    const userMsg = { id: Date.now(), role: 'user', text: messageText }
    setMessages((prev) => [...prev, userMsg])
    setInput('')
    
    // Store files info before clearing
    const filesInfo = attachedFiles.map(f => ({
      name: f.name,
      type: f.type,
      size: f.size
    }))
    setAttachedFiles([])
    setIsLoading(true)

    try {
      // For now, we'll send file info as context to Claude
      // In a full implementation, you'd upload files to storage first
      let fullMessage = val
      if (filesInfo.length > 0) {
        fullMessage += `\n\nUser has attached ${filesInfo.length} file(s): ${filesInfo.map(f => `${f.name} (${f.type})`).join(', ')}`
      }

      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: fullMessage, userId })
      })

      const data = await res.json()
      
      if (data.error) {
        const errorMsg = { id: Date.now() + 1, role: 'bot', text: `Error: ${data.error}` }
        setMessages((prev) => [...prev, errorMsg])
      } else {
        const botMsg = { id: Date.now() + 1, role: 'bot', text: data.message }
        setMessages((prev) => [...prev, botMsg])
        
        // Trigger calendar refresh if events were created
        if (data.events && data.events.length > 0) {
          onEventsUpdated?.()
        }
      }
    } catch (error) {
      console.error('Chat error:', error)
      const errorMsg = { id: Date.now() + 1, role: 'bot', text: 'Sorry, I encountered an error. Please try again.' }
      setMessages((prev) => [...prev, errorMsg])
    } finally {
      setIsLoading(false)
    }
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
        <input 
          type="file"
          ref={fileInputRef}
          onChange={handleFileSelect}
          multiple
          style={{ display: 'none' }}
          accept=".pdf,.doc,.docx,.txt,.csv,.xlsx,.xls,.jpg,.jpeg,.png"
        />
        
        <button 
          type="button"
          className="btn-icon"
          onClick={() => fileInputRef.current?.click()}
          title="Attach files"
          disabled={isLoading}
        >
          📎
        </button>
        
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 'var(--gap-xs)' }}>
          {attachedFiles.length > 0 && (
            <div className="attached-files">
              {attachedFiles.map((file, index) => {
                const preview = getFilePreview(file)
                return (
                  <div key={index} className="file-chip">
                    {preview && (
                      <img 
                        src={preview} 
                        alt={file.name} 
                        className="file-preview"
                      />
                    )}
                    <span className="file-name">{file.name}</span>
                    <button 
                      type="button"
                      className="file-remove"
                      onClick={() => removeFile(index)}
                    >
                      ×
                    </button>
                  </div>
                )
              })}
            </div>
          )}
          
          <input 
            aria-label="Message" 
            placeholder="Try: Plan my study schedule" 
            value={input} 
            onChange={(e) => setInput(e.target.value)}
            disabled={isLoading}
          />
        </div>
        
        <button className="btn btn-accent" type="submit" disabled={isLoading}>
          {isLoading ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  )
}
