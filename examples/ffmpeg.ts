import { createSocket } from "dgram";
import { spawn } from "child_process";
import { Packet } from "../src";

const socket = createSocket("udp4");
socket.bind(5004);
socket.on("listening", () => {
  const ffmpeg = spawn("ffmpeg", [
    "-re",
    "-f",
    "lavfi",
    "-i",
    "testsrc=size=640x480:rate=30",
    "-vcodec",
    "libvpx",
    "-cpu-used",
    "5",
    "-deadline",
    "1",
    "-g",
    "10",
    "-error-resilient",
    "1",
    "-auto-alt-ref",
    "1",
    "-f",
    "rtp",
    "rtp://127.0.0.1:5004",
  ]);
});

socket.on("message", (data) => {
  const p = Packet.deSerialize(data);
  console.log(data);
});

"ffmpeg -re -f lavfi -i testsrc=size=640x480:rate=30 -vcodec libvpx -cpu-used 5 -deadline 1 -g 10 -error-resilient 1 -auto-alt-ref 1 -f rtp rtp://127.0.0.1:5004";
