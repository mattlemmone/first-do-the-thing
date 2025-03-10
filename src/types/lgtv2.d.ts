declare module 'lgtv2' {
  interface LGTVOptions {
    url: string;
    timeout?: number;
    reconnect?: number;
    clientKey?: string;
    keyFile?: string;
    saveKey?: (key: string) => void;
    wsconfig?: {
      rejectUnauthorized?: boolean;
      tlsOptions?: {
        rejectUnauthorized?: boolean;
      };
    };
  }

  interface LGTVConnection {
    on(event: 'connect', listener: () => void): this;
    on(event: 'connecting', listener: () => void): this;
    on(event: 'error', listener: (error: Error) => void): this;
    on(event: 'close', listener: () => void): this;
    on(event: string, listener: (...args: any[]) => void): this;
    
    request(uri: string, callback: (error: Error | null, data?: any) => void): void;
    subscribe(uri: string, callback: (error: Error | null, data?: any) => void): void;
    disconnect(): void;
  }

  function lgtv(options: LGTVOptions): LGTVConnection;
  export = lgtv;
} 