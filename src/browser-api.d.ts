declare const browser: {
  action: {
    onClicked: {
      addListener(listener: () => Promise<void> | void): void;
    };
  };
  sidebarAction: {
    open(): Promise<void>;
  };
  storage: {
    local: {
      get(keys?: string[] | null): Promise<Record<string, unknown>>;
      remove(keys: string[]): Promise<void>;
      set(items: Record<string, unknown>): Promise<void>;
    };
  };
  permissions: {
    request(details: { origins: string[] }): Promise<boolean>;
    remove(details: { origins: string[] }): Promise<boolean>;
  };
};
