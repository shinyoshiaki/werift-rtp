import { RtcpPacketConverter } from "../rtcp";
import { TransportWideCC } from "./twcc";

type Feedback = TransportWideCC;

export class RtcpFeedback {
  static type = 205;
  type = RtcpFeedback.type;

  feedback: Feedback;

  constructor(props: Partial<RtcpFeedback> = {}) {
    Object.assign(this, props);
  }

  serialize() {
    const payload = this.feedback.serialize();
    return RtcpPacketConverter.serialize(
      this.type,
      this.feedback.count,
      payload,
      this.feedback.length
    );
  }

  static deSerialize(data: Buffer, count: number) {
    let feedback: Feedback;

    switch (count) {
      case TransportWideCC.count:
        feedback = TransportWideCC.deSerialize(data);
        break;
      default:
        console.log("unknown rtpfb packet", count);
        break;
    }

    return new RtcpFeedback({ feedback });
  }
}
