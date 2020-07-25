import { RtpHeader } from "../../rtp/rtp";
import { createCipheriv, createDecipheriv } from "crypto";
import { Context } from "./context";
import { growBufferSize } from "../../helper";

export class SrtcpContext extends Context {
  constructor(masterKey: Buffer, masterSalt: Buffer, profile: number) {
    super(masterKey, masterSalt, profile);
  }
  decryptRTCP(encrypted: Buffer): Buffer {
    const tailOffset = encrypted.length - (10 + 4);
    const out = Buffer.from(encrypted).slice(0, tailOffset);

    const isEncrypted = encrypted[tailOffset] >> 7;
    if (isEncrypted === 0) return out;

    let index = encrypted.readUInt32BE(tailOffset);
    index &= ~(1 << 31);

    const ssrc = encrypted.readUInt32BE(4);

    const actualTag = encrypted.slice(encrypted.length - 10);

    const counter = this.generateCounter(
      index & 0xffff,
      index >> 16,
      ssrc,
      this.srtcpSessionSalt
    );
    const cipher = createDecipheriv(
      "aes-128-ctr",
      this.srtcpSessionKey,
      counter
    );
    const payload = out.slice(8);
    const buf = cipher.update(payload);
    buf.copy(out, 8);
    return out;
  }

  encryptRTCP(plaintext: Buffer, header?: RtpHeader): [Buffer, RtpHeader] {
    header = header || RtpHeader.deSerialize(plaintext);
    const payload = plaintext.slice(header.payloadOffset);

    let dst = Buffer.from([]);
    dst = growBufferSize(dst, header.serializeSize + payload.length + 10);

    const s = this.getSRTPSRRCState(header.ssrc);
    this.updateRolloverCount(header.sequenceNumber, s);

    header.serialize(dst.length).copy(dst);
    let n = header.payloadOffset;

    const counter = this.generateCounter(
      header.sequenceNumber,
      s.rolloverCounter,
      s.ssrc,
      this.srtpSessionSalt
    );

    const cipher = createCipheriv("aes-128-ctr", this.srtpSessionKey, counter);
    const buf = cipher.update(payload);
    buf.copy(dst, header.payloadOffset);
    n += payload.length;

    const authTag = this.generateSrtpAuthTag(
      dst.slice(0, n),
      s.rolloverCounter
    );
    authTag.copy(dst, n);
    return [dst, header];
  }
}
