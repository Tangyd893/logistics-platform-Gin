import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api, { ResultDTO } from '@/lib/api'
import { useAuthStore } from '@/store/auth'

interface LoginVO {
  token: string
  user: {
    id: number
    username: string
    displayName: string
    roleCode: string
    avatar: string | null
  }
}

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const login = useAuthStore((s) => s.login)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    try {
      const res = await api.post<ResultDTO<LoginVO>>('/auth/login', { username, password })
      if (res.data.code === 200) {
        login(res.data.data.token, res.data.data.user)
        navigate('/')
      } else {
        setError(res.data.message || '登录失败')
      }
    } catch (err: any) {
      setError(err.response?.data?.message || '网络错误')
    }
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', backgroundColor: '#f1f5f9' }}>
      <div style={{ background: 'white', padding: '2.5rem', borderRadius: '0.75rem', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', width: '100%', maxWidth: '400px' }}>
        <h1 style={{ fontSize: '1.5rem', fontWeight: 'bold', textAlign: 'center', marginBottom: '0.25rem', color: '#1e293b' }}>
          综合物流管理系统
        </h1>
        <p style={{ textAlign: 'center', color: '#64748b', marginBottom: '2rem', fontSize: '0.875rem' }}>
          Logistics Management System
        </p>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>用户名</label>
            <input
              type="text"
              className="input-field"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="请输入用户名"
              required
            />
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', fontSize: '0.875rem', fontWeight: '500', marginBottom: '0.5rem', color: '#374151' }}>密码</label>
            <input
              type="password"
              className="input-field"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码"
              required
            />
          </div>
          {error && (
            <div style={{ padding: '0.75rem', backgroundColor: '#fef2f2', color: '#dc2626', borderRadius: '0.375rem', marginBottom: '1rem', fontSize: '0.875rem' }}>
              {error}
            </div>
          )}
          <button type="submit" className="btn-primary" style={{ width: '100%', padding: '0.625rem' }}>
            登录
          </button>
        </form>
        <div style={{ marginTop: '1.5rem', padding: '0.75rem', backgroundColor: '#f8fafc', borderRadius: '0.375rem', fontSize: '0.8rem', color: '#64748b' }}>
          演示账号：admin / admin123
        </div>
      </div>
    </div>
  )
}
