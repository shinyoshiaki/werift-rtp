import { Transport } from "../../transport";
import { Session } from "./session";

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

export class SrtpSession {
  session = new Session(this.transport);

  constructor(public transport: Transport, public config: Config) {
    this.session.start(
      config.keys.localMasterKey,
      config.keys.localMasterSalt,
      config.keys.remoteMasterKey,
      config.keys.remoteMasterSalt,
      config.profile,
      this.decrypt
    );
  }

  decrypt = (buf: Buffer) => {
    const [decrypted] = this.session.remoteContext.decryptRTP(buf, buf);
    return decrypted;
  };
}
