export interface InstConfigVo {
  type_: InstConfigType;
  k8s_cluster_config?: K8sClusterConfig | null;
  redis_config?: RedisConfig | null;
}

export function getInstName(config: InstConfigVo): string | undefined {
  if (config.type_ == InstConfigType.K8sClusterConfig) {
    if (config.k8s_cluster_config) {
      return config.k8s_cluster_config.name
    }
  }
  if (config.type_ == InstConfigType.RedisConfig) {
    if (config.redis_config) {
      return config.redis_config.name
    }
  }

}

export enum InstConfigType {
  K8sClusterConfig = 'K8sClusterConfig',
  RedisConfig = 'RedisConfig',
}

export interface K8sClusterConfig {
  name: string;
  config: K8sConfig;
}

export interface K8sConfig {
  clusters: NamedCluster,
  users: NamedAuthInfo,
}

export interface NamedCluster {
  name: String,
  cluster?: Cluster | null,
}

export interface Cluster {
  server?: string | null;
  insecure_skip_tls_verify?: boolean | null;
  certificate_authority?: string | null;
  certificate_authority_data?: string | null;
  proxy_url?: string | null;
  tls_server_name?: string | null;
}

export interface NamedAuthInfo {
  name: String,
  auth_info?: AuthInfo | null,
}

export interface AuthInfo {
  username?: string | null;
  password?: string | null;
  token?: string | null;
  tokenFile?: string | null;
  client_certificate?: string | null;
  client_certificate_data?: string | null;
  client_key?: string | null;
  client_key_data?: string | null;
}

export interface RedisConfig {
  name: string;
  url: string;
}
