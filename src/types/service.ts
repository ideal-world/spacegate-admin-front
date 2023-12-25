import { ApiObject } from ".";
import { useSelectedInstanceStore } from "../stores/select_instance";
import { formatK8sObjUnique, parseK8sObjUnique } from "./common";
import { isUndefined } from 'lodash'
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

// export class Listener implements ApiObject {
//   _name?: string = undefined;
//   _service?: Service;
//   port: number = 0;
//   protocol: ServiceProtocol = 'Http';
//   ip?: string;
//   tls?: string;
//   hostname?: string;
//   get name(): string {
//     if (!isUndefined(this._name)) {
//       return this._name
//     } else if (!isUndefined(this._service)) {
//       return [
//         this._service.name,
//         this.port,
//         this.protocol,
//         this.ip,
//         this.hostname
//       ].filter((value) => !isUndefined(value)).join('-')
//     }
//     throw new Error('Listener name is undefined')
//   }
//   set name(name: string) 
//   serialize(this: this): Object {
//     return {
//       name: this.name,
//       port: this.port,
//       protocol: this.protocol,
//       ip: this.ip,
//       tls: this.tls,
//       hostname: this.hostname,
//     }
//   }
//   deserialize(this: Object): this {
//     return this as this
//   }
// }

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

// export function convertServiceToVO(gateway: Service): ServiceVO {
//   const selectedStore = useSelectedInstanceStore()
//   let tls_s = gateway.listeners.map((listener) => listener.tls).filter((value) => value !== undefined && value != '') as string[];
//   return {
//     name: selectedStore.is_k8s() ? parseK8sObjUnique(gateway.name)[1] : gateway.name,
//     namespace: selectedStore.is_k8s() ? parseK8sObjUnique(gateway.name)[0] : '',
//     parameters: gateway.parameters,
//     ip: gateway.listeners.map((listener) => listener.ip).filter((value): value is string => typeof value === "string").filter((value, index, self) => self.indexOf(value) === index),
//     port: gateway.listeners.map((listener) => listener.port).filter((value, index, self) => self.indexOf(value) === index),
//     protocol: gateway.listeners.map((listener) => listener.protocol).filter(isServiceProtocol).filter((value, index, self) => self.indexOf(value) === index),
//     hostname: gateway.listeners.map((listener) => listener.hostname).filter((value): value is string => typeof value === "string").filter((value, index, self) => self.indexOf(value) === index),
//     tls: tls_s.length > 0 ? tls_s[0] : '',
//     filters: gateway.filters,
//   };
// }

// export function converVOToService(vo: ServiceVO): Service {
//   let listeners: Listener[] = [];
//   vo.port.forEach(port => {
//     for (let protocol of vo.protocol) {
//       if (vo.ip && vo.hostname) {
//         for (let ip of vo.ip) {
//           for (let hostname of vo.hostname) {
//             let name = vo.name + '-listener-' + port + '-' + protocol + '-' + ip + '-' + hostname
//             listeners.push({
//               name: name.toLowerCase(),
//               port: port,
//               protocol: protocol,
//               ip: ip,
//               hostname: hostname,
//               tls: vo.tls,
//             })
//           }
//         }
//       }
//       if (vo.ip && (!vo.hostname || vo.hostname.length == 0)) {
//         for (let ip of vo.ip) {
//           listeners.push({
//             name: (vo.name + '-listener-' + port + '-' + protocol + '-' + ip).toLowerCase(),
//             port: port,
//             protocol: protocol,
//             ip: ip,
//             tls: vo.tls,
//           })
//         }
//       }
//       if (vo.hostname && (!vo.ip || vo.ip.length == 0)) {
//         for (let hostname of vo.hostname) {
//           listeners.push({
//             name: (vo.name + '-listener-' + port + '-' + protocol + '-' + hostname).toLowerCase(),
//             port: port,
//             protocol: protocol,
//             hostname: hostname,
//             tls: vo.tls,
//           })
//         }
//       }
//       if ((!vo.ip || vo.ip.length == 0) && (!vo.hostname || vo.hostname.length == 0)) {
//         listeners.push({
//           name: (vo.name + '-listener-' + port + '-' + protocol).toLowerCase(),
//           port: port,
//           protocol: protocol,
//           tls: vo.tls,
//         })
//       }
//     }
//   })
//   const selectedStore = useSelectedInstanceStore()
//   console.log('selectedStore.is_k8s()' + selectedStore.is_k8s())
//   return {
//     name: selectedStore.is_k8s() ? formatK8sObjUnique(vo.namespace, vo.name) : vo.name,
//     parameters: vo.parameters,
//     listeners: listeners,
//     filters: vo.filters ? vo.filters : [],
//   };
// }