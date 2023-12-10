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

export interface BackendVO {
  id: string;
  name_or_host: string;
  namespace: string ;
  port: number;
  timeout_ms: number ;
  protocol: Protocol;
  weight: number ;
  filters: string[] ;
}

export function convertBackendToVO(backend: Backend): BackendVO {
  return {
    id: backend.id,
    name_or_host: backend.name_or_host,
    namespace: backend.namespace || '',
    port: backend.port,
    timeout_ms: backend.timeout_ms || 5000,
    protocol: backend.protocol,
    weight: backend.weight || 1,
    filters: backend.filters || [],
  };
}

export function convertVOToBackend(vo: BackendVO): Backend {
  return {
    id: vo.id,
    name_or_host: vo.name_or_host,
    namespace: vo.namespace==''?null:vo.namespace,
    port: vo.port,
    timeout_ms: vo.timeout_ms==0||vo.timeout_ms==5000?null:vo.timeout_ms,
    protocol: vo.protocol,
    weight: vo.weight==0||vo.weight==1?null:vo.weight,
    filters: vo.filters.length == 0 ? null : vo.filters,
  };
}