/**
 * @name 对WebRequest进行重写
 * @des 包括 xhr 和 fetch
 */
declare type RequestHandlersKeys = 'fetch' | 'xhr';
declare type RequestHandlersIntegrations = Record<RequestHandlersKeys, boolean>;
export declare class RequestHandlers {
    static id: string;
    private readonly _options;
    private _installFunc;
    constructor(options?: RequestHandlersIntegrations);
    setup(): void;
}
export {};
