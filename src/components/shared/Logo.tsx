import { cn } from '@/lib/utils'
import logoImage from '@/assets/screenshots/photo_2026-07-03_12-59-11-removebg-preview (1).png'

interface LogoProps {
  size?: number
  showWordmark?: boolean
  className?: string
}

export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  // A multiplier of 1.5 keeps the logo readable without making the header too thick
  const displaySize = size * 1.5;

  return (
    <div 
      className={cn(
        "relative flex items-center justify-center transition-transform duration-300 hover:scale-105", 
        className
      )} 
    >
      <img 
        src={logoImage} 
        alt="Logo" 
        className="w-auto object-contain drop-shadow-[0_0_15px_rgba(59,130,246,0.4)] transition-all duration-300 hover:drop-shadow-[0_0_25px_rgba(59,130,246,0.7)]"
        style={{ height: displaySize }}
      />
    </div>
  )
}

export function Logo({ size = 32, showWordmark = true, className }: LogoProps) {
  return (
    <div className={cn('flex items-center gap-3 cursor-pointer group', className)}>
      <LogoMark size={size} />
      {showWordmark && (
        <div 
          className="flex items-baseline" 
          style={{ fontFamily: "'Plus Jakarta Sans', 'Outfit', 'Inter', system-ui, sans-serif" }}
        >
          <span className="text-[24px] md:text-[28px] font-extrabold tracking-tight text-slate-900 dark:text-white transition-colors duration-300">
            app
          </span>
          <span className="text-[24px] md:text-[28px] font-extrabold tracking-tight text-blue-500 drop-shadow-[0_0_8px_rgba(59,130,246,0.3)] transition-all duration-300 group-hover:drop-shadow-[0_0_15px_rgba(59,130,246,0.6)] group-hover:text-blue-400">
            .plan
          </span>
        </div>
      )}
    </div>
  )
}
