import type { CreditCardBrand } from '../types'

export interface CardIssuer {
  name: string
  brand: CreditCardBrand
}

export const COMMON_CARD_ISSUERS: CardIssuer[] = [
  // Major Banks
  { name: 'American Express', brand: 'amex' },
  { name: 'Bank of America', brand: 'visa' },
  { name: 'Capital One', brand: 'mastercard' },
  { name: 'Chase', brand: 'visa' },
  { name: 'Citi / Citibank', brand: 'visa' },
  { name: 'Discover', brand: 'discover' },
  { name: 'U.S. Bank', brand: 'visa' },
  { name: 'Wells Fargo', brand: 'visa' },

  // Credit Unions & Regional Banks
  { name: 'Navy Federal Credit Union', brand: 'visa' },
  { name: 'Pentagon Federal Credit Union', brand: 'visa' },
  { name: 'USAA', brand: 'visa' },

  // Store Cards & Other Issuers
  { name: 'Amazon', brand: 'visa' },
  { name: 'Apple Card', brand: 'mastercard' },
  { name: 'Barclays', brand: 'mastercard' },
  { name: 'Costco', brand: 'visa' },
  { name: 'Synchrony Bank', brand: 'visa' },
  { name: 'TD Bank', brand: 'visa' },

  // Popular Card Programs
  { name: 'Chase Sapphire', brand: 'visa' },
  { name: 'Chase Freedom', brand: 'visa' },
  { name: 'Capital One Venture', brand: 'mastercard' },
  { name: 'Capital One Quicksilver', brand: 'mastercard' },
  { name: 'Citi Double Cash', brand: 'mastercard' },
  { name: 'Amex Gold', brand: 'amex' },
  { name: 'Amex Platinum', brand: 'amex' },
  { name: 'Discover it', brand: 'discover' },
]

export function detectCardBrand(cardName: string): CreditCardBrand {
  const name = cardName.toLowerCase()

  // Check for brand keywords in card name
  if (name.includes('visa')) return 'visa'
  if (name.includes('mastercard') || name.includes('master card')) return 'mastercard'
  if (name.includes('amex') || name.includes('american express')) return 'amex'
  if (name.includes('discover')) return 'discover'

  // Common card issuers and their typical brands
  // Chase
  if (name.includes('chase')) {
    if (name.includes('sapphire') || name.includes('freedom') || name.includes('slate')) return 'visa'
    return 'visa' // Most Chase cards are Visa
  }

  // Capital One
  if (name.includes('capital one') || name.includes('venture') || name.includes('quicksilver')) {
    return 'mastercard' // Most Capital One cards are Mastercard
  }

  // Citi
  if (name.includes('citi') || name.includes('costco')) {
    return 'visa' // Most Citi cards are Visa
  }

  // Bank of America
  if (name.includes('bank of america') || name.includes('boa')) {
    return 'visa' // Most BoA cards are Visa
  }

  // Wells Fargo
  if (name.includes('wells fargo')) {
    return 'visa' // Most Wells Fargo cards are Visa
  }

  return 'other'
}

export function getBrandDisplayName(brand: CreditCardBrand): string {
  switch (brand) {
    case 'visa':
      return 'Visa'
    case 'mastercard':
      return 'Mastercard'
    case 'amex':
      return 'American Express'
    case 'discover':
      return 'Discover'
    case 'other':
      return 'Other'
    default:
      return 'Other'
  }
}

export function getIssuerBrand(issuerName: string): CreditCardBrand {
  const issuer = COMMON_CARD_ISSUERS.find(i => i.name === issuerName)
  return issuer?.brand || 'other'
}
