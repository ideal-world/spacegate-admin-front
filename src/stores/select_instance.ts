import { defineStore } from 'pinia'
import { InstConfigType, SelectedInstance } from '../types/instance'

export const useSelectedInstanceStore = defineStore('selectedInstance', {
  state: () => ({ selectedInstance: null as SelectedInstance | null }),
  actions: {
    set(value: SelectedInstance) {
      this.selectedInstance = value
    },
    is_k8s(): boolean {
      return this.selectedInstance?.type_ == InstConfigType.K8sClusterConfig
    }
  },
})