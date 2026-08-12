declare const browser: {
  action: {
    onClicked: {
      addListener(listener: () => Promise<void> | void): void;
    };
  };
  sidebarAction: {
    open(): Promise<void>;
  };
};
