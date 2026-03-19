export const PAYMENT_CONFIG = {
  UPI_ID: 'Q544369675@ybl',
  MERCHANT_NAME: 'Kunal',
  CURRENCY: 'INR',
  STORE_NAME: 'Pehnava by Neha'
};

/**
 * Generates a standard UPI Payment URL
 * Structure: upi://pay?cu=INR&pa={upiId}&pn={name}&tn={note}&am={amount}
 */
export function generateUPIUrl(amount: number, note: string = '') {
  const { UPI_ID, MERCHANT_NAME, CURRENCY } = PAYMENT_CONFIG;
  
  // Format amount to 2 decimal places
  const formattedAmount = amount.toFixed(2);
  
  // Construct the URL following the user's specific structure
  return `upi://pay?cu=${CURRENCY}&pa=${UPI_ID}&pn=${encodeURIComponent(MERCHANT_NAME)}&tn=${encodeURIComponent(note)}&am=${formattedAmount}`;
}
