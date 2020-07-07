import { Header } from "../rtp/rtp";
import { createCipher } from "crypto";
import { Context } from "./context";

export class Srtp {
  constructor(public context: Context) {}

  encryptRTP(header: Header, payload: Buffer) {
    const dst = Buffer.alloc(header.serializeSize + payload.length + 10);

    const s = this.context.getSRTPSRRCState(header.ssrc);
    this.context.updateRolloverCount(header.sequenceNumber, s);

    header.serialize(dst.length);
    const n = header.payloadOffset;

    // const counter = this.context.generateCounter(
    //   header.sequenceNumber,
    //   s.rolloverCounter,
    //   s.ssrc,
    //   this.context.srtpSSRCStates
    // );
    const cipher = createCipher("aes-256-ctr", "");
  }
}
