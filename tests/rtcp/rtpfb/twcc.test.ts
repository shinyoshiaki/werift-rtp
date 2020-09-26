import {
  PacketChunk,
  PacketStatus,
  RunLengthChunk,
} from "../../../src/rtcp/rtpfb/twcc";

describe("rtcp/rtpfb/twcc", () => {
  test("RunLength deserialize", () => {
    {
      const res = RunLengthChunk.deSerialize(Buffer.from([0x00, 0xdd]));
      expect(res.type).toBe(PacketChunk.TypeTCCRunLengthChunk);
      expect(res.packetStatus).toBe(PacketStatus.TypeTCCPacketNotReceived);
      expect(res.runLength).toBe(221);
    }
    {
      const res = RunLengthChunk.deSerialize(Buffer.from([0x60, 0x18]));
      expect(res.type).toBe(PacketChunk.TypeTCCRunLengthChunk);
      expect(res.packetStatus).toBe(
        PacketStatus.TypeTCCPacketReceivedWithoutDelta
      );
      expect(res.runLength).toBe(24);
    }
  });

  test("RunLength serialize", () => {
    {
      const buf = new RunLengthChunk({
        type: PacketChunk.TypeTCCRunLengthChunk,
        packetStatus: PacketStatus.TypeTCCPacketNotReceived,
        runLength: 221,
      }).serialize();
      expect(buf).toEqual(Buffer.from([0x00, 0xdd]));
    }
    {
      const buf = new RunLengthChunk({
        type: PacketChunk.TypeTCCRunLengthChunk,
        packetStatus: PacketStatus.TypeTCCPacketReceivedWithoutDelta,
        runLength: 24,
      }).serialize();
      const expected = Buffer.from([0x60, 0x18]);
      expect(buf).toEqual(expected);
    }
  });
});
