import { readFileSync } from "fs";

export function load(name: string) {
  const data = readFileSync("./tests/data/" + name);
  return data;
}
