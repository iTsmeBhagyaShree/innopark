/**
 * Formats a phone number string to a standard German/International format
 * Example: "01761234567" -> "+49 176 1234567"
 * @param {string} value 
 * @returns {string}
 */
export const formatPhoneNumber = (value) => {
  if (!value) return ''
  
  // Remove all non-numeric characters except +
  let cleaned = value.replace(/[^\d+]/g, '')
  
  // If it starts with 0 and no +, assume German and prepend +49
  if (cleaned.startsWith('0') && !cleaned.startsWith('00')) {
    cleaned = '+49' + cleaned.substring(1)
  }
  
  // If it starts with 00, replace with +
  if (cleaned.startsWith('00')) {
    cleaned = '+' + cleaned.substring(2)
  }
  
  // Add space after country code (+49) if present
  if (cleaned.startsWith('+49')) {
    if (cleaned.length > 3 && cleaned[3] !== ' ') {
      cleaned = cleaned.slice(0, 3) + ' ' + cleaned.slice(3)
    }
  }
  
  return cleaned
}

/**
 * Validates if the phone number is in a reasonable international format
 * @param {string} phone 
 * @returns {boolean}
 */
export const isValidPhone = (phone) => {
  if (!phone) return true // Allow empty
  const phoneRegex = /^\+?[0-9\s-]{8,20}$/
  return phoneRegex.test(phone)
}
