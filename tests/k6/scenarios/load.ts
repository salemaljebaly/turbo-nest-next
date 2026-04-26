import { sleep } from "k6";
import { loadOptions } from "../config";
import { signIn } from "../helpers/auth";
import {
  hitAuthenticatedApi,
  hitHealth,
  hitLanding,
} from "../helpers/requests";

export const options = loadOptions;

export function setup() {
  return {
    session: signIn(),
  };
}

export default function (data: ReturnType<typeof setup>) {
  const flow = __ITER % 4;

  if (flow === 0) {
    hitAuthenticatedApi(data.session);
  } else if (flow === 1) {
    hitHealth();
  } else {
    hitLanding();
  }

  sleep(1);
}
