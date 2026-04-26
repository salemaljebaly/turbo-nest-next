import { sleep } from "k6";
import { loadOptions } from "./config";
import { getHealth } from "./requests";

export const options = loadOptions;

export default function () {
  getHealth();
  sleep(1);
}
