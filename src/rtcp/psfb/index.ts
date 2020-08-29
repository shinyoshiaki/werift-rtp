import { FullIntraRequest } from "./fullIntraRequest";

type Feedback = FullIntraRequest;

export class RtcpPayloadSpecificFeedback {
  static type = 206;
  type = RtcpPayloadSpecificFeedback;

  feedback: Feedback;

  constructor(props: Partial<RtcpPayloadSpecificFeedback> = {}) {
    Object.assign(this, props);
  }

  serialize() {
    return this.feedback.serialize();
  }

  static deSerialize(data: Buffer, count: number) {
    let feedback: Feedback;

    switch (count) {
      case FullIntraRequest.count:
        feedback = FullIntraRequest.deSerialize(data);
        break;
    }

    return new RtcpPayloadSpecificFeedback({ feedback });
  }
}
