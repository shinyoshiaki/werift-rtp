import { RtpPacket } from "../src/rtp/packet";
import { load } from "./utils";
import { RtcpPacket } from "../src/rtcp/packet";
import { RtcpSrPacket } from "../src/rtcp/sr";
import { RtcpRrPacket } from "../src/rtcp/rr";

describe("packet", () => {
  test("basic", () => {
    const raw = Buffer.from([
      0x90,
      0xe0,
      0x69,
      0x8f,
      0xd9,
      0xc2,
      0x93,
      0xda,
      0x1c,
      0x64,
      0x27,
      0x82,
      0x00,
      0x01,
      0x00,
      0x01,
      0xff,
      0xff,
      0xff,
      0xff,
      0x98,
      0x36,
      0xbe,
      0x88,
      0x9e,
    ]);

    const parsed = RtpPacket.deSerialize(raw);
    expect(parsed.header.version).toBe(2);
    expect(parsed.header.marker).toBe(true);
    expect(parsed.header.extension).toBe(true);
    expect(parsed.header.sequenceNumber).toBe(27023);
    expect(parsed.header.timestamp).toBe(3653407706);
    expect(parsed.header.ssrc).toBe(476325762);
    expect(parsed.header.extensionProfile).toBe(1);
    expect(parsed.header.extensions).toEqual([
      { id: 0, payload: Buffer.from([0xff, 0xff, 0xff, 0xff]) },
    ]);
    expect(parsed.header.payloadOffset).toBe(20);
    expect(parsed.header.payloadType).toBe(96);

    expect(parsed.header.serializeSize).toBe(20);
    expect(parsed.serializeSize).toBe(raw.length);
    const serialized = parsed.serialize();
    expect(serialized).toEqual(raw);
  });

  test("TestRFC8285OneByteExtension", () => {
    const raw = Buffer.from([
      0x90,
      0xe0,
      0x69,
      0x8f,
      0xd9,
      0xc2,
      0x93,
      0xda,
      0x1c,
      0x64,
      0x27,
      0x82,
      0xbe,
      0xde,
      0x00,
      0x01,
      0x50,
      0xaa,
      0x00,
      0x00,
      0x98,
      0x36,
      0xbe,
      0x88,
      0x9e,
    ]);
    const p = RtpPacket.deSerialize(raw);
    expect(p.header.extension).toBe(true);
    expect(p.header.extensionProfile).toBe(0xbede);
    expect(p.header.extensions).toEqual([
      { id: 5, payload: Buffer.from([0xaa]) },
    ]);
  });

  test("TestRFC8285OneByteTwoExtensionOfTwoBytes", () => {
    const raw = Buffer.from([
      0x90,
      0xe0,
      0x69,
      0x8f,
      0xd9,
      0xc2,
      0x93,
      0xda,
      0x1c,
      0x64,
      0x27,
      0x82,
      0xbe,
      0xde,
      0x00,
      0x01,
      0x10,
      0xaa,
      0x20,
      0xbb,
      0x98,
      0x36,
      0xbe,
      0x88,
      0x9e,
    ]);

    const p = RtpPacket.deSerialize(raw);
    expect(p.header.extensionProfile).toBe(0xbede);
    expect(p.header.extensions).toEqual([
      { id: 1, payload: Buffer.from([0xaa]) },
      { id: 2, payload: Buffer.from([0xbb]) },
    ]);
  });

  test("dtmf", () => {
    const data = load("rtp_dtmf.bin");
    const p = RtpPacket.deSerialize(data);
    const h = p.header;
    expect(h.version).toBe(2);
    expect(h.marker).toBe(true);
    expect(h.payloadType).toBe(101);
    expect(h.sequenceNumber).toBe(24152);
    expect(h.timestamp).toBe(4021352124);
    expect(h.csrc).toEqual([]);
    expect(h.extensions).toEqual([]);
    expect(p.payload.length).toBe(4);
    expect(p.serialize()).toEqual(data);
  });

  test("test_no_ssrc", () => {
    const data = load("rtp.bin");
    const p = RtpPacket.deSerialize(data);
    const h = p.header;
    expect(h.version).toBe(2);
    expect(h.marker).toBe(false);
    expect(h.payloadType).toBe(0);
    expect(h.sequenceNumber).toBe(15743);
    expect(h.timestamp).toBe(3937035252);
    expect(h.csrc).toEqual([]);
    expect(h.extensions).toEqual([]);
    expect(p.payload.length).toBe(160);
    expect(p.serialize()).toEqual(data);
  });

  test("test_padding_only_with_header_extensions", () => {
    const data = load("rtp_only_padding_with_header_extensions.bin");
    const p = RtpPacket.deSerialize(data);
    const h = p.header;
    expect(h.version).toBe(2);
    expect(h.marker).toBe(false);
    expect(h.payloadType).toBe(98);
    expect(h.sequenceNumber).toBe(22138);
    expect(h.timestamp).toBe(3171065731);
    expect(h.csrc).toEqual([]);
    const payload = Buffer.alloc(3);
    payload.writeUIntBE(15846540, 0, 3);
    expect(h.extensions).toEqual([{ id: 2, payload }]);
    expect(h.padding).toBe(true);
    expect(h.paddingSize).toBe(224);
    expect(p.payload.length).toBe(0);
    expect(p.serialize()).toEqual(data);
  });

  test("test_with_csrc", () => {
    const data = load("rtp_with_csrc.bin");
    const p = RtpPacket.deSerialize(data);
    const h = p.header;
    expect(h.version).toBe(2);
    expect(h.marker).toBe(false);
    expect(h.payloadType).toBe(0);
    expect(h.sequenceNumber).toBe(16082);
    expect(h.timestamp).toBe(144);
    expect(h.csrc).toEqual([2882400001, 3735928559]);
    expect(p.header.extensions).toEqual([]);
    expect(p.payload.length).toBe(160);
    const buf = p.serialize();
    expect(buf).toEqual(data);
  });

  test("test_sr", () => {
    const data = load("rtcp_sr.bin");
    const packets = RtcpPacket.deSerialize(data) as RtcpSrPacket[];
    expect(packets.length).toBe(1);

    const packet = packets[0];
    expect(packet.ssrc).toBe(1831097322);
    expect(packet.senderInfo.ntpTimestamp).toBe(BigInt("16016567581311369308"));
    expect(packet.senderInfo.rtpTimestamp).toBe(1722342718);
    expect(packet.senderInfo.packetCount).toBe(269);
    expect(packet.senderInfo.octetCount).toBe(13557);
    expect(packet.reports.length).toBe(1);
    const report = packet.reports[0];
    expect(report.ssrc).toBe(2398654957);
    expect(report.fractionLost).toBe(0);
    expect(report.packetsLost).toBe(0);
    expect(report.highestSequence).toBe(246);
    expect(report.jitter).toBe(127);
    expect(report.lsr).toBe(0);
    expect(report.dlsr).toBe(0);

    expect(data).toEqual(packet.serialize());
  });

  test("test_rr", () => {
    const data = load("rtcp_rr.bin");
    const packets = RtcpPacket.deSerialize(data) as RtcpRrPacket[];
    expect(packets.length).toBe(1);

    const packet = packets[0];
    expect(packet.ssrc).toBe(817267719);
    const report = packet.reports[0];
    expect(report.ssrc).toBe(1200895919);
    expect(report.fractionLost).toBe(0);
    expect(report.packetsLost).toBe(0);
    expect(report.highestSequence).toBe(630);
    expect(report.jitter).toBe(1906);
    expect(report.lsr).toBe(0);
    expect(report.dlsr).toBe(0);

    expect(data).toEqual(packet.serialize());
  });
});
