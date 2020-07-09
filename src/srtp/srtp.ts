import { Header } from "../rtp/rtp";
import { createCipheriv } from "crypto";
import { Context } from "./context";

export class Srtp {
  constructor(public context: Context) {}

  encryptRTP(dst: Buffer, plaintext: Buffer) {
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
