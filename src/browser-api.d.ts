declare const browser: {
  action: {
    onClicked: {
      addListener(listener: () => Promise<void> | void): void;
    };
  };
  sidebarAction: {
    open(): Promise<void>;
  };
  contextMenus: {
    create(details: {
      id: string;
      title: string;
      contexts: string[];
    }): string | number | Promise<string | number>;
    remove(id: string | number): Promise<void>;
    onClicked: {
      addListener(
        listener: (
          info: {
            menuItemId: string | number;
            targetElementId?: number;
            frameId?: number;
          },
          tab?: { id?: number; windowId?: number },
        ) => Promise<void> | void,
      ): void;
    };
  };
  menus: {
    getTargetElement(targetElementId: number): Element | null;
  };
  scripting: {
    executeScript(details: {
      target: { tabId: number; frameIds: number[] };
      func: (targetElementId: number) => unknown;
      args: [number];
    }): Promise<Array<{ result?: unknown }>>;
  };
  tabs: {
    captureVisibleTab(
      windowId: number | undefined,
      options: { format: "png" },
    ): Promise<string>;
  };
  storage: {
    local: {
      get(keys?: string[] | null): Promise<Record<string, unknown>>;
      remove(keys: string[]): Promise<void>;
      set(items: Record<string, unknown>): Promise<void>;
    };
  };
  permissions: {
    request(details: {
      origins?: string[];
      permissions?: string[];
    }): Promise<boolean>;
    remove(details: {
      origins?: string[];
      permissions?: string[];
    }): Promise<boolean>;
  };
  runtime: {
    sendMessage(message: unknown): Promise<unknown>;
    onMessage: {
      addListener(
        listener: (message: unknown) => unknown | Promise<unknown>,
      ): void;
    };
  };
};
