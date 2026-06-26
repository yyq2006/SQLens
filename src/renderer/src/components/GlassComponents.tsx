import type { ReactNode } from 'react'

/** CSS 玻璃按钮 - 避免 LiquidGlass SVG 拦截点击事件 */
export function GlassButton({
  children,
  className = '',
  disabled,
  onClick,
}: {
  children: ReactNode
  className?: string
  disabled?: boolean
  onClick?: () => void
}): JSX.Element {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`relative overflow-hidden px-4 py-2 text-sm font-medium rounded-xl text-white cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 group ${className}`}
      style={{
        background: disabled
          ? 'rgba(148,163,184,0.3)'
          : 'linear-gradient(135deg, rgba(37,99,235,0.9), rgba(29,78,216,0.95))',
        boxShadow: disabled
          ? 'none'
          : '0 4px 20px rgba(37,99,235,0.25), 0 1px 3px rgba(0,0,0,0.1)',
      }}
    >
      {/* 玻璃高光 */}
      <span className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity rounded-xl pointer-events-none" />
      {/* 内容 */}
      <span className="relative z-10 flex items-center gap-1.5">{children}</span>
    </button>
  )
}

/** CSS 红色玻璃按钮 */
export function GlassDangerButton({
  children,
  className = '',
  disabled,
  onClick,
}: {
  children: ReactNode
  className?: string
  disabled?: boolean
  onClick?: () => void
}): JSX.Element {
  return (
    <button
      disabled={disabled}
      onClick={onClick}
      className={`relative overflow-hidden px-3 py-2 text-sm font-medium rounded-xl text-white cursor-pointer transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:scale-100 group ${className}`}
      style={{
        background: disabled
          ? 'rgba(148,163,184,0.3)'
          : 'linear-gradient(135deg, rgba(239,68,68,0.85), rgba(220,38,38,0.9))',
        boxShadow: disabled
          ? 'none'
          : '0 4px 16px rgba(239,68,68,0.2)',
      }}
    >
      <span className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent opacity-60 group-hover:opacity-80 transition-opacity rounded-xl pointer-events-none" />
      <span className="relative z-10 flex items-center gap-1.5">{children}</span>
    </button>
  )
}
