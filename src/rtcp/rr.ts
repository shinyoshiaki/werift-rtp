import { assignClassProperties } from "../helper";

export class RtcpReceiverInfo {
  ssrc: number;
  fractionLost: number;
  packetsLost: number;
  highestSequence: number;
  jitter: number;
  lsr: number;
  dlsr: number;

  constructor(props: Partial<RtcpReceiverInfo> = {}) {
    assignClassProperties(this, props);
  }

  serialize() {
    const buf = Buffer.alloc(24);
    let offset = 0;
    buf.writeUInt32BE(this.ssrc, offset);
    offset += 4;
    buf.writeUInt8(this.fractionLost, offset);
    offset++;
    buf.writeUIntBE(this.packetsLost, offset, 3);
    offset += 3;
    buf.writeUInt32BE(this.highestSequence, offset);
    offset += 4;
    buf.writeUInt32BE(this.jitter, offset);
    offset += 4;
    buf.writeUInt32BE(this.lsr, offset);
    offset += 4;
    buf.writeUInt32BE(this.dlsr, offset);
    return buf;
  }

  static deSerialize(data: Buffer) {
    let offset = 0;
    const ssrc = data.readUInt32BE(offset);
    offset += 4;
    const fractionLost = data.readUInt8(offset);
    offset++;
    const packetsLost = data.readUIntBE(offset, 3);
    offset += 3;
    const highestSequence = data.readUInt32BE(offset);
    offset += 4;
    const jitter = data.readUInt32BE(offset);
    offset += 4;
    const lsr = data.readUInt32BE(offset);
    offset += 4;
    const dlsr = data.readUInt32BE(offset);
    return new RtcpReceiverInfo({
      ssrc,
      fractionLost,
      packetsLost,
      highestSequence,
      jitter,
      lsr,
      dlsr,
    });
  }
}
