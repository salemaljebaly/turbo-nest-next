import { sleep } from "k6";
import { smokeOptions } from "../config";
import { signIn } from "../helpers/auth";
import {
  hitAuthenticatedApi,
  hitHealth,
  hitLanding,
} from "../helpers/requests";

export const options = smokeOptions;

export function setup() {
  return {
    session: signIn(),
  };
}

export default function (data: ReturnType<typeof setup>) {
  hitLanding();
  hitHealth();
  hitAuthenticatedApi(data.session);
  sleep(1);
}
