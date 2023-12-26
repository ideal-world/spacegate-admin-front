import { Backend, Protocol } from "../backend";

export class BackendForm {
    id: string = "";
    name_or_host: string = "";
    namespace: string = "";
    port: number = 0;
    timeout_ms: number = 5000;
    protocol: Protocol = Protocol.Http;
    weight: number = 1;
    filters: string[] = [];

    static fromBackend(backend: Backend): BackendForm {
        let self = new BackendForm();
        self.id = backend.id;
        self.name_or_host = backend.name_or_host;
        self.namespace = backend.namespace ?? "";
        self.port = backend.port;
        self.timeout_ms = backend.timeout_ms ?? 5000;
        self.protocol = backend.protocol;
        self.weight = backend.weight ?? 1;
        self.filters = backend.filters ?? [];
        return self
    }

    intoBackend(): Backend {
        return {
            id: this.id,
            name_or_host: this.name_or_host,
            namespace: this.namespace ?? "",
            port: this.port,
            timeout_ms: this.timeout_ms,
            protocol: this.protocol,
            weight: this.weight ?? 1,
            filters: this.filters ?? [],
        }
    }
}