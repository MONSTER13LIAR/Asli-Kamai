import pg from 'pg'

// Postgres when DATABASE_URL is set; an in-memory store otherwise so the
// server runs for local development without a database.
const url = process.env.DATABASE_URL

const schema = `
create table if not exists users (
  id          bigserial primary key,
  google_sub  text unique not null,
  email       text,
  name        text,
  picture     text,
  created_at  timestamptz not null default now(),
  last_seen   timestamptz not null default now()
);
create table if not exists ledgers (
  user_id     bigint primary key references users(id) on delete cascade,
  data        jsonb not null,
  updated_at  timestamptz not null default now()
);`

let db

if (url) {
  const pool = new pg.Pool({
    connectionString: url,
    ssl: /localhost|127\.0\.0\.1/.test(url) ? false : { rejectUnauthorized: false },
    // Serverless-friendly: one connection per warm instance, released fast.
    max: 1,
    idleTimeoutMillis: 10_000,
  })
  await pool.query(schema)
  db = {
    kind: 'postgres',
    async upsertUser({ sub, email, name, picture }) {
      const { rows } = await pool.query(
        `insert into users (google_sub, email, name, picture) values ($1, $2, $3, $4)
         on conflict (google_sub) do update set email = excluded.email, name = excluded.name,
           picture = excluded.picture, last_seen = now()
         returning id, email, name, picture`,
        [sub, email, name, picture],
      )
      return rows[0]
    },
    async getUser(id) {
      const { rows } = await pool.query('select id, email, name, picture from users where id = $1', [id])
      return rows[0] ?? null
    },
    async getLedger(userId) {
      const { rows } = await pool.query('select data, updated_at from ledgers where user_id = $1', [userId])
      return rows[0] ? { ledger: rows[0].data, updatedAt: rows[0].updated_at.toISOString() } : null
    },
    async putLedger(userId, ledger) {
      const { rows } = await pool.query(
        `insert into ledgers (user_id, data, updated_at) values ($1, $2, now())
         on conflict (user_id) do update set data = excluded.data, updated_at = now()
         returning updated_at`,
        [userId, ledger],
      )
      return rows[0].updated_at.toISOString()
    },
  }
} else {
  console.warn('DATABASE_URL not set: using in-memory storage (data is lost on restart)')
  const users = new Map()
  const ledgers = new Map()
  let nextId = 1
  db = {
    kind: 'memory',
    async upsertUser({ sub, email, name, picture }) {
      let u = [...users.values()].find((x) => x.sub === sub)
      if (!u) {
        u = { id: nextId++, sub }
        users.set(u.id, u)
      }
      Object.assign(u, { email, name, picture })
      return { id: u.id, email, name, picture }
    },
    async getUser(id) {
      const u = users.get(id)
      return u ? { id: u.id, email: u.email, name: u.name, picture: u.picture } : null
    },
    async getLedger(userId) {
      return ledgers.get(userId) ?? null
    },
    async putLedger(userId, ledger) {
      const updatedAt = new Date().toISOString()
      ledgers.set(userId, { ledger, updatedAt })
      return updatedAt
    },
  }
}

export default db
