import { Srtp } from "../../src/srtp/srtp";
import { Context } from "../../src/srtp/context";
import { RtpPacket, Header } from "../../src/rtp/rtp";

describe("srtp/srtp", () => {
  function buildTestContext() {
    const masterKey = Buffer.from([
      0x0d,
      0xcd,
      0x21,
      0x3e,
      0x4c,
      0xbc,
      0xf2,
      0x8f,
      0x01,
      0x7f,
      0x69,
      0x94,
      0x40,
      0x1e,
      0x28,
      0x89,
    ]);
    const masterSalt = Buffer.from([
      0x62,
      0x77,
      0x60,
      0x38,
      0xc0,
      0x6d,
      0xc9,
      0x41,
      0x9f,
      0x6d,
      0xd9,
      0x43,
      0x3e,
      0x7c,
    ]);

    return new Srtp(new Context(masterKey, masterSalt, 1));
  }
  test("TestRTPLifecyleNewAlloc", () => {
    const encryptContext = buildTestContext();

    const decryptedPkt = new RtpPacket(
      new Header({ sequenceNumber: 5000 }),
      Buffer.from([0x00, 0x01, 0x02, 0x03, 0x04, 0x05])
    );
    const decryptedRaw = decryptedPkt.serialize();

    // const actualEncrypted = encryptContext.encryptRTP();
  });
});
