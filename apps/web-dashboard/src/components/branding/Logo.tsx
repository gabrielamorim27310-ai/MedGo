import { cn } from '@/lib/utils'

interface LogoProps {
  className?: string
  /** Tamanho do símbolo em pixels */
  size?: number
  /** Exibe o nome "Acolhe" ao lado do símbolo */
  withWordmark?: boolean
  /** Versão para superfícies escuras (sidebar) */
  onDark?: boolean
}

/**
 * Símbolo da Acolhe: a senha de guichê reimaginada como um cartão de
 * vidro — tile translúcido com picotes laterais e a cruz de
 * acolhimento em gradiente acqua.
 */
export function Logo({ className, size = 36, withWordmark = false, onDark = false }: LogoProps) {
  return (
    <span className={cn('inline-flex items-center gap-2.5', className)}>
      <svg
        width={size}
        height={size}
        viewBox="0 0 48 48"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="acolhe-glass" x1="8" y1="6" x2="40" y2="42" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FFFFFF" stopOpacity="0.75" />
            <stop offset="1" stopColor="#D7F3EF" stopOpacity="0.35" />
          </linearGradient>
          <linearGradient id="acolhe-cross" x1="24" y1="13" x2="24" y2="35" gradientUnits="userSpaceOnUse">
            <stop stopColor="#2EC4B0" />
            <stop offset="1" stopColor="#0E7268" />
          </linearGradient>
          <linearGradient id="acolhe-amber" x1="16" y1="7" x2="32" y2="10" gradientUnits="userSpaceOnUse">
            <stop stopColor="#FCD34D" />
            <stop offset="1" stopColor="#F59E0B" />
          </linearGradient>
        </defs>

        {/* Cartão de vidro (senha de guichê) */}
        <rect
          x="7"
          y="5"
          width="34"
          height="38"
          rx="9"
          fill="url(#acolhe-glass)"
          stroke={onDark ? '#BFE8E2' : '#FFFFFF'}
          strokeOpacity={onDark ? 0.5 : 0.9}
          strokeWidth="1.4"
        />

        {/* Picotes laterais do ticket */}
        <circle cx="7" cy="24" r="2.4" fill={onDark ? '#0B3B36' : '#E8F6F3'} stroke={onDark ? '#BFE8E2' : '#FFFFFF'} strokeOpacity="0.6" strokeWidth="1" />
        <circle cx="41" cy="24" r="2.4" fill={onDark ? '#0B3B36' : '#E8F6F3'} stroke={onDark ? '#BFE8E2' : '#FFFFFF'} strokeOpacity="0.6" strokeWidth="1" />

        {/* Fita âmbar no topo */}
        <rect x="17" y="8" width="14" height="2.6" rx="1.3" fill="url(#acolhe-amber)" />

        {/* Cruz de acolhimento */}
        <path
          d="M20.6 14.5 h6.8 a1.6 1.6 0 0 1 1.6 1.6 v3.7 h3.7 a1.6 1.6 0 0 1 1.6 1.6 v6.8 a1.6 1.6 0 0 1 -1.6 1.6 H29 v3.7 a1.6 1.6 0 0 1 -1.6 1.6 h-6.8 a1.6 1.6 0 0 1 -1.6 -1.6 v-3.7 h-3.7 a1.6 1.6 0 0 1 -1.6 -1.6 v-6.8 a1.6 1.6 0 0 1 1.6 -1.6 H19 v-3.7 a1.6 1.6 0 0 1 1.6 -1.6 z"
          fill="url(#acolhe-cross)"
        />

        {/* Reflexo diagonal do vidro */}
        <path
          d="M12 5 L26 5 L14 43 L7 43 L7 20 Z"
          fill="#FFFFFF"
          opacity={onDark ? 0.10 : 0.22}
          clipPath="inset(0 round 9)"
        />
      </svg>

      {withWordmark && (
        <span
          className={cn(
            'font-display text-2xl font-semibold leading-none tracking-tight',
            onDark ? 'text-[#EAF7F4]' : 'text-foreground'
          )}
        >
          Acolhe
        </span>
      )}
    </span>
  )
}
