export interface Transport {
  onData?: (buf: Buffer) => void;
  send: (buf: Buffer) => void;
  close: () => void;
}
