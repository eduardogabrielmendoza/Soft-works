/**
 * Email domain validation.
 * Validates that the email uses a known, real email provider domain.
 * This prevents typos like "gemail.com" or "gimeil.com".
 */

// Comprehensive list of real email provider domains
const VALID_EMAIL_DOMAINS: ReadonlySet<string> = new Set([
  // Google
  'gmail.com',
  'googlemail.com',
  // Microsoft
  'outlook.com',
  'outlook.es',
  'outlook.com.ar',
  'hotmail.com',
  'hotmail.com.ar',
  'hotmail.es',
  'live.com',
  'live.com.ar',
  'msn.com',
  // Yahoo
  'yahoo.com',
  'yahoo.com.ar',
  'yahoo.es',
  'ymail.com',
  'rocketmail.com',
  // Apple
  'icloud.com',
  'me.com',
  'mac.com',
  // ProtonMail
  'protonmail.com',
  'proton.me',
  'pm.me',
  // Other popular
  'aol.com',
  'zoho.com',
  'mail.com',
  'gmx.com',
  'gmx.net',
  'tutanota.com',
  'tuta.io',
  'fastmail.com',
  'hey.com',
  // Argentina ISPs
  'fibertel.com.ar',
  'arnet.com.ar',
  'speedy.com.ar',
  'ciudad.com.ar',
  'uolsinectis.com.ar',
  'sion.com',
  'fullzero.com.ar',
]);

// Common typos mapped to likely intended domain
const DOMAIN_TYPO_SUGGESTIONS: Record<string, string> = {
  'gemail.com': 'gmail.com',
  'gmai.com': 'gmail.com',
  'gmial.com': 'gmail.com',
  'gmal.com': 'gmail.com',
  'gmeil.com': 'gmail.com',
  'gimeil.com': 'gmail.com',
  'gmail.co': 'gmail.com',
  'gmail.con': 'gmail.com',
  'gamil.com': 'gmail.com',
  'gnail.com': 'gmail.com',
  'gmail.cm': 'gmail.com',
  'hotmal.com': 'hotmail.com',
  'hotmial.com': 'hotmail.com',
  'hotmai.com': 'hotmail.com',
  'hotmail.con': 'hotmail.com',
  'hotmil.com': 'hotmail.com',
  'hotamail.com': 'hotmail.com',
  'hitmail.com': 'hotmail.com',
  'outlok.com': 'outlook.com',
  'outllook.com': 'outlook.com',
  'outlook.con': 'outlook.com',
  'outloo.com': 'outlook.com',
  'yaho.com': 'yahoo.com',
  'yahooo.com': 'yahoo.com',
  'yahoo.con': 'yahoo.com',
  'yhaoo.com': 'yahoo.com',
  'iclod.com': 'icloud.com',
  'icloud.con': 'icloud.com',
  'protonmal.com': 'protonmail.com',
};

export interface EmailValidationResult {
  valid: boolean;
  error?: string;
  suggestion?: string;
}

/**
 * Validates an email address format and domain.
 * Returns an error message in Spanish if invalid.
 */
export function validateEmail(email: string): EmailValidationResult {
  const trimmed = email.trim().toLowerCase();

  // Basic format check
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) {
    return { valid: false, error: 'Ingresá un email válido.' };
  }

  const domain = trimmed.split('@')[1];

  // Check for known typo
  const suggestion = DOMAIN_TYPO_SUGGESTIONS[domain];
  if (suggestion) {
    const correctedEmail = trimmed.replace(`@${domain}`, `@${suggestion}`);
    return {
      valid: false,
      error: `El dominio "${domain}" no existe.`,
      suggestion: correctedEmail,
    };
  }

  // Check against whitelist of known real domains
  if (!VALID_EMAIL_DOMAINS.has(domain)) {
    return {
      valid: false,
      error: `El dominio "${domain}" no es reconocido. Usá un correo de un proveedor real (Gmail, Outlook, Yahoo, etc.).`,
    };
  }

  return { valid: true };
}
