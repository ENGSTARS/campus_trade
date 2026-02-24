import { useNavigate } from 'react-router-dom'
import { EmptyState } from '@/components/ui/EmptyState'

function NotFoundPage() {
  const navigate = useNavigate()

  return (
    <EmptyState
      title="Page not found"
      description="The page you requested does not exist."
      actionLabel="Back to home"
      onAction={() => navigate('/')}
    />
  )
}

export default NotFoundPage
