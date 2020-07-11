import { RtpHeader } from "../rtp/rtp";
import { createCipheriv, createDecipheriv } from "crypto";
import { Context } from "./context";
import { growBufferSize } from "../helper";

export class Srtp {
  constructor(public context: Context) {}
  decryptRTP(
    ciphertext: Buffer,
    dst: Buffer = Buffer.from([])
  ): [Buffer, RtpHeader] {
    const header = RtpHeader.deSerialize(ciphertext);

    const s = this.context.getSRTPSRRCState(header.ssrc);

    dst = growBufferSize(dst, ciphertext.length - 10);
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
    buf.copy(dst, header.payloadOffset);

    return [dst, header];
  }

  encryptRTP(
    plaintext: Buffer,
    dst: Buffer = Buffer.from([])
  ): [Buffer, RtpHeader] {
    const header = RtpHeader.deSerialize(plaintext);
    const payload = plaintext.slice(header.payloadOffset);

    dst = growBufferSize(dst, header.serializeSize + payload.length + 10);

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
    buf.copy(dst, header.payloadOffset);
    n += payload.length;

    const authTag = this.context.generateSrtpAuthTag(
      dst.slice(0, n),
      s.rolloverCounter
    );
    authTag.copy(dst, n);
    return [dst, header];
  }
}
