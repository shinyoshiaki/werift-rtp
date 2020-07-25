import { RtcpSrPacket } from "./sr";
import { RtcpRrPacket } from "./rr";
import { bufferWriter, bufferReader } from "../helper";

export class RtcpPacket {
  static serialize(packetType: number, count: number, payload: Buffer) {
    const buf = bufferWriter(
      [1, 1, 2],
      [(2 << 6) | count, packetType, Math.floor(payload.length / 4)]
    );
    return Buffer.concat([buf, payload]);
  }
  static deSerialize(data: Buffer) {
    let pos = 0;
    const packets = [];

    while (pos < data.length) {
      const [v_p_rc, packetType, length] = bufferReader(data, [1, 1, 2]);

      const version = v_p_rc >> 6;
      const padding = ((v_p_rc >> 5) & 1) > 0;
      const count = v_p_rc & 0x1f;

      pos += 4;

      const end = pos + length * 4;
      let payload = data.slice(pos, end);
      pos = end;

      if (padding) {
        payload = payload.slice(0, payload.length - payload.slice(-1)[0]);
      }

      switch (packetType) {
        case RtcpSrPacket.type:
          packets.push(RtcpSrPacket.deSerialize(payload, count));
          break;
        case RtcpRrPacket.type:
          packets.push(RtcpRrPacket.deSerialize(payload, count));
          break;
      }

      return packets;
    }
  }
}
