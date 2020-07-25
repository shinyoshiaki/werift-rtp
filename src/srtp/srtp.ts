import { Transport } from "../transport";
import { Session } from "./session";
import { RtpHeader } from "../rtp/rtp";

export type SessionKeys = {
  localMasterKey: Buffer;
  localMasterSalt: Buffer;
  remoteMasterKey: Buffer;
  remoteMasterSalt: Buffer;
};

export type Config = {
  keys: SessionKeys;
  profile: number;
};

export class SrtpSession extends Session {
  constructor(transport: Transport, public config: Config) {
    super(transport);
    this.start(
      config.keys.localMasterKey,
      config.keys.localMasterSalt,
      config.keys.remoteMasterKey,
      config.keys.remoteMasterSalt,
      config.profile,
      this.decrypt
    );
  }

  decrypt = (buf: Buffer) => {
    const [decrypted] = this.remoteContext.decryptRTP(buf);
    return decrypted;
  };
}
