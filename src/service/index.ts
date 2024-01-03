import { IResponse } from "../requset";
import { Backend } from "../types/backend";
import { InstConfig, SelectedInstance, Service, SgHttpRoute, SgPlugin, Statistics, TlsCert } from "../types";
import { AddGateway } from "../requset/api/service/type";
import { App, Plugin } from "vue";
import { DefaultBackendService } from "../requset/api/backend";
import { DefaultCertificateService } from "../requset/api/certificate";
import { DefaultCommonService } from "../requset/api/common";
import { DefaultPluginService } from "../requset/api/plugin";
import { DefaultRouteService } from "../requset/api/route";
import { DefaultServiceService } from "../requset/api/service";
import { DefaultInstanceService } from "../requset/api/instance";
import { getCurrentInstance } from 'vue'

type Request<I = undefined, O = void> =
  undefined extends I ?
  (param?: I) => Promise<IResponse<O>>
  :
  (params: I) => Promise<IResponse<O>>;

export interface SgBackendService {
  getBackend: Request<undefined | {
    names?: string
    namespace?: string
  }, Backend[]>;
  addBackend: Request<Backend, Backend>;
  updateBackend: Request<Backend, Backend>;
  deleteBackend: Request<string>;
}

export interface SgCertificateService {
  getTlsCert: Request<{
    names?: string
  } | undefined, TlsCert[]>;
  addTlsCert: Request<TlsCert, TlsCert>;
  updateTlsCert: Request<TlsCert, TlsCert>;
  deleteTlsCert: Request<string, void>;
}

export interface SgCommonService {
  getStatistics: Request<void, Statistics>;
}

export interface SgPluginService {
  getPlugin: Request<{
    ids?: string
  } | undefined, SgPlugin[]>;
  addPlugin: Request<SgPlugin, SgPlugin>;
  updatePlugin: Request<SgPlugin, SgPlugin>;
  deletePlugin: Request<string, void>;
}

export interface SgInstanceService {
  getSelectedInstance: Request<void, SelectedInstance>;
  selectInstance: Request<string, string>;
  getInstanceList: Request<{
    names?: string
  } | undefined, InstConfig[]>;
  addInstanceList: Request<InstConfig, InstConfig>;
  updateInstanceList: Request<InstConfig, InstConfig>;
  deleteInstance: Request<string, void>;

}

export interface SgRouteService {
  getHttpRoute: Request<{
    names?: string
    namespace?: string
  } | undefined, SgHttpRoute[]>;
  addHttpRoute: Request<SgHttpRoute, SgHttpRoute>;
  updateHttpRoute: Request<SgHttpRoute, SgHttpRoute>;
  deleteHttpRoute: Request<string, void>;
}

export interface SgServiceService {
  getGateways: Request<{
    names?: string
    namespace?: string
    port?: number
    hostname?: string
  } | undefined, Service[]>;
  addGateways: Request<AddGateway, Service>;
  updateGateways: Request<Service, Service>;
  deleteGateways: Request<string, void>;
}




export interface SgService {
  backend: SgBackendService;
  certificate: SgCertificateService;
  common: SgCommonService;
  plugin: SgPluginService;
  instance: SgInstanceService;
  route: SgRouteService;
  service: SgServiceService;
}


export class DefaultSgService implements SgService {
  backend = new DefaultBackendService();
  certificate = new DefaultCertificateService;
  common = new DefaultCommonService();
  plugin = new DefaultPluginService();
  instance = new DefaultInstanceService();
  route = new DefaultRouteService();
  service = new DefaultServiceService();
}


export type SgServicePluginOptions = {
  backend: 'default'
} | {
  backend: 'custom'
  service: SgService
} | undefined


export const SpacegateService: Plugin<SgServicePluginOptions> = {
  install: (app: App, options: SgServicePluginOptions) => {
    let $sg_service: SgService
    if (options === undefined || options.backend === 'default') {
      $sg_service = new DefaultSgService()
    }
    else if (options.backend === 'custom') {
      $sg_service = options.service
    } else {
      throw new Error('Invalid backend option')
    }
    app.config.globalProperties['$sg_service'] = $sg_service
    console.warn('Spacegate service is initialized', $sg_service)
  }
}

export const useSpacegateService = (): SgService => {
  let $sg_service = getCurrentInstance()?.appContext.config.globalProperties['$sg_service']
  if ($sg_service === undefined) {
    throw new Error('Spacegate service is not initialized')
  }
  return $sg_service
}

export * from './options'
