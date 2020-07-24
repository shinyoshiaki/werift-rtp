import { SrtpContext } from "../context";
import { Transport } from "../../transport";
import { Srtp } from "../srtp";

export class Session {
  localContext: Srtp;
  remoteContext: Srtp;
  onData?: (buf: Buffer) => void;

  constructor(private transport: Transport) {}

  start(
    localMasterKey: Buffer,
    localMasterSalt: Buffer,
    remoteMasterKey: Buffer,
    remoteMasterSalt: Buffer,
    profile: number,
    decrypt: (buf: Buffer) => Buffer
  ) {
    this.localContext = new Srtp(localMasterKey, localMasterSalt, profile);
    this.remoteContext = new Srtp(remoteMasterKey, remoteMasterSalt, profile);

    this.transport.onData = (data) => {
      const dec = decrypt(data);
      this.onData(dec);
    };
  }
}
