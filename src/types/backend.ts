export interface Backend {
  id: string;
  name_or_host: string;
  namespace?: string | null;
  port: number;
  timeout_ms?: number | null;
  protocol: Protocol;
  weight?: number | null;
  filters?: string[] | null;
}

export enum Protocol {
  Http = 'Http',
  Https = 'Https',
  Ws = 'Ws',
  Wss = 'Wss',
}
