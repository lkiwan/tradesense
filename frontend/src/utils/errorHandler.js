import toast from 'react-hot-toast'

// User-friendly error messages
const ERROR_MESSAGES = {
  // Network errors
  'Network Error': 'Unable to connect to the server. Please check your internet connection.',
  'timeout': 'Request timed out. Please try again.',

  // Auth errors
  'Invalid credentials': 'Incorrect email or password. Please try again.',
  'Token expired': 'Your session has expired. Please log in again.',
  'Unauthorized': 'You are not authorized to perform this action.',

  // Trade errors
  'Insufficient balance': 'You do not have enough balance for this trade.',
  'Trade not found': 'This trade could not be found.',
  'Trade is already closed': 'This trade has already been closed.',
  'Could not get price': 'Unable to fetch the current price. Please try again.',

  // Challenge errors
  'No active challenge': 'You do not have an active challenge. Please purchase one first.',
  'Challenge not found': 'Challenge not found.',

  // Payment errors
  'Payment failed': 'Payment could not be processed. Please try again.',
  'Invalid payment': 'Invalid payment information.',

  // General errors
  'Server error': 'Something went wrong on our end. Please try again later.',
  'Validation error': 'Please check your input and try again.',
}

// Translate API error to user-friendly message
export const getErrorMessage = (error) => {
  // Check if it's an Axios error with response
  if (error.response) {
    const { status, data } = error.response

    // Get error message from response
    const serverMessage = data?.error || data?.message || ''

    // Check for known error messages
    for (const [key, value] of Object.entries(ERROR_MESSAGES)) {
      if (serverMessage.toLowerCase().includes(key.toLowerCase())) {
        return value
      }
    }

    // HTTP status code based messages
    switch (status) {
      case 400:
        return serverMessage || 'Invalid request. Please check your input.'
      case 401:
        return 'Please log in to continue.'
      case 403:
        return 'You do not have permission to perform this action.'
      case 404:
        return serverMessage || 'The requested resource was not found.'
      case 422:
        return serverMessage || 'Please check your input and try again.'
      case 429:
        return 'Too many requests. Please wait a moment and try again.'
      case 500:
      case 502:
      case 503:
        return 'Server is temporarily unavailable. Please try again later.'
      default:
        return serverMessage || 'An unexpected error occurred.'
    }
  }

  // Network errors
  if (error.message === 'Network Error') {
    return ERROR_MESSAGES['Network Error']
  }

  // Timeout
  if (error.code === 'ECONNABORTED') {
    return ERROR_MESSAGES['timeout']
  }

  // Default fallback
  return error.message || 'An unexpected error occurred.'
}

// Show error toast with user-friendly message
export const showErrorToast = (error, customMessage = null) => {
  const message = customMessage || getErrorMessage(error)
  toast.error(message, {
    duration: 4000,
    position: 'top-center',
  })
}

// Show success toast
export const showSuccessToast = (message) => {
  toast.success(message, {
    duration: 3000,
    position: 'top-center',
  })
}

// Log error for debugging (only in development)
export const logError = (error, context = '') => {
  if (import.meta.env.DEV) {
    console.group(`Error: ${context}`)
    console.error('Error object:', error)
    if (error.response) {
      console.error('Response data:', error.response.data)
      console.error('Response status:', error.response.status)
    }
    console.groupEnd()
  }
}

export default {
  getErrorMessage,
  showErrorToast,
  showSuccessToast,
  logError,
}
