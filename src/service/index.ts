import { IResponse } from "../requset";
import { GetBackendParams } from "../requset/api/backend/type";
import { Backend } from "../types/backend";
import { TlsCert } from "../types";
import { GetTlsCertParams } from "../requset/api/certificate/type";

type Request<I = never, O = void> =
    I extends any ?
    (params: I) => Promise<IResponse<O>> :
    () => Promise<IResponse<O>>;

export interface SgBackendService {
    getBackend: Request<GetBackendParams | undefined, Backend[]>;
    addBackend: Request<Backend, Backend>;
    updateBackend: Request<Backend, Backend>;
    deleteBackend: Request<string>;
}

export interface SgCertificateService {
    getTlsCert: Request<{
        name?: string
    }, TlsCert[]>;
    addCertificate: Request<TlsCert, TlsCert>;
    updateCertificate: Request<TlsCert, TlsCert>;
    deleteCertificate: Request<TlsCert, TlsCert>;
}


export interface SgService {
    backend: SgBackendService;
    certificate: SgCertificateService;
}