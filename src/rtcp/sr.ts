import { assignClassProperties } from "../helper";
import { range } from "lodash";
import { RtcpReceiverInfo } from "./rr";

export class RtcpSrPacket {
  ssrc: number;
  senderInfo: RtcpSenderInfo;
  reports: RtcpReceiverInfo[] = [];
  static type = 200;

  constructor(props: Partial<RtcpSrPacket> = {}) {
    assignClassProperties(this, props);
  }

  serialize() {}

  static deSerialize(data: Buffer, count: number) {
    const ssrc = data.readUInt32BE();
    const senderInfo = RtcpSenderInfo.deSerialize(data.slice(4, 24));
    let pos = 24;
    const reports = [];
    for (const _ of range(count)) {
      reports.push(RtcpReceiverInfo.deSerialize(data.slice(pos, pos + 24)));
      pos += 24;
    }
    return new RtcpSrPacket({ ssrc, senderInfo, reports });
  }
}

class RtcpSenderInfo {
  ntpTimestamp: bigint;
  rtpTimestamp: number;
  packetCount: number;
  octetCount: number;

  constructor(props: Partial<RtcpSenderInfo> = {}) {
    assignClassProperties(this, props);
  }

  serialize() {}

  static deSerialize(data: Buffer) {
    let offset = 0;
    const ntpTimestamp = data.readBigUInt64BE(offset);
    offset += 8;
    const rtpTimestamp = data.readUInt32BE(offset);
    offset += 4;
    const packetCount = data.readUInt32BE(offset);
    offset += 4;
    const octetCount = data.readUInt32BE(offset);

    return new RtcpSenderInfo({
      ntpTimestamp,
      rtpTimestamp,
      packetCount,
      octetCount,
    });
  }
}
