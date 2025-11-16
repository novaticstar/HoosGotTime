"use client"
import React, { useEffect, useState } from 'react'

export default function CalendarView({ userId, refreshTrigger }) {
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(new Date())

  async function fetchEvents() {
    try {
      console.log('Fetching events for userId:', userId)
      const res = await fetch(`/api/events?userId=${userId}`)
      const data = await res.json()
      
      console.log('Events received:', data)
      
      const formattedEvents = data.events.map(event => ({
        id: event.id,
        title: event.title,
        start: new Date(event.start),
        end: new Date(event.end),
        description: event.description
      }))
      
      console.log('Formatted events:', formattedEvents)
      setEvents(formattedEvents)
      setLoading(false)
    } catch (error) {
      console.error('Failed to fetch events:', error)
      setEvents([])
      setLoading(false)
    }
  }

  useEffect(() => {
    if (userId) {
      fetchEvents()
    }
  }, [userId, refreshTrigger])

  async function handleDeleteEvent(eventId) {
    if (confirm('Delete this event?')) {
      try {
        await fetch(`/api/events?eventId=${eventId}&userId=${userId}`, {
          method: 'DELETE'
        })
        fetchEvents()
      } catch (error) {
        console.error('Failed to delete event:', error)
      }
    }
  }

  function formatTime(date) {
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    })
  }

  function formatDate(date) {
    return date.toLocaleDateString('en-US', { 
      weekday: 'short',
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    })
  }

  function getDayStart(date) {
    const d = new Date(date)
    d.setHours(0, 0, 0, 0)
    return d
  }

  function getDayEnd(date) {
    const d = new Date(date)
    d.setHours(23, 59, 59, 999)
    return d
  }

  // Group events by date
  const eventsByDate = events.reduce((acc, event) => {
    const dateKey = event.start.toDateString()
    if (!acc[dateKey]) {
      acc[dateKey] = []
    }
    acc[dateKey].push(event)
    return acc
  }, {})

  // Sort dates
  const sortedDates = Object.keys(eventsByDate).sort((a, b) => 
    new Date(a) - new Date(b)
  )

  // Calculate free time blocks for a given day
  function getFreeTimeBlocks(dayEvents) {
    if (dayEvents.length === 0) return []
    
    const sortedEvents = [...dayEvents].sort((a, b) => a.start - b.start)
    const freeBlocks = []
    const dayStart = getDayStart(sortedEvents[0].start)
    dayStart.setHours(8, 0, 0, 0) // Start day at 8 AM
    const dayEnd = getDayEnd(sortedEvents[0].start)
    dayEnd.setHours(22, 0, 0, 0) // End day at 10 PM

    // Free time before first event
    if (sortedEvents[0].start > dayStart) {
      freeBlocks.push({
        start: dayStart,
        end: sortedEvents[0].start
      })
    }

    // Free time between events
    for (let i = 0; i < sortedEvents.length - 1; i++) {
      const gap = sortedEvents[i + 1].start - sortedEvents[i].end
      if (gap > 0) {
        freeBlocks.push({
          start: sortedEvents[i].end,
          end: sortedEvents[i + 1].start
        })
      }
    }

    // Free time after last event
    if (sortedEvents[sortedEvents.length - 1].end < dayEnd) {
      freeBlocks.push({
        start: sortedEvents[sortedEvents.length - 1].end,
        end: dayEnd
      })
    }

    return freeBlocks
  }

  if (loading) {
    return (
      <div className="calendar-container">
        <div className="calendar-header">
          <h2>Schedule</h2>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-2)' }}>
          Loading schedule...
        </div>
      </div>
    )
  }

  if (events.length === 0) {
    return (
      <div className="calendar-container">
        <div className="calendar-header">
          <h2>Schedule</h2>
        </div>
        <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--muted-2)' }}>
          No events scheduled yet. Start chatting to create your schedule!
        </div>
      </div>
    )
  }

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <h2>Schedule</h2>
        <span className="event-count">{events.length} event{events.length !== 1 ? 's' : ''}</span>
      </div>
      
      <div className="schedule-view">
        {sortedDates.map(dateKey => {
          const dayEvents = eventsByDate[dateKey].sort((a, b) => a.start - b.start)
          const freeBlocks = getFreeTimeBlocks(dayEvents)
          const date = new Date(dateKey)

          return (
            <div key={dateKey} className="day-block">
              <div className="day-header">
                {formatDate(date)}
              </div>
              
              <div className="timeline">
                {dayEvents.map((event, idx) => {
                  const prevFreeBlock = freeBlocks[idx]
                  
                  return (
                    <React.Fragment key={event.id}>
                      {/* Free time block before this event */}
                      {prevFreeBlock && (
                        <div className="free-time-block">
                          <div className="time-range">
                            {formatTime(prevFreeBlock.start)} - {formatTime(prevFreeBlock.end)}
                          </div>
                          <div className="free-label">Free time</div>
                        </div>
                      )}
                      
                      {/* Scheduled event */}
                      <div className="event-block">
                        <div className="event-time">
                          {formatTime(event.start)} - {formatTime(event.end)}
                        </div>
                        <div className="event-content">
                          <div className="event-title">{event.title}</div>
                          {event.description && (
                            <div className="event-description">{event.description}</div>
                          )}
                        </div>
                        <button 
                          className="delete-btn"
                          onClick={() => handleDeleteEvent(event.id)}
                          title="Delete event"
                        >
                          ×
                        </button>
                      </div>
                    </React.Fragment>
                  )
                })}
                
                {/* Free time after last event */}
                {freeBlocks[dayEvents.length] && (
                  <div className="free-time-block">
                    <div className="time-range">
                      {formatTime(freeBlocks[dayEvents.length].start)} - {formatTime(freeBlocks[dayEvents.length].end)}
                    </div>
                    <div className="free-label">Free time</div>
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
