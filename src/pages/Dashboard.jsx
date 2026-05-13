import { LayoutDashboard } from 'lucide-react'
import Placeholder from './Placeholder'

export default function Dashboard() {
  return (
    <Placeholder
      icon={LayoutDashboard}
      title="Dashboard"
      description="Executive summary — KPIs, variance charts, and anomaly highlights will appear here once data is uploaded."
    />
  )
}
