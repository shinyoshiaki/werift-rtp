import { Packet } from "../src/packet";

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

    const parsed = Packet.deSerialize(raw);
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
    const p = Packet.deSerialize(raw);
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

    const p = Packet.deSerialize(raw);
    expect(p.header.extensionProfile).toBe(0xbede);
    expect(p.header.extensions).toEqual([
      { id: 1, payload: Buffer.from([0xaa]) },
      { id: 2, payload: Buffer.from([0xbb]) },
    ]);
  });
});
