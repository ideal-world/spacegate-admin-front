
import { App, getCurrentInstance, Plugin } from 'vue'
import { Api } from 'spacegate-admin-client'
import axios from 'axios'
export type SgServicePluginOptions = {
  config: Parameters<typeof axios.create>
}


export const SpacegateService: Plugin<SgServicePluginOptions> = {
  install: (app: App, options: SgServicePluginOptions) => {
    Api.setClient(...options.config)
  }
}

