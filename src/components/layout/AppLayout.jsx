import TopBar from './TopBar'
import Sidebar from './Sidebar'

export default function AppLayout({ children }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <TopBar />
      <div style={{ display: 'flex', flex: 1, paddingTop: 'var(--topbar-height)' }}>
        <Sidebar />
        <main
          style={{
            flex: 1,
            marginLeft: 'var(--sidebar-width)',
            background: 'var(--bg-base)',
            minHeight: 'calc(100vh - var(--topbar-height))',
            display: 'flex',
            flexDirection: 'column',
          }}
        >
          {children}
        </main>
      </div>
    </div>
  )
}
