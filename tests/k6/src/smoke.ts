import { smokeOptions } from "./config";
import { getHealth, postInvalidSignIn } from "./requests";

export const options = smokeOptions;

export default function () {
  getHealth();
  postInvalidSignIn();
}
