import React from 'react'
import type { CreditCardBrand } from '../../types'

interface CreditCardLogoProps {
  brand: CreditCardBrand
  className?: string
  width?: number
  height?: number
}

function CreditCardLogo({ brand, className = '', width = 48, height = 32 }: CreditCardLogoProps) {
  const logos: Record<CreditCardBrand, JSX.Element> = {
    visa: (
      <svg viewBox="0 0 48 32" width={width} height={height} className={className}>
        <rect width="48" height="32" rx="4" fill="#1434CB" />
        <path
          d="M20.5 11h-3.2l-2 10h3.2l2-10zm9.8 6.5c0-2.7-3.7-2.8-3.7-4 0-.4.4-.8 1.2-.9.4 0 1.6-.1 2.8.5l.5-2.4c-.7-.3-1.6-.5-2.7-.5-2.9 0-4.9 1.5-4.9 3.7 0 1.6 1.4 2.5 2.5 3 1.1.6 1.5.9 1.5 1.4 0 .8-.9 1.1-1.8 1.1-1.5 0-2.3-.2-3.6-.8l-.5 2.5c.8.4 2.3.7 3.9.7 3.1 0 5.1-1.5 5.1-3.8zm7.3 3.5h2.8l-2.4-10h-2.6c-.6 0-1.1.3-1.3.8l-4.6 9.2h3.1l.6-1.7h3.8l.6 1.7zm-3.3-4l1.6-4.3.9 4.3h-2.5zm-10.8-6h-3l-3 10h3l3-10z"
          fill="white"
        />
      </svg>
    ),
    mastercard: (
      <svg viewBox="0 0 48 32" width={width} height={height} className={className}>
        <rect width="48" height="32" rx="4" fill="#EB001B" />
        <circle cx="18" cy="16" r="9" fill="#EB001B" />
        <circle cx="30" cy="16" r="9" fill="#F79E1B" />
        <path
          d="M24 9.5c-1.8 1.6-3 4-3 6.5s1.2 4.9 3 6.5c1.8-1.6 3-4 3-6.5s-1.2-4.9-3-6.5z"
          fill="#FF5F00"
        />
      </svg>
    ),
    amex: (
      <svg viewBox="0 0 48 32" width={width} height={height} className={className}>
        <rect width="48" height="32" rx="4" fill="#006FCF" />
        <path
          d="M8 12h3.5l.9 2.1.9-2.1H17v6.5l2.5-6.5h3l2.5 6.5V12h3.5v8h-5l-1-2.5-1 2.5h-5v-5.2l-2.2 5.2H11l-3-8z"
          fill="white"
        />
        <path
          d="M31 12h8v1.5h-6v1.5h6v1.5h-6v1.5h6V20h-8v-8z"
          fill="white"
        />
      </svg>
    ),
    discover: (
      <svg viewBox="0 0 48 32" width={width} height={height} className={className}>
        <rect width="48" height="32" rx="4" fill="#FF6000" />
        <path
          d="M28 16c0 2.8 2.2 5 5 5h15V11h-15c-2.8 0-5 2.2-5 5z"
          fill="#F68121"
        />
        <path
          d="M8 14h2.5c1.4 0 2.5 1.1 2.5 2.5S11.9 19 10.5 19H8v-5zm0 4h2c.8 0 1.5-.7 1.5-1.5S10.8 15 10 15H8v3zm4-4h1v5h-1v-5zm3.5 2.5c0-.8.5-1.5 1.3-1.5.5 0 .8.2 1 .5l-.7.5c-.1-.2-.3-.3-.5-.3-.4 0-.8.4-.8 1s.4 1 .8 1c.2 0 .4-.1.5-.3l.7.5c-.2.3-.5.5-1 .5-.8 0-1.3-.7-1.3-1.5zm4.5-1.5c.6 0 1 .3 1.3.7l-.8.5c-.1-.2-.3-.3-.5-.3-.2 0-.4.1-.4.3 0 .2.2.3.6.4.7.2 1.2.4 1.2 1.1 0 .6-.5 1-1.3 1-.6 0-1.1-.3-1.4-.8l.8-.5c.1.2.4.4.6.4.3 0 .5-.1.5-.3 0-.2-.2-.3-.6-.4-.7-.2-1.2-.4-1.2-1.1 0-.5.4-1 1.2-1z"
          fill="white"
        />
      </svg>
    ),
    other: (
      <svg viewBox="0 0 48 32" width={width} height={height} className={className}>
        <rect width="48" height="32" rx="4" fill="#6B7280" />
        <rect x="8" y="13" width="32" height="2" fill="white" />
        <rect x="8" y="17" width="20" height="2" fill="white" />
      </svg>
    ),
  }

  return logos[brand] || logos.other
}

export default CreditCardLogo
