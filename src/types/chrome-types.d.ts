/**
 * Declaration file for Chrome API to help with external handling
 */

declare namespace chrome {
  namespace scripting {
    interface InjectionTarget {
      tabId: number;
      frameIds?: number[];
      allFrames?: boolean;
    }
    
    interface ScriptInjection {
      target: InjectionTarget;
      files?: string[];
      func?: Function;
      args?: any[];
      injectImmediately?: boolean;
      world?: "ISOLATED" | "MAIN";
    }
    
    function executeScript(injection: ScriptInjection): Promise<any[]>;
  }
  
  namespace runtime {
    const lastError: {message: string} | undefined;
    
    interface InstalledDetails {
      reason: string;
      previousVersion?: string;
      id?: string;
    }
    interface MessageSender {
      tab?: {
        id?: number;
        url?: string;
      };
      frameId?: number;
      id?: string;
      url?: string;
      origin?: string;
    }
    
    function sendMessage(message: any): Promise<any>;
    function sendMessage(message: any, responseCallback: (response: any) => void): void;
    function sendMessage(extensionId: string, message: any): Promise<any>;
    function sendMessage(extensionId: string, message: any, responseCallback: (response: any) => void): void;
    
    const onInstalled: {
      addListener(callback: (details: InstalledDetails) => void): void;
    };
    
    const onMessage: {
      addListener(callback: (message: any, sender: MessageSender, sendResponse: (response?: any) => void) => boolean | void): void;
      removeListener(callback: (message: any, sender: MessageSender, sendResponse: (response?: any) => void) => boolean | void): void;
    };
  }
  
  namespace tabs {
    const TAB_ID_NONE: number;
    
    interface Tab {
      id?: number;
      url?: string;
      title?: string;
      active: boolean;
      windowId: number;
    }
    
    function sendMessage(tabId: number, message: any): Promise<any>;
    function sendMessage(tabId: number, message: any, responseCallback: (response: any) => void): void;
    
    const onRemoved: {
      addListener(callback: (tabId: number, removeInfo: any) => void): void;
    };
    
    const onUpdated: {
      addListener(callback: (tabId: number, changeInfo: { status?: string }, tab: Tab) => void): void;
    };
  }
  
  namespace storage {
    interface StorageArea {
      get(keys: string | string[] | { [key: string]: any } | null): Promise<{ [key: string]: any }>;
      get(keys: string | string[] | { [key: string]: any } | null, callback: (items: { [key: string]: any }) => void): void;
      
      set(items: { [key: string]: any }): Promise<void>;
      set(items: { [key: string]: any }, callback?: () => void): void;
    }
    
    const sync: StorageArea;
    const local: StorageArea;
    
    const onChanged: {
      addListener(callback: (changes: { [key: string]: { oldValue?: any, newValue?: any } }, areaName: string) => void): void;
    };
  }
  
  namespace contextMenus {
    function create(properties: { 
      id?: string; 
      title?: string; 
      contexts?: string[]; 
      type?: string; 
      parentId?: string;
      enabled?: boolean;
    }, callback?: () => void): void;
    
    function removeAll(callback?: () => void): void;
    
    const onClicked: {
      addListener(callback: (info: { menuItemId: string | number, [key: string]: any }, tab?: tabs.Tab) => void): void;
    };
  }
}