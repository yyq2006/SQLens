import type { ReactNode } from 'react'

/** 渐变发光按钮 */
export function GlassButton({
  children, className = '', disabled, onClick
}: {
  children: ReactNode; className?: string; disabled?: boolean; onClick?: () => void
}): JSX.Element {
  return (
    <button disabled={disabled} onClick={onClick}
      className={`relative overflow-hidden px-4 py-2 text-sm font-medium rounded-xl text-white cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100 ${className}`}
      style={{
        background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
        boxShadow: disabled ? 'none' : '0 2px 12px rgba(37,99,235,0.3)',
      }}
    >
      <span className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent rounded-xl pointer-events-none" />
      <span className="relative z-10 flex items-center gap-1.5 justify-center">{children}</span>
    </button>
  )
}

/** 红色按钮 */
export function GlassDangerButton({
  children, className = '', disabled, onClick
}: {
  children: ReactNode; className?: string; disabled?: boolean; onClick?: () => void
}): JSX.Element {
  return (
    <button disabled={disabled} onClick={onClick}
      className={`relative overflow-hidden px-3 py-2 text-sm font-medium rounded-xl text-white cursor-pointer transition-all duration-200 hover:brightness-110 active:scale-[0.97] disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
      style={{
        background: 'linear-gradient(135deg, #ef4444, #dc2626)',
        boxShadow: disabled ? 'none' : '0 2px 12px rgba(239,68,68,0.25)',
      }}
    >
      <span className="absolute inset-0 bg-gradient-to-b from-white/15 to-transparent rounded-xl pointer-events-none" />
      <span className="relative z-10 flex items-center gap-1.5 justify-center">{children}</span>
    </button>
  )
}
