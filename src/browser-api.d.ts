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
      set(items: Record<string, unknown>): Promise<void>;
    };
  };
};
