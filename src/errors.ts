import { HttpError } from './api.js';

export interface SearchFailure {
  kind: 'timeout' | 'http' | 'network';
  message: string;
  status?: number;
}

export function classifyError(error: unknown): SearchFailure | null {
  const name = typeof error === 'object' && error !== null && 'name' in error ? error.name : '';
  if (name === 'AbortError') return null;
  if (name === 'TimeoutError') {
    return { kind: 'timeout', message: 'Сервер не ответил за 10 секунд. Попробуйте ещё раз.' };
  }
  if (error instanceof HttpError) {
    return {
      kind: 'http',
      status: error.status,
      message:
        error.status === 429
          ? 'Слишком много запросов. Подождите немного и повторите поиск.'
          : `Сервис стран временно недоступен (HTTP ${error.status}). Попробуйте ещё раз.`,
    };
  }
  return {
    kind: 'network',
    message: 'Не удалось загрузить страны. Проверьте подключение к интернету и повторите поиск.',
  };
}
