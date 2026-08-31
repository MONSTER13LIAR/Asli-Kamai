import db from '../server/db.js'

export default function handler(_req, res) {
  res.json({ ok: true, storage: db.kind })
}
