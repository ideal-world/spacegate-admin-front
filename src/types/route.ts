import { useSelectedInstanceStore } from "../stores/select_instance";
import { formatK8sObjUnique, parseK8sObjUnique } from "./common";

export interface SgHttpRouteVO {
  name: string;
  namespace: string;
  gateway_name: string;
  priority: number;
  hostnames: string[];
  filters: string[];
  matches: SgHttpRouteMatch[];
  backends: string[];
  timeout_ms: number;
}

export function convertRouteToVO(route: SgHttpRoute): SgHttpRouteVO {
  const selectedStore = useSelectedInstanceStore()
  let timeout_ms_s = route.rules.map((rule) => rule.timeout_ms).filter((value): value is number => typeof value === "number").filter((value, index, self) => self.indexOf(value) === index && value > 0);
  return {
    name: selectedStore.is_k8s() ? parseK8sObjUnique(route.name)[1] : route.name,
    namespace: selectedStore.is_k8s() ? parseK8sObjUnique(route.name)[0] : '',
    gateway_name: route.gateway_name,
    priority: route.priority,
    hostnames: route.hostnames ? route.hostnames : [],
    filters: route.filters,
    matches: route.rules.map((rule) => rule.matches).filter((value): value is SgHttpRouteMatch[] => typeof value === "object").filter((value, index, self) => self.indexOf(value) === index && value && value.length > 0).flat(),
    backends: route.rules.map((rule) => rule.backends).filter((value, index, self) => self.indexOf(value) === index).flat(),
    timeout_ms: timeout_ms_s.length > 0 ? timeout_ms_s[0] : 50000
  }
}

export function convertVOToRoute(vo: SgHttpRouteVO): SgHttpRoute {
  const selectedStore = useSelectedInstanceStore()
  let rules: SgHttpRouteRule[] = [{ matches: vo.matches.length > 0 ? vo.matches : null, filters: vo.filters, backends: vo.backends, timeout_ms: vo.timeout_ms == 0 || vo.timeout_ms == 50000 ? null : vo.timeout_ms }];
  return {
    name: selectedStore.is_k8s() ? formatK8sObjUnique(vo.namespace, vo.name) : vo.name,
    gateway_name: vo.gateway_name,
    priority: vo.priority,
    hostnames: vo.hostnames.length > 0 ? vo.hostnames : null,
    filters: vo.filters,
    rules,
  }
}
export type SgHttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'HEAD' | 'OPTIONS' | 'PATCH' | 'TRACE' | 'CONNECT';
export interface SgHttpRoute {
  name: string;
  gateway_name: string;
  priority: number;
  hostnames?: string[] | null;
  filters: string[];
  rules: SgHttpRouteRule[];
}

export interface SgHttpRouteRule {
  matches?: SgHttpRouteMatch[] | null;
  filters: string[];
  backends: string[];
  timeout_ms?: number | null;
}

export interface SgHttpRouteMatch {
  path?: SgHttpPathMatch | null;
  header?: SgHttpHeaderMatch[] | null;
  query?: SgHttpQueryMatch[] | null;
  method?: SgHttpMethod[] | null;
}

export interface SgHttpPathMatch {
  kind: SgHttpPathMatchType;
  value: string;
}

export enum SgHttpPathMatchType {
  Exact = 'Exact',
  Prefix = 'Prefix',
  Regular = 'Regular',
}

export interface SgHttpHeaderMatch {
  kind: SgHttpHeaderMatchType;
  name: string;
  value: string;
}

export enum SgHttpHeaderMatchType {
  Exact = 'Exact',
  Regular = 'Regular',
}

export interface SgHttpQueryMatch {
  kind: SgHttpQueryMatchType;
  name: string;
  value: string;
}

export enum SgHttpQueryMatchType {
  Exact = 'Exact',
  Regular = 'Regular',
}
