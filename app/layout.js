import '../styles/globals.css'

export const metadata = {
  title: 'HoosGotTime',
  description: 'A minimal Next.js scaffold',
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <header style={{ padding: '1rem', borderBottom: '1px solid #eee' }}>
          <h1>HoosGotTime</h1>
        </header>
        <main style={{ padding: '1rem' }}>{children}</main>
        <footer style={{ padding: '1rem', borderTop: '1px solid #eee' }}>
          Built with Next.js
        </footer>
      </body>
    </html>
  )
}
