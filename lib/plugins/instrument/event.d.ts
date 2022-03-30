declare type EventHandlersKeys = 'error' | 'unhandledrejection';
declare type EventHandlersIntegrations = Record<EventHandlersKeys, boolean>;
export declare class EventHandlers {
    static id: string;
    private readonly _options;
    private _installFunc;
    constructor(options?: EventHandlersIntegrations);
    setup(): void;
}
export {};
