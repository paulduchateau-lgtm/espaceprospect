export interface ChatError {
  title: string;
  message: string;
  action: 'retry' | 'wait' | 'contact';
  retryable: boolean;
}

export function mapErrorToFrench(error: Error): ChatError {
  const msg = error.message?.toLowerCase() || '';

  // Rate limiting (Claude API 429)
  if (msg.includes('rate') || msg.includes('429')) {
    return {
      title: "Un instant, s'il vous plait",
      message:
        'Notre service est temporairement surchargé. Veuillez réessayer dans quelques secondes.',
      action: 'wait',
      retryable: true,
    };
  }

  // Auth / API key errors (401, 403)
  if (msg.includes('401') || msg.includes('403') || msg.includes('api_key') || msg.includes('authentication')) {
    return {
      title: 'Service indisponible',
      message:
        "Notre service d'analyse est momentanément indisponible. Nous vous invitons à contacter directement un conseiller MetLife.",
      action: 'contact',
      retryable: false,
    };
  }

  // Network / timeout errors
  if (msg.includes('network') || msg.includes('fetch') || msg.includes('timeout') || msg.includes('failed to fetch')) {
    return {
      title: 'Problème de connexion',
      message:
        'La connexion a été interrompue. Vérifiez votre connexion internet et réessayez.',
      action: 'retry',
      retryable: true,
    };
  }

  // Claude overloaded (529)
  if (msg.includes('overloaded') || msg.includes('529')) {
    return {
      title: 'Service en forte demande',
      message:
        'Notre assistant est très sollicité en ce moment. Veuillez réessayer dans un instant.',
      action: 'wait',
      retryable: true,
    };
  }

  // Stream disconnected mid-response
  if (msg.includes('disconnect') || msg.includes('abort')) {
    return {
      title: 'Réponse interrompue',
      message:
        'La réponse a été interrompue. Vous pouvez relancer votre demande.',
      action: 'retry',
      retryable: true,
    };
  }

  // Server error (500)
  if (msg.includes('500') || msg.includes('internal server error')) {
    return {
      title: 'Erreur de traitement',
      message:
        "Un problème technique est survenu. Veuillez réessayer dans quelques instants.",
      action: 'retry',
      retryable: true,
    };
  }

  // Default fallback — always in French, always retryable
  return {
    title: 'Une erreur est survenue',
    message:
      "Nous n'avons pas pu traiter votre demande. Veuillez réessayer ou contacter un conseiller MetLife.",
    action: 'retry',
    retryable: true,
  };
}
