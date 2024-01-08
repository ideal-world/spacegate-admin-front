export interface Parameters {
  redis_url?: string;
  log_level?: string;
  lang?: string;
  ignore_tls_verification?: boolean;
}

// export interface Tls {
//   mode: string;
//   key: string;
//   cert: string;
// }

export interface Listener {
  name: string;
  port: number;
  protocol: ServiceProtocol;
  ip?: string;
  tls?: string;
  hostname?: string;
}

export interface Service {
  name: string;
  parameters: Parameters;
  listeners: Listener[];
  filters: string[];
}

export const SERVICE_PROTOCOLS = ['Http', 'Https'] as const
export function isServiceProtocol(s: string): s is ServiceProtocol {
  if ((SERVICE_PROTOCOLS as unknown as string[]).includes(s)) {
    return true
  } else {
    return false
  }
}


export type ServiceProtocol = (typeof SERVICE_PROTOCOLS)[number]

export interface ServiceVO {
  name: string;
  namespace: string;
  parameters: Parameters;
  ip: string[];
  port: number[];
  protocol: ServiceProtocol[];
  hostname: string[];
  tls: string;
  filters: string[];
}