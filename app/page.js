import ChatClient from '../components/ChatClient'

export default function Home() {
  return (
    <div className="home-wrap">
      <div className="chat-card">
        <aside className="sidebar">
          <div className="sidebar-brand">HoosGotTime</div>

          <div className="examples">
            <h3>Examples</h3>
            <button className="example">Create a study schedule for 2 weeks</button>
            <button className="example">Plan a weekend project</button>
            <button className="example">Suggest time blocks for productivity</button>
          </div>

          <div className="footer-help">3 packages need funding · Learn more</div>
        </aside>

        {/* ChatClient is a Client Component — keeps event handlers out of Server Components */}
        <ChatClient />
      </div>
    </div>
  )
}
