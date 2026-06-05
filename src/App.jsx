import { RouterProvider } from 'react-router-dom'
import { router } from './router'
import { AuthProvider } from './auth/AuthContext'
import { TabsProvider } from './layouts/tabsState'

export default function App() {
  return (
    <AuthProvider>
      <TabsProvider>
        <RouterProvider router={router} />
      </TabsProvider>
    </AuthProvider>
  )
}
