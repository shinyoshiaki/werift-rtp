import { RtcpSrPacket } from "./sr";

export class RtcpPacket {
  static deSerialize(data: Buffer) {
    let pos = 0;
    const packets = [];

    while (pos < data.length) {
      let offset = 0;
      const v_p_rc = data.slice(pos).readUInt8(offset);
      offset++;
      const version = v_p_rc >> 6;
      const padding = ((v_p_rc >> 5) & 1) > 0;
      const count = v_p_rc & 0x1f;
      const packetType = data.slice(pos).readUInt8(offset);
      offset++;
      const length = data.slice(pos).readUInt16BE(offset);
      offset += 2;

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
      }

      return packets;
    }
  }
}