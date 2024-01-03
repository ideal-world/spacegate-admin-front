import { InstConfig, InstConfigType, K8sClusterConfig, RedisConfig, } from "../instance";

export class InstConfigForm {
  type: InstConfigType;
  config: K8sClusterConfig | RedisConfig;
  private constructor(type: InstConfigType, config: K8sClusterConfig | RedisConfig) {
    this.type = type;
    this.config = config;
  }
  static fromInstConfig(config: InstConfig): InstConfigForm {
    return new InstConfigForm(
      config.type_,
      config.type_ == InstConfigType.K8sClusterConfig ?
        config.k8s_cluster_config
        : config.redis_config
    );
  }
  get name(): string {
    return this.config.name

  }
  set name(name: string) {
    this.config.name = name
  }
  intoInstConfig(): InstConfig {
    if (this.type == InstConfigType.K8sClusterConfig) {
      return {
        type_: this.type,
        k8s_cluster_config: this.config as K8sClusterConfig
      }
    } else {
      return {
        type_: this.type,
        redis_config: this.config as RedisConfig
      }
    }
  }
}
