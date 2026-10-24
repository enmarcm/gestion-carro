import { useEffect, useId, useRef, type ReactNode, type ButtonHTMLAttributes, type InputHTMLAttributes, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { Loader2, X } from 'lucide-react'

export const cx = (...a: (string | false | null | undefined)[]) => a.filter(Boolean).join(' ')

export function Card({ className, children, ...p }: { className?: string; children: ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cx('neu p-5 min-w-0', className)} {...p}>{children}</div>
}

export function Button({ variant = 'primary', loading, className, children, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'soft' | 'danger'; loading?: boolean }) {
  return (
    <button
      {...p}
      disabled={p.disabled || loading}
      className={cx(
        'press inline-flex h-[52px] items-center justify-center gap-2 px-5 text-[15px]',
        variant === 'primary' && 'btn-primary',
        variant !== 'primary' && 'neu-sm font-bold',
        variant === 'danger' && 'btn-danger',
        className,
      )}
    >
      {loading && <Loader2 size={18} className="animate-spin" />}
      {children}
    </button>
  )
}

export function IconButton({ label, className, children, ...p }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string }) {
  return (
    <button aria-label={label} title={label} {...p} className={cx('press neu-sm grid h-11 w-11 shrink-0 place-items-center', className)}>
      {children}
    </button>
  )
}

export function Field({ label, error, hint, children, className }: { label: string; error?: string; hint?: ReactNode; children: (id: string, invalid: boolean) => ReactNode; className?: string }) {
  const id = useId()
  return (
    <div className={cx('min-w-0', className)}>
      <label htmlFor={id} className="mb-2 block px-1 text-[12px] font-bold uppercase tracking-wider text-[var(--muted)]">{label}</label>
      {children(id, !!error)}
      {error ? <p role="alert" className="mt-1.5 px-1 text-[12px] font-semibold text-[var(--bad)]">{error}</p> : hint ? <p className="mt-1.5 px-1 text-[12px] text-[var(--muted)]">{hint}</p> : null}
    </div>
  )
}

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'id'> & { id: string; invalid?: boolean }
export const TextInput = ({ invalid, className, ...p }: InputProps) => <input {...p} aria-invalid={invalid} className={cx('field', className)} />
export const NumInput = ({ invalid, className, ...p }: InputProps) => (
  <input {...p} type="text" inputMode="decimal" autoComplete="off" aria-invalid={invalid} className={cx('field', className)} />
)
export const DateInput = ({ invalid, className, ...p }: InputProps) => <input {...p} type="date" aria-invalid={invalid} className={cx('field', className)} />
export const TextArea = ({ invalid, className, ...p }: Omit<TextareaHTMLAttributes<HTMLTextAreaElement>, 'id'> & { id: string; invalid?: boolean }) => (
  <textarea rows={3} {...p} aria-invalid={invalid} className={cx('field', className)} />
)
export const Select = ({ invalid, className, children, ...p }: Omit<SelectHTMLAttributes<HTMLSelectElement>, 'id'> & { id: string; invalid?: boolean }) => (
  <select {...p} aria-invalid={invalid} className={cx('field pr-10 truncate', className)} style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%237890a8' stroke-width='3' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E\")", backgroundRepeat: 'no-repeat', backgroundPosition: 'right 14px center' }}>
    {children}
  </select>
)

export function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <button type="button" role="switch" aria-checked={checked} aria-label={label} onClick={() => onChange(!checked)} className="neu-in relative h-9 w-[68px] shrink-0 rounded-full p-1 transition">
      <span className={cx('absolute top-1 grid h-7 w-7 place-items-center rounded-full transition-all duration-200', checked ? 'left-[36px] btn-primary' : 'left-1 neu-sm')} style={checked ? undefined : { borderRadius: 999 }} />
    </button>
  )
}

export function Chip({ active, children, onClick }: { active?: boolean; children: ReactNode; onClick?: () => void }) {
  return (
    <button type="button" onClick={onClick} className={cx('press shrink-0 whitespace-nowrap rounded-full px-4 py-2 text-[13px] font-bold', active ? 'btn-primary' : 'neu-sm text-[var(--muted)]')} style={{ borderRadius: 999 }}>
      {children}
    </button>
  )
}

export function Sheet({ open, onClose, title, children, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; footer?: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    ref.current?.focus()
    return () => {
      document.body.style.overflow = prev
      window.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center" role="dialog" aria-modal="true" aria-label={title}>
      <div className="fade absolute inset-0 bg-[#2a4660]/30 backdrop-blur-[3px]" onClick={onClose} />
      <div ref={ref} tabIndex={-1} className="sheet relative flex max-h-[92dvh] w-full max-w-[520px] flex-col outline-none sm:max-h-[86dvh]" style={{ background: 'linear-gradient(160deg,#eef5fc,#dfeaf6)', borderRadius: '28px 28px 0 0', boxShadow: '0 -10px 40px rgba(60,90,130,.25)' }}>
        <div className="flex items-center justify-between gap-3 px-5 pb-3 pt-5">
          <h2 className="min-w-0 truncate text-[19px] font-bold">{title}</h2>
          <IconButton label="Cerrar" onClick={onClose}><X size={20} /></IconButton>
        </div>
        <div className="scroll-y min-h-0 flex-1 px-5 pb-4">{children}</div>
        {footer && <div className="pb-safe px-5 pt-3">{footer}</div>}
      </div>
    </div>
  )
}

export const Skeleton = ({ className }: { className?: string }) => <div className={cx('skeleton', className)} />

export function Empty({ icon, title, text }: { icon: ReactNode; title: string; text?: string }) {
  return (
    <div className="grid place-items-center gap-3 px-6 py-10 text-center">
      <div className="neu-in grid h-16 w-16 place-items-center rounded-full text-[var(--muted)]" style={{ borderRadius: 999 }}>{icon}</div>
      <p className="text-[16px] font-bold">{title}</p>
      {text && <p className="max-w-[260px] text-[13px] text-[var(--muted)]">{text}</p>}
    </div>
  )
}

export function ScreenHeader({ title, right, left }: { title: string; right?: ReactNode; left?: ReactNode }) {
  return (
    <header className="flex items-center justify-between gap-3 pb-4 pt-1">
      <div className="w-11 shrink-0">{left}</div>
      <h1 className="title-wide min-w-0 truncate text-center text-[13px] sm:text-[15px]">{title}</h1>
      <div className="flex w-11 shrink-0 justify-end">{right}</div>
    </header>
  )
}

export function StatusPill({ status }: { status: 'overdue' | 'soon' | 'ok' }) {
  const map = { overdue: ['Vencido', '#ef4444'], soon: ['Pronto', '#f59e0b'], ok: ['Al día', '#10b981'] } as const
  const [t, c] = map[status]
  return <span className="shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold" style={{ color: c, background: `${c}1f` }}>{t}</span>
}
