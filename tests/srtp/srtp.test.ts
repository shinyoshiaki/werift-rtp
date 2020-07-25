import { SrtpSession } from "../../src/srtp/srtp";
import { createMockTransportPair } from "../utils";
import { RtpHeader, RtpPacket } from "../../src/rtp/rtp";
import { Config } from "../../src/srtp/session";

function buildSessionSRTPPair(): [SrtpSession, SrtpSession] {
  const config: Config = {
    profile: 0x0001,
    keys: {
      localMasterKey: Buffer.from([
        0xe1,
        0xf9,
        0x7a,
        0x0d,
        0x3e,
        0x01,
        0x8b,
        0xe0,
        0xd6,
        0x4f,
        0xa3,
        0x2c,
        0x06,
        0xde,
        0x41,
        0x39,
      ]),
      localMasterSalt: Buffer.from([
        0x0e,
        0xc6,
        0x75,
        0xad,
        0x49,
        0x8a,
        0xfe,
        0xeb,
        0xb6,
        0x96,
        0x0b,
        0x3a,
        0xab,
        0xe6,
      ]),
      remoteMasterKey: Buffer.from([
        0xe1,
        0xf9,
        0x7a,
        0x0d,
        0x3e,
        0x01,
        0x8b,
        0xe0,
        0xd6,
        0x4f,
        0xa3,
        0x2c,
        0x06,
        0xde,
        0x41,
        0x39,
      ]),
      remoteMasterSalt: Buffer.from([
        0x0e,
        0xc6,
        0x75,
        0xad,
        0x49,
        0x8a,
        0xfe,
        0xeb,
        0xb6,
        0x96,
        0x0b,
        0x3a,
        0xab,
        0xe6,
      ]),
    },
  };
  const [a, b] = createMockTransportPair();
  const aSession = new SrtpSession(a, config);
  const bSession = new SrtpSession(b, config);

  return [aSession, bSession];
}

describe("srtp", () => {
  test("TestSessionSRTP", () => {
    const testPayload = Buffer.from([0x00, 0x01, 0x03, 0x04]);
    const [aSession, bSession] = buildSessionSRTPPair();

    bSession.transport.onData = (buf) => {
      const dec = bSession.decrypt(buf);
      const rtp = RtpPacket.deSerialize(buf);
      expect(rtp.header.ssrc).toBe(5000);
      expect(testPayload).toEqual(dec.slice(12));
    };

    aSession.sendRTP(new RtpHeader({ ssrc: 5000 }), testPayload);
  });
});
