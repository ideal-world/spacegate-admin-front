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
  protocol: string;
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

export interface ServiceVO {
  name: string;
  parameters: Parameters;
  ip?: string[];
  port: number[];
  protocol: string[];
  hostname?: string[];
  tls?: string;
  filters: string[];
}

export function convertServiceToVO(gateway: Service): ServiceVO {
  return {
    name: gateway.name,
    parameters: gateway.parameters,
    ip: gateway.listeners.map((listener) => listener.ip).filter((value): value is string => typeof value === "string").filter((value, index, self) => self.indexOf(value) === index),
    port: gateway.listeners.map((listener) => listener.port).filter((value, index, self) => self.indexOf(value) === index),
    protocol: gateway.listeners.map((listener) => listener.protocol).filter((value, index, self) => self.indexOf(value) === index),
    hostname: gateway.listeners.map((listener) => listener.hostname).filter((value): value is string => typeof value === "string").filter((value, index, self) => self.indexOf(value) === index),
    tls: gateway.listeners.filter((listener) => listener.tls)[0],
    filters: gateway.filters,
  };
}

export function converVOToService(vo: ServiceVO): Service {
  let listeners: Listener[] = [];
  vo.port.forEach(port => {
    for (let protocol of vo.protocol) {
      if (vo.ip && vo.hostname) {
        for (let ip of vo.ip) {
          for (let hostname of vo.hostname) {
            listeners.push({
              name: vo.name + 'listener-' + port + '-' + protocol + '-' + ip + '-' + hostname,
              port: port,
              protocol: protocol,
              ip: ip,
              hostname: hostname,
              tls: vo.tls,
            })
          }
        }
      }
      if (vo.ip && (!vo.hostname || vo.hostname.length == 0)) {
        for (let ip of vo.ip) {
          listeners.push({
            name: vo.name + 'listener-' + port + '-' + protocol + '-' + ip,
            port: port,
            protocol: protocol,
            ip: ip,
            tls: vo.tls,
          })
        }
      }
      if (vo.hostname && (!vo.ip || vo.ip.length == 0)) {
        for (let hostname of vo.hostname) {
          listeners.push({
            name: vo.name + 'listener-' + port + '-' + protocol + '-' + hostname,
            port: port,
            protocol: protocol,
            hostname: hostname,
            tls: vo.tls,
          })
        }
      }
      if ((!vo.ip || vo.ip.length == 0) && (!vo.hostname || vo.hostname.length == 0)) {
        listeners.push({
          name: vo.name + 'listener-' + port + '-' + protocol,
          port: port,
          protocol: protocol,
          tls: vo.tls,
        })
      }
    }
  })
  return {
    name: vo.name,
    parameters: vo.parameters,
    listeners: listeners,
    filters: vo.filters ? vo.filters : [],
  };
}