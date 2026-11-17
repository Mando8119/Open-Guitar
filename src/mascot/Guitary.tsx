import { useId } from 'react'
import type { MascotState } from '../types'
import './guitary.css'

interface GuitaryProps {
  state?: MascotState
  reducedMotion?: boolean
  intensity?: 'subtle' | 'full'
  className?: string
}

/** Original amber-bodied guitar guide; decorative motion never carries essential feedback. */
export function Guitary({
  state = 'idle',
  reducedMotion = false,
  intensity = 'subtle',
  className = '',
}: GuitaryProps) {
  const id = useId().replace(/:/g, '')
  const asleep = state === 'sleeping'
  const puzzled = state === 'confused' || state === 'thinking'
  const happy = state === 'celebrating' || state === 'encouraging' || state === 'greeting'
  return (
    <svg
      className={`guitary guitary--${state} guitary--${intensity} ${reducedMotion ? 'guitary--still' : ''} ${className}`}
      viewBox="0 0 240 280"
      role="img"
      aria-labelledby={`${id}-title`}
    >
      <title id={`${id}-title`}>Guitary, your guitar guide: {state}</title>
      <defs>
        <linearGradient id={`${id}-wood`} x1="0" x2="1" y2="1">
          <stop stopColor="#ffd28a" />
          <stop offset=".5" stopColor="#efa64a" />
          <stop offset="1" stopColor="#c56c2d" />
        </linearGradient>
        <linearGradient id={`${id}-neck`} x2="1" y2="0">
          <stop stopColor="#603a2c" />
          <stop offset=".5" stopColor="#956244" />
          <stop offset="1" stopColor="#603a2c" />
        </linearGradient>
      </defs>
      <ellipse
        className="guitary-shadow"
        cx="121"
        cy="259"
        rx="61"
        ry="9"
        fill="#091b1a"
        opacity=".24"
      />
      <g className="guitary-character">
        <g
          className="guitary-legs"
          fill="#563b30"
          stroke="#322c28"
          strokeWidth="3"
          strokeLinejoin="round"
        >
          <path d="M98 226 93 250 78 252Q71 260 84 261L104 261 111 229Z" />
          <path d="M134 228 139 251 155 252Q164 261 151 261L131 261 122 229Z" />
        </g>
        <g
          className="guitary-left-arm"
          fill="none"
          stroke="#bd7137"
          strokeWidth="10"
          strokeLinecap="round"
        >
          <path d="M73 171Q43 167 41 142" />
          <path d="m41 144-7-7m7 7 4-9" strokeWidth="5" />
        </g>
        <g
          className="guitary-right-arm"
          fill="none"
          stroke="#bd7137"
          strokeWidth="10"
          strokeLinecap="round"
        >
          <path d="M166 170Q193 171 197 148" />
          <path d="m197 149-4-10m4 10 8-6" strokeWidth="5" />
        </g>
        <g transform="rotate(5 121 100)">
          <path
            d="M107 108 106 37 132 37 132 108"
            fill={`url(#${id}-neck)`}
            stroke="#5d3c2e"
            strokeWidth="3"
          />
          <path
            d="m106 41-4-22q0-8 9-8h19q8 0 8 8l-5 22Z"
            fill="#b8773c"
            stroke="#593d2d"
            strokeWidth="3"
          />
          <g fill="#d5dcd0" stroke="#5d6258" strokeWidth="1.5">
            <rect x="95" y="17" width="9" height="6" rx="2" />
            <rect x="96" y="29" width="9" height="6" rx="2" />
            <rect x="137" y="17" width="9" height="6" rx="2" />
            <rect x="135" y="29" width="9" height="6" rx="2" />
          </g>
          <path d="M108 53h23m-23 12h23m-23 13h23m-23 13h23" stroke="#d9bd94" strokeWidth="2" />
        </g>
        <path
          d="M98 97C75 93 63 109 70 132Q76 145 66 160C39 199 67 241 119 241S199 199 174 161Q164 146 171 130C178 108 162 92 141 98Q120 108 98 97Z"
          fill={`url(#${id}-wood)`}
          stroke="#75452e"
          strokeWidth="3.5"
        />
        <path
          d="M96 107C78 103 74 116 80 130M70 181C58 209 83 229 102 230"
          fill="none"
          stroke="#ffe5b2"
          strokeWidth="5"
          strokeLinecap="round"
          opacity=".65"
        />
        <circle cx="120" cy="190" r="23" fill="#74442c" stroke="#f9d99c" strokeWidth="3" />
        <circle cx="120" cy="190" r="17" fill="#352d28" />
        <path
          d="M108 203v18m5-18v18m5-18v18m5-18v18m5-18v18m5-18v18"
          stroke="#d8c398"
          strokeWidth="1"
          opacity=".7"
        />
        <rect x="99" y="217" width="42" height="8" rx="3" fill="#654031" />
        <path d="M101 221h38" stroke="#e1c49a" strokeWidth="2" />
        <g className="guitary-face">
          <ellipse cx="89" cy="151" rx="9" ry="5" fill="#d37d4e" opacity=".65" />
          <ellipse cx="151" cy="151" rx="9" ry="5" fill="#d37d4e" opacity=".65" />
          {asleep ? (
            <path
              d="M94 140q6 6 12 0m28 0q6 6 12 0"
              fill="none"
              stroke="#3b322b"
              strokeWidth="3"
              strokeLinecap="round"
            />
          ) : (
            <g className="guitary-eyes" fill="#342e28">
              <ellipse cx="100" cy="140" rx="4" ry={happy ? 5 : 6} />
              <ellipse cx="140" cy="140" rx="4" ry="6" />
              <circle cx="101" cy="138" r="1.3" fill="#fff5dd" />
              <circle cx="141" cy="138" r="1.3" fill="#fff5dd" />
            </g>
          )}
          <path
            d={puzzled ? 'm92 128 15 2m27-5 13-3' : 'm93 128 12-1m30 0 12 1'}
            fill="none"
            stroke="#70452f"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
          <path
            d={
              asleep
                ? 'M117 157q3-4 6 0q0 5-3 5t-3-5'
                : puzzled
                  ? 'M113 159q7-4 14-1'
                  : happy
                    ? 'M108 154q12 18 24 0Z'
                    : 'M111 156q9 9 18 0'
            }
            fill={happy ? '#633c2c' : 'none'}
            stroke="#633c2c"
            strokeWidth="2.5"
            strokeLinecap="round"
          />
        </g>
        <path d="m153 111 8-7 9 3-3 12-11 2Z" fill="#9ed5bd" stroke="#4b8475" strokeWidth="2" />
        <g className="guitary-sparkles" fill="#9ed5bd">
          <path d="m40 76 3 8 8 3-8 3-3 8-3-8-8-3 8-3Z" />
          <path d="m194 93 3 6 6 3-6 3-3 6-3-6-6-3 6-3Z" />
        </g>
        {asleep && (
          <text x="166" y="99" fill="#9ed5bd" fontSize="20" fontFamily="sans-serif">
            z
          </text>
        )}
      </g>
    </svg>
  )
}

export default Guitary
