import '../styles/globals.css'

export const metadata = {
  title: 'HoosGotTime',
  description: 'A minimal Next.js scaffold',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="app-shell">
          <header className="app-header">
            <div className="brand">
              <div className="logo">HGT</div>
              <h1 className="brand-title">HoosGotTime</h1>
            </div>
            <nav className="top-nav">
              <a className="nav-link">Home</a>
              <a className="nav-link">Docs</a>
            </nav>
          </header>

          <main className="app-main">{children}</main>

          <footer className="app-footer">Built with Next.js</footer>
        </div>
      </body>
    </html>
  )
}
