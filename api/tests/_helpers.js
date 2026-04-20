import http from "node:http";
import { before, after } from "node:test";
import app from "../app.js";

const state = { baseUrl: "" };

export function setupServer() {
  let server;
  before(async () => {
    server = http.createServer(app);
    await new Promise((resolve) => server.listen(0, resolve));
    state.baseUrl = `http://127.0.0.1:${server.address().port}`;
  });
  after(async () => {
    await new Promise((resolve) => server.close(resolve));
  });
}

export async function api(path, init = {}) {
  const res = await fetch(`${state.baseUrl}${path}`, init);
  const body = res.status === 204 ? null : await res.json();
  return { status: res.status, body };
}

export function withClient(clientId, init = {}) {
  return {
    ...init,
    headers: { ...(init.headers ?? {}), "X-Client-Id": clientId },
  };
}

export function jsonPost(body) {
  return {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };
}
