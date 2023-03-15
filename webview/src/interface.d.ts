declare interface VsCodeAPI {
  getState(): Record<string, any>;
  postMessage(message: any, transfer?: any): void;
  setState(newState: Record<string, any>): void;
}

declare function acquireVsCodeApi(): VsCodeAPI;
