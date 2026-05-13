import { Upload } from 'lucide-react'
import Placeholder from './Placeholder'

export default function UploadData() {
  return (
    <Placeholder
      icon={Upload}
      title="Upload Data"
      description="Upload your transactions, budget, payroll, and vendor files (CSV/Excel). Supports drag-and-drop with auto-parsing via PapaParse."
    />
  )
}
