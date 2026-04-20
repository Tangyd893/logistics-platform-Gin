import { useState } from 'react'

interface Column<T> {
  key: string
  label: string
  width?: string
  render?: (row: T) => React.ReactNode
}

interface TableProps<T> {
  columns: Column<T>[]
  data: T[]
  loading?: boolean
  emptyText?: string
}

export function Table<T extends Record<string, any>>({ columns, data, loading, emptyText = '暂无数据' }: TableProps<T>) {
  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#64748b' }}>加载中...</div>
  }
  if (!data.length) {
    return <div style={{ padding: '2rem', textAlign: 'center', color: '#94a3b8' }}>{emptyText}</div>
  }
  return (
    <div style={{ overflowX: 'auto' }}>
      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem' }}>
        <thead>
          <tr style={{ backgroundColor: '#f8fafc' }}>
            {columns.map((col) => (
              <th key={col.key} style={{ padding: '0.625rem 1rem', textAlign: 'left', fontWeight: '600', color: '#475569', borderBottom: '1px solid #e2e8f0', width: col.width }}>
                {col.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx} style={{ borderBottom: '1px solid #f1f5f9' }}>
              {columns.map((col) => (
                <td key={col.key} style={{ padding: '0.625rem 1rem', color: '#334155' }}>
                  {col.render ? col.render(row) : row[col.key]}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

interface PageHeaderProps {
  title: string
  subtitle?: string
  action?: React.ReactNode
}

export function PageHeader({ title, subtitle, action }: PageHeaderProps) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
      <div>
        <h1 style={{ fontSize: '1.125rem', fontWeight: 'bold', color: '#1e293b' }}>{title}</h1>
        {subtitle && <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.25rem' }}>{subtitle}</p>}
      </div>
      {action}
    </div>
  )
}

export function Card({ children, style, onClick }: { children: React.ReactNode; style?: React.CSSProperties; onClick?: () => void }) {
  return (
    <div style={{ backgroundColor: 'white', borderRadius: '0.75rem', boxShadow: '0 1px 3px rgba(0,0,0,0.1)', ...style }} onClick={onClick}>
      {children}
    </div>
  )
}

export function Badge({ variant = 'default', children }: { variant?: 'success' | 'warning' | 'danger' | 'default'; children: React.ReactNode }) {
  const colors: Record<string, { bg: string; color: string }> = {
    success: { bg: '#ecfdf5', color: '#059669' },
    warning: { bg: '#fffbeb', color: '#d97706' },
    danger: { bg: '#fef2f2', color: '#dc2626' },
    default: { bg: '#f1f5f9', color: '#475569' },
  }
  const { bg, color } = colors[variant]
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', padding: '0.125rem 0.5rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 500, backgroundColor: bg, color }}>
      {children}
    </span>
  )
}
