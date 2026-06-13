import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Input, Button, App, Divider, Select, Tag } from 'antd'
import { UserOutlined, LockOutlined, WechatOutlined } from '@ant-design/icons'

import { useAuth, DEMO_IDENTITIES } from '../../auth/AuthContext'
import { userById } from '../../mock/org'
import { roleById } from '../../mock/rbac'

import './login.css'

export default function LoginPage() {
  const navigate = useNavigate()
  const location = useLocation()
  const { message } = App.useApp()
  const { login } = useAuth()

  const from = location.state?.from || '/home'

  const [account, setAccount] = useState('gaokui@okgroup.com')
  const [password, setPassword] = useState('demo123456')
  const [identity, setIdentity] = useState('u-gao')

  const doLogin = (uid) => {
    const u = userById(uid)
    if (!u) {
      message.error('账号或登录方式异常')
      return
    }
    if (u.status !== 'active') {
      message.error('该账号已离职 / 停用，无法登录')
      return
    }
    login(uid)
    const r = roleById(u.role_id)
    message.success(`欢迎回来，${u.name}，${r?.name}`)
    navigate(from, { replace: true })
  }

  const handlePasswordLogin = () => {
    if (!account.trim() || !password.trim()) {
      message.error('请输入账号和密码')
      return
    }
    doLogin(identity)
  }

  const handleWechatLogin = () => {
    message.loading({ content: '正在发起企业微信授权...', key: 'wx', duration: 0.8 })
    setTimeout(() => {
      message.destroy('wx')
      doLogin(identity)
    }, 850)
  }

  return (
    <div className="gb-login">
      <div className="gb-login-left">
        <div className="gb-login-brand">
          <div className="gb-login-logo">G</div>
          <div>
            <div className="gb-login-brand-name">G-Builder OS</div>
            <div className="gb-login-brand-sub">一站式营销平台</div>
          </div>
        </div>
        <div className="gb-login-slogan">
          <h1>以品质赋能全球建筑空间<br />以平台孵化未来创业领袖</h1>
        </div>
        <div className="gb-login-foot">© 2026 敬城集团 · G-Builder OS V1.1 演示环境</div>
      </div>

      <div className="gb-login-right">
        <div className="gb-login-card">
          <h2 className="gb-login-title">登录营销 GOS</h2>
          <p className="gb-login-desc">使用企业账号登录，或一键企业微信登录</p>

          <div className="gb-login-field">
            <Input
              size="large"
              prefix={<UserOutlined style={{ color: 'var(--gb-text-muted)' }} />}
              placeholder="企业账号"
              value={account}
              onChange={(e) => setAccount(e.target.value)}
            />
          </div>
          <div className="gb-login-field">
            <Input.Password
              size="large"
              prefix={<LockOutlined style={{ color: 'var(--gb-text-muted)' }} />}
              placeholder="密码"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onPressEnter={handlePasswordLogin}
            />
          </div>

          <div className="gb-login-field">
            <div className="gb-login-demo-label">
              演示身份 <Tag color="blue" style={{ marginLeft: 4 }}>Demo</Tag>
            </div>
            <Select
              size="large"
              value={identity}
              onChange={setIdentity}
              style={{ width: '100%' }}
              options={DEMO_IDENTITIES.map((d) => ({ value: d.userId, label: d.label }))}
            />
            <div className="gb-login-demo-hint">
              选择不同身份登录，可体验菜单隐藏、操作权限和数据范围差异。
            </div>
          </div>

          <Button type="primary" size="large" block onClick={handlePasswordLogin} style={{ marginTop: 8 }}>
            登录
          </Button>

          <Divider plain style={{ color: 'var(--gb-text-muted)', fontSize: 12 }}>或</Divider>

          <Button
            size="large"
            block
            icon={<WechatOutlined style={{ color: '#07C160' }} />}
            onClick={handleWechatLogin}
          >
            企业微信登录
          </Button>
        </div>
      </div>
    </div>
  )
}
