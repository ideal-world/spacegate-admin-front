export interface SelectedInstance {
  name: string,
  type_: InstConfigType
}

export type InstConfig = {
  type_: InstConfigType.K8sClusterConfig;
  k8s_cluster_config: K8sClusterConfig;
} | {
  type_: InstConfigType.RedisConfig;
  redis_config: RedisConfig
}

export interface InstConfigVO {
  name: string
  type_: InstConfigType;
  k8s_cluster_config: K8sClusterConfigVO;
  redis_url: string;
}
// export function convertInstanceToVO(config: InstConfig): InstConfigVO {
//   let name = getInstName(config);
//   return {
//     name: name ? name : '',
//     type_: config.type_,
//     k8s_cluster_config: convertK8sClusterToVO(config.k8s_cluster_config),
//     redis_url: config.redis_config ? config.redis_config.url : '',
//   }
// }

// export function convertVOToInstance(vo: InstConfigVO): InstConfig {
//   return {
//     type_: vo.type_,
//     k8s_cluster_config: vo.type_ == InstConfigType.K8sClusterConfig ? convertVOToK8sCluster(vo.name, vo.k8s_cluster_config) : null,
//     redis_config: vo.type_ == InstConfigType.RedisConfig ? { name: vo.name, url: vo.redis_url } : null
//   }
// }

export function getInstName(config: InstConfig): string | undefined {
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
  name: string,
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

export interface K8sClusterConfigVO {
  server_url: string;
  username: string;
  token: string;
}
function convertK8sClusterToVO(k8s_config: K8sClusterConfig | null | undefined): K8sClusterConfigVO {
  if (!k8s_config) {
    return { server_url: '', username: '', token: '' }
  }
  if (!k8s_config.config.clusters.cluster) {
    return { server_url: '', username: '', token: '' }
  }
  if (!k8s_config.config.users.auth_info) {
    return { server_url: k8s_config.config.clusters.cluster.server ? k8s_config.config.clusters.cluster.server : '', username: '', token: '' }
  }
  return {
    server_url: k8s_config.config.clusters.cluster.server ? k8s_config.config.clusters.cluster.server : '',
    username: k8s_config.config.users.auth_info.username ? k8s_config.config.users.auth_info.username : '',
    token: k8s_config.config.users.auth_info.token ? k8s_config.config.users.auth_info.token : '',
  }
}
function convertVOToK8sCluster(name: string, vo: K8sClusterConfigVO): K8sClusterConfig | null {
  if (!vo || name == '' || vo.server_url == '' || vo.username == '' || vo.token == '') {
    return null
  }
  return {
    name: name,
    config: {
      clusters: {
        name: name,
        cluster: vo.server_url == '' ? null : {
          server: vo.server_url
        }
      },
      users: {
        name: name,
        auth_info: vo.username == '' && vo.token == '' ? null : {
          username: vo.username,
          token: vo.token
        }
      }
    }
  }
}