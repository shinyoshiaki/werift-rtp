import { Header } from "../rtp/rtp";
import { createCipheriv, createDecipheriv } from "crypto";
import { Context } from "./context";

export class Srtp {
  constructor(public context: Context) {}
  decryptRTP(ciphertext: Buffer, dst: Buffer = Buffer.from([])) {
    const header = Header.deSerialize(ciphertext);

    const s = this.context.getSRTPSRRCState(header.ssrc);

    dst = Buffer.concat([dst, Buffer.alloc(ciphertext.length - 10)]);
    this.context.updateRolloverCount(header.sequenceNumber, s);

    ciphertext = ciphertext.slice(0, ciphertext.length - 10);

    ciphertext.slice(0, header.payloadOffset).copy(dst);

    const counter = this.context.generateCounter(
      header.sequenceNumber,
      s.rolloverCounter,
      s.ssrc,
      this.context.srtpSessionSalt
    );
    const cipher = createDecipheriv(
      "aes-128-ctr",
      this.context.srtpSessionKey,
      counter
    );
    const payload = ciphertext.slice(header.payloadOffset);
    const buf = cipher.update(payload);

    for (
      let i = header.payloadOffset, j = 0;
      i < header.payloadOffset + payload.length;
      i++, j++
    ) {
      dst[i] = dst[i] ^ buf[j];
    }

    return dst;
  }

  encryptRTP(plaintext: Buffer, dst: Buffer = Buffer.from([])) {
    const header = Header.deSerialize(plaintext);
    const payload = plaintext.slice(header.payloadOffset);

    dst = Buffer.concat([
      dst,
      Buffer.alloc(header.serializeSize + payload.length + 10),
    ]);

    const s = this.context.getSRTPSRRCState(header.ssrc);
    this.context.updateRolloverCount(header.sequenceNumber, s);

    header.serialize(dst.length).copy(dst);
    let n = header.payloadOffset;

    const counter = this.context.generateCounter(
      header.sequenceNumber,
      s.rolloverCounter,
      s.ssrc,
      this.context.srtpSessionSalt
    );

    const cipher = createCipheriv(
      "aes-128-ctr",
      this.context.srtpSessionKey,
      counter
    );
    const buf = cipher.update(payload);
    for (let i = n, j = 0; j < buf.length; i++, j++) {
      dst[i] = dst[i] ^ buf[j];
    }
    n += payload.length;

    const authTag = this.context.generateSrtpAuthTag(
      dst.slice(0, n),
      s.rolloverCounter
    );
    authTag.copy(dst, n);
    return dst;
  }
}
