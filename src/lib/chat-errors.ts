export interface ChatError {
  title: string;
  message: string;
  action: 'retry' | 'wait' | 'contact';
  retryable: boolean;
}

export function mapErrorToUserMessage(error: Error): ChatError {
  const msg = error.message?.toLowerCase() || '';

  // Rate limiting (Claude API 429)
  if (msg.includes('rate') || msg.includes('429')) {
    return {
      title: 'One moment, please',
      message:
        'Our service is temporarily overloaded. Please try again in a few seconds.',
      action: 'wait',
      retryable: true,
    };
  }

  // Auth / API key errors (401, 403)
  if (msg.includes('401') || msg.includes('403') || msg.includes('api_key') || msg.includes('authentication')) {
    return {
      title: 'Service unavailable',
      message:
        'Our analysis service is momentarily unavailable. We invite you to contact a MetLife advisor directly.',
      action: 'contact',
      retryable: false,
    };
  }

  // Network / timeout errors
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout') || msg.includes('failed to fetch')) {
    return {
      title: 'Connection issue',
      message:
        'The connection was interrupted. Please check your internet connection and try again.',
      action: 'retry',
      retryable: true,
    };
  }

  // Claude overloaded (529)
  if (msg.includes('overloaded') || msg.includes('529')) {
    return {
      title: 'High demand',
      message:
        'Our assistant is experiencing high demand right now. Please try again in a moment.',
      action: 'wait',
      retryable: true,
    };
  }

  // Stream disconnected mid-response
  if (msg.includes('disconnect') || msg.includes('abort')) {
    return {
      title: 'Response interrupted',
      message:
        'The response was interrupted. You can resend your request.',
      action: 'retry',
      retryable: true,
    };
  }

  // Server error (500)
  if (msg.includes('500') || msg.includes('internal server error')) {
    return {
      title: 'Processing error',
      message:
        'A technical issue occurred. Please try again in a few moments.',
      action: 'retry',
      retryable: true,
    };
  }

  // Default fallback
  return {
    title: 'An error occurred',
    message:
      'We were unable to process your request. Please try again or contact a MetLife advisor.',
    action: 'retry',
    retryable: true,
  };
}
