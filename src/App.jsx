import AppLayout from '@/components/layout/AppLayout'
import { useAppStore } from '@/store/appStore'
import Dashboard from '@/pages/Dashboard'
import UploadData from '@/pages/UploadData'
import Analytics from '@/pages/Analytics'
import Alerts from '@/pages/Alerts'
import Agents from '@/pages/Agents'
import Outputs from '@/pages/Outputs'

const PAGE_MAP = {
  dashboard: Dashboard,
  upload: UploadData,
  analytics: Analytics,
  alerts: Alerts,
  agents: Agents,
  outputs: Outputs,
}

export default function App() {
  const activePage = useAppStore((s) => s.activePage)
  const PageComponent = PAGE_MAP[activePage] || Dashboard

  return (
    <AppLayout>
      <PageComponent />
    </AppLayout>
  )
}
