import { sleep } from "k6";
import { stressOptions } from "./config";
import { getHealth } from "./requests";

export const options = stressOptions;

export default function () {
  getHealth();
  sleep(0.5);
}
