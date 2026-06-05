import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from './AuthContext'

/**
 * 登录守卫：未登录跳转登录页（带 from 以便登录后回跳）
 */
export default function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth()
  const location = useLocation()
  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname + location.search }} />
  }
  return children
}
