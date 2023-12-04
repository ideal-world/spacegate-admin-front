export interface SgHttpRoute {
  name: string;
  gateway_name: string;
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
  method?: string[] | null;
}

export interface SgHttpPathMatch {
  kind: SgHttpPathMatchType;
  value: string;
}

export enum SgHttpPathMatchType {
  Exact = 'exact',
  Prefix = 'prefix',
  Regular = 'regular',
}

export interface SgHttpHeaderMatch {
  kind: SgHttpHeaderMatchType;
  name: string;
  value: string;
}

export enum SgHttpHeaderMatchType {
  Exact = 'exact',
  Regular = 'regular',
}

export interface SgHttpQueryMatch {
  kind: SgHttpQueryMatchType;
  name: string;
  value: string;
}

export enum SgHttpQueryMatchType {
  Exact = 'exact',
  Regular = 'regular',
}
