import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { App } from 'antd'
import { useAuth } from './AuthContext'

/**
 * 页面级权限守卫：直接访问无权限页面时 Toast 提示并回退首页
 */
export default function RequirePerm({ perm, children }) {
  const { hasPerm } = useAuth()
  const { message } = App.useApp()
  const allowed = !perm || hasPerm(perm)

  useEffect(() => {
    if (!allowed) message.warning('你没有访问该页面的权限')
  }, [allowed, message])

  if (!allowed) return <Navigate to="/home" replace />
  return children
}
