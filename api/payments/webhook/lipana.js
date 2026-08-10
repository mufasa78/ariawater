import app from "../../../artifacts/api-server/dist/serverless.mjs";

export default function handler(req, res) {
  return app(req, res);
}
