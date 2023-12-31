import { useSelectedInstanceStore } from "../../stores/select_instance";
import { formatK8sObjUnique, parseK8sObjUnique } from "../common";
import { ServiceProtocol, Parameters, Listener, Service } from "../service";


export class ServiceForm {
  name: string = '';
  namespace: string = '';
  parameters: Parameters = {};
  listeners: ListenerForm[] = [];
  filters: string[] = [];

  constructor() {

  }

  static fromService(service: Service): ServiceForm {
    const selectedStore = useSelectedInstanceStore()
    const self = new ServiceForm();
    self.name = selectedStore.is_k8s() ? parseK8sObjUnique(service.name)[1] : service.name;
    self.namespace = selectedStore.is_k8s() ? parseK8sObjUnique(service.name)[0] : '';
    self.parameters = service.parameters;
    self.listeners = service.listeners.map(ListenerForm.fromListener);
    self.filters = service.filters;
    return self
  }

  intoService(): Service {
    const selectedStore = useSelectedInstanceStore();
    const name = selectedStore.is_k8s() ? formatK8sObjUnique(this.namespace, this.name) : this.name;
    return {
      name,
      parameters: this.parameters,
      listeners: this.listeners.map((l) => l.intoListener()),
      filters: this.filters,
    }

  }

}

export class ListenerForm {
  private _name?: string;
  private service_form?: ServiceForm;
  port: number = 0;
  protocol: ServiceProtocol = 'Http';
  ip?: string;
  tls?: string;
  hostname?: string;
  collapsed: boolean = false;

  static fromListener(listener: Listener): ListenerForm {
    let self = new ListenerForm();
    self.name = listener.name;
    self.port = listener.port;
    self.protocol = listener.protocol;
    self.ip = listener.ip;
    self.tls = listener.tls;
    self.hostname = listener.hostname;
    return self
  }

  get name(): string {
    if (this._name === undefined) {
      const nameSegments = [
        this.service_form?.name,
        this.protocol,
        this.port,
        this.ip,
      ]
      return nameSegments.filter((s) => s !== undefined).join('-').toLowerCase()
    } else {
      return this._name
    }
  }

  set name(name: string) {
    this._name = name
  }
  intoListener(): Listener {
    return {
      name: this.name,
      port: this.port,
      protocol: this.protocol,
      ip: this.ip,
      tls: this.tls,
      hostname: this.hostname,
    }
  }
}