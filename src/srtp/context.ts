import { range } from "lodash";
import { AES } from "aes-js";
import { createHmac } from "crypto";
import bigInt from "big-integer";

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
  srtpSessionKey = this.generateSessionKey(0);
  srtpSessionSalt = this.generateSessionSalt(2);
  srtpSessionAuthTag = this.generateSessionAuthTag(1);
  srtpBlock = new AES(this.srtpSessionKey);
  srtpSessionAuth = createHmac("sha1", this.srtpSessionAuthTag);
  srtcpSessionKey = this.generateSessionKey(3);
  srtcpSessionSalt = this.generateSessionSalt(5);
  srtcpSessionAuthTag = this.generateSessionAuthTag(4);
  srtcpBlock = new AES(this.srtcpSessionKey);
  srtcpSessionAuth = createHmac("sha1", this.srtcpSessionAuthTag);

  constructor(
    public masterKey: Buffer,
    public masterSalt: Buffer,
    public profile: number
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

  generateSessionSalt(label: number) {
    let sessionSalt = Buffer.from(this.masterSalt);
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
      let i = labelAndIndexOverKdr.length - 1, j = sessionSalt.length - 1;
      i >= 0;
      i--, j--
    ) {
      sessionSalt[j] = sessionSalt[j] ^ labelAndIndexOverKdr[i];
    }
    sessionSalt = Buffer.concat([sessionSalt, Buffer.from([0x00, 0x00])]);
    const block = new AES(this.masterKey);
    sessionSalt = Buffer.from(block.encrypt(sessionSalt));
    return sessionSalt.slice(0, 14);
  }

  generateSessionAuthTag(label: number) {
    const sessionAuthTag = Buffer.from(this.masterSalt);
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
      let i = labelAndIndexOverKdr.length - 1, j = sessionAuthTag.length - 1;
      i >= 0;
      i--, j--
    ) {
      sessionAuthTag[j] = sessionAuthTag[j] ^ labelAndIndexOverKdr[i];
    }
    let firstRun = Buffer.concat([sessionAuthTag, Buffer.from([0x00, 0x00])]);
    let secondRun = Buffer.concat([sessionAuthTag, Buffer.from([0x00, 0x01])]);
    const block = new AES(this.masterKey);
    firstRun = Buffer.from(block.encrypt(firstRun));
    secondRun = Buffer.from(block.encrypt(secondRun));
    return Buffer.concat([firstRun, secondRun.slice(0, 4)]);
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
    counter.writeUInt32BE(
      bigInt(sequenceNumber).shiftLeft(16).toJSNumber(),
      12
    );

    range(sessionSalt.length).forEach((i) => {
      counter[i] = counter[i] ^ sessionSalt[i];
    });
    return counter;
  }
}
