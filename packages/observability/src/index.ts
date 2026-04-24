export interface ExceptionContext {
  requestId?: string;
  method?: string;
  path?: string;
  statusCode?: number;
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
}

export interface Observability {
  captureException(exception: unknown, context?: ExceptionContext): void;
  flush?(timeoutMs?: number): Promise<boolean>;
}

export const noopObservability: Observability = {
  captureException: () => undefined,
  flush: async () => true,
};
