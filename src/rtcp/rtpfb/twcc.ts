import { bufferReader, bufferWriter } from "../../helper";
import { getBit, BitWriter } from "../../utils";

export enum PacketChunk {
  TypeTCCRunLengthChunk,
  TypeTCCStatusVectorChunk,
  packetStatusChunkLength,
}

export enum PacketStatus {
  TypeTCCPacketNotReceived,
  TypeTCCPacketReceivedSmallDelta,
  TypeTCCPacketReceivedLargeDelta,
  TypeTCCPacketReceivedWithoutDelta,
}

type RecvDelta = { type: number; delta: number };

export class TransportWideCC {
  static count = 15;
  count = TransportWideCC.count;
  length = 2;

  senderSsrc: number;
  mediaSsrc: number;
  baseSequenceNumber: number;
  packetStatusCount: number;
  referenceTime: number;
  fbPktCount: number;
  packetChunks: any[] = [];
  recvDeltas: RecvDelta[] = [];

  constructor(props: Partial<TransportWideCC> = {}) {
    Object.assign(this, props);
  }

  static deSerialize(data: Buffer) {
    const [
      senderSsrc,
      mediaSsrc,
      baseSequenceNumber,
      packetStatusCount,
      referenceTime,
      fbPktCount,
    ] = bufferReader(data, [4, 4, 2, 2, 3, 1]);
    const packetChunks = [];
    let packetStatusPos = 16;
    for (let processedPacketNum = 0; processedPacketNum < packetStatusCount; ) {
      const type = getBit(packetStatusPos, 0, 1);
      let iPacketStatus: any;
      switch (type) {
        case PacketChunk.TypeTCCRunLengthChunk:
          break;
      }
      packetStatusPos += 2;
      packetChunks.push(iPacketStatus);
    }

    return new TransportWideCC({
      senderSsrc,
      mediaSsrc,
      baseSequenceNumber,
      packetStatusCount,
      referenceTime,
      fbPktCount,
    });
  }

  serialize() {
    return bufferWriter([4, 4], [this.senderSsrc, this.mediaSsrc]);
  }
}

export class RunLengthChunk {
  type: number;
  packetStatus: number;
  runLength: number;

  constructor(props: Partial<RunLengthChunk> = {}) {
    Object.assign(this, props);
  }

  static deSerialize(data: Buffer) {
    const packetStatus = getBit(data[0], 1, 2);
    const runLength = (getBit(data[0], 3, 5) << 8) + data[1];

    return new RunLengthChunk({ type: 0, packetStatus, runLength });
  }

  serialize() {
    const writer = new BitWriter(16);
    writer.set(1, 0, 0);
    writer.set(2, 1, this.packetStatus);
    writer.set(13, 3, this.runLength);

    const buf = Buffer.alloc(2);
    buf.writeUInt16BE(writer.value);
    return buf;
  }
}
