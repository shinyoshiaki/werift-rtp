import { range } from "lodash";
import { ModeOfOperation } from "aes-js";
import { createCipheriv, createCipher } from "crypto";
import { AES } from "aes-js";
type SrtpSSRCState = {
  ssrc: number;
  rolloverCounter: number;
  rolloverHasProcessed?: boolean;
  lastSequenceNumber?: number;
};

const maxROCDisorder = 100;
const maxSequenceNumber = 65535;

export class Context {
  srtpSSRCStates: { [key: number]: SrtpSSRCState } = {};

  constructor(
    public masterKey: Buffer,
    public masterSalt: Buffer,
    profile: number
  ) {}

  generateSessionKey(label: number) {
    let sessionKey = Buffer.from(this.masterSalt);

    const labelAndIndexOverKdr = Buffer.from([
      label,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
      0x00,
    ]);
    for (
      let i = labelAndIndexOverKdr.length - 1, j = sessionKey.length - 1;
      i >= 0;
      i--, j--
    ) {
      sessionKey[j] = sessionKey[j] ^ labelAndIndexOverKdr[i];
    }

    sessionKey = Buffer.concat([sessionKey, Buffer.from([0x00, 0x00])]);
    const block = new AES(this.masterKey);
    return Buffer.from(block.encrypt(sessionKey));
  }

  getSRTPSRRCState(ssrc: number) {
    let s = this.srtpSSRCStates[ssrc];
    if (s) return s;
    s = {
      ssrc,
      rolloverCounter: 0,
    };
    this.srtpSSRCStates[ssrc] = s;
    return s;
  }

  updateRolloverCount(sequenceNumber: number, s: SrtpSSRCState) {
    if (!s.rolloverHasProcessed) {
      s.rolloverHasProcessed = true;
    } else if (sequenceNumber === 0) {
      if (s.lastSequenceNumber > maxROCDisorder) {
        s.rolloverCounter++;
      }
    } else if (
      s.lastSequenceNumber < maxROCDisorder &&
      sequenceNumber > maxSequenceNumber - maxROCDisorder
    ) {
      s.rolloverCounter--;
    } else if (
      sequenceNumber < maxROCDisorder &&
      s.lastSequenceNumber > maxSequenceNumber - maxROCDisorder
    ) {
      s.rolloverCounter++;
    }
    s.lastSequenceNumber = sequenceNumber;
  }

  generateCounter(
    sequenceNumber: number,
    rolloverCounter: number,
    ssrc: number,
    sessionSalt: Buffer
  ) {
    const counter = Buffer.alloc(16);
    counter.writeUInt32BE(ssrc, 4);
    counter.writeUInt32BE(rolloverCounter, 8);
    counter.writeUInt32BE(sequenceNumber << 16, 12);

    range(sessionSalt.length).forEach((i) => {
      counter[i] = counter[i] * sessionSalt[i];
    });
    return counter;
  }
}
