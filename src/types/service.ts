export interface Parameters {
  redis_url?: string;
  log_level?: string;
  lang?: string;
  ignore_tls_verification?: boolean;
}

export interface Tls {
  mode: string;
  key: string;
  cert: string;
}

export interface Listener {
  name: string;
  ip: string;
  port: number;
  protocol: string;
  tls?: Tls;
  hostname: string;
}

export interface Gateway {
  name: string;
  parameters: Parameters;
  listeners: Listener[];
  filters?: string[];
}

export interface GatewayVO {
  name: string;
  parameters: Parameters;
  ip: string[];
  port: number[];
  protocol: string[];
  hostname: string[];
  tls?: Tls;
  filters?: string[];
}

export function convertGatewayToVO(gateway: Gateway): GatewayVO {
  return {
    name: gateway.name,
    parameters: gateway.parameters,
    ip: gateway.listeners.map((listener) => listener.ip),
    port: gateway.listeners.map((listener) => listener.port),
    protocol: gateway.listeners.map((listener) => listener.protocol),
    hostname: gateway.listeners.map((listener) => listener.hostname),
    tls: gateway.listeners[0].tls,
  };
}