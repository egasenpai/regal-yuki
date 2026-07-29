import { Agent, fetch as undiciFetch } from "undici";
const ipv4Agent = new Agent({
  connect: {
    family: 4,
  },
});

export function austinFetch(url, options = {}) {
  return undiciFetch(url, { ...options, dispatcher: ipv4Agent });
}
