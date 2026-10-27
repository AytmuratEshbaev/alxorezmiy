// Runs the real auth modules against SQLite and a fake Telegram transport.
// Node 22.13+ is needed for the built-in node:sqlite module; no test dependencies.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const { readFileSync } = require('node:fs');
const { resolve, dirname } = require('node:path');
const Module = require('node:module');
const ts = require('typescript');

const root = resolve(__dirname, '..');

function harness(t, options = {}) {
  const sqlite = new DatabaseSync(':memory:');
  sqlite.exec('PRAGMA foreign_keys = ON');
  for (const migration of ['0001_init.sql', '0002_telegram_login.sql']) {
    if (migration === '0002_telegram_login.sql') options.beforeUpgrade?.(sqlite);
    sqlite.exec(`BEGIN;\n${readFileSync(resolve(root, 'migrations', migration), 'utf8')}\nCOMMIT;`);
  }
  t.after(() => sqlite.close());
  const db = {
    prepare(sql) {
      let args = [];
      const stmt = {
        bind(...values) {
          args = values;
          return stmt;
        },
        async first(column) {
          const row = sqlite.prepare(sql).get(...args);
          return row ? (column ? row[column] : { ...row }) : null;
        },
        async all() {
          return {
            results: sqlite
              .prepare(sql)
              .all(...args)
              .map((row) => ({ ...row })),
          };
        },
        async run() {
          return { meta: { changes: Number(sqlite.prepare(sql).run(...args).changes) } };
        },
      };
      return stmt;
    },
    async batch(statements) {
      sqlite.exec('BEGIN');
      try {
        const results = [];
        for (const statement of statements) results.push(await statement.run());
        sqlite.exec('COMMIT');
        return results;
      } catch (err) {
        sqlite.exec('ROLLBACK');
        throw err;
      }
    },
  };
  const values = new Map();
  const cookieOptions = new Map();
  let readOnlyCookies = false;
  const jar = {
    get: (key) => (values.has(key) ? { value: values.get(key) } : undefined),
    set: (key, value, options) => {
      if (readOnlyCookies) throw new Error('Cookies are read-only in Server Components');
      cookieOptions.set(key, options);
      if (options?.maxAge === 0) values.delete(key);
      else values.set(key, value);
    },
  };
  const messages = [];
  let transportFails = false;
  let configured = true;
  const mocks = {
    'server-only': {},
    'next/headers': { cookies: async () => jar },
    react: { cache: (fn) => fn },
    '@opennextjs/cloudflare': { getCloudflareContext: () => ({ cf: {} }) },
    '@/lib/cf': {
      getDb: () => db,
      getEnv: () => ({}),
      getSecret: () => (configured ? '123456:fake-test-token' : undefined),
    },
  };
  const cache = new Map();
  function load(name, parent = root) {
    if (name.startsWith('.'))
      name = `@/${require('node:path').relative(resolve(root, 'src'), resolve(parent, name)).replaceAll('\\', '/')}`;
    if (Object.hasOwn(mocks, name)) return mocks[name];
    if (name === '@/lib/telegram/bot' && !options.realBot)
      return {
        getBotToken: () => (configured ? '123456:fake-test-token' : undefined),
        getBotUsername: async () => 'school_test_bot',
        callBot: async (method, params) => {
          if (transportFails) throw new Error('Telegram unavailable');
          messages.push({ method, ...params });
          return { message_id: messages.length };
        },
        sendMessage: async (chatId, text, buttons) => {
          if (transportFails) throw new Error('Telegram unavailable');
          messages.push({ chatId, text, buttons });
          return { message_id: messages.length };
        },
        webhookSecret: async () => 'test-secret',
        safeEqual: (a, b) => a === b,
      };
    if (!name.startsWith('@/') && !name.startsWith('.')) return require(name);
    const file = `${name.startsWith('@/') ? resolve(root, 'src', name.slice(2)) : resolve(parent, name)}.ts`;
    if (cache.has(file)) return cache.get(file).exports;
    const mod = new Module(file, module);
    cache.set(file, mod);
    mod.filename = file;
    mod.paths = module.paths;
    mod.require = (dependency) => load(dependency, dirname(file));
    mod._compile(
      ts.transpileModule(readFileSync(file, 'utf8'), {
        compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
      }).outputText,
      file
    );
    return mod.exports;
  }
  const now = new Date().toISOString();
  sqlite
    .prepare('INSERT INTO admins (id, telegram_id, name, createdAt) VALUES (?, ?, ?, ?)')
    .run('admin1', '123456789', 'Admin', now);
  return {
    sqlite,
    db,
    jar,
    values,
    cookieOptions,
    messages,
    load,
    setReadOnlyCookies: (value) => {
      readOnlyCookies = value;
    },
    failTransport: () => {
      transportFails = true;
    },
    disableBot: () => {
      configured = false;
    },
  };
}

const request = () =>
  new Request('https://school.test/api/admin/login', {
    method: 'POST',
    headers: { origin: 'https://school.test', 'user-agent': 'Chrome/130 Windows' },
  });
const startUpdate = (id, userId = 123456789) => ({
  message: {
    from: { id: userId, first_name: 'Admin' },
    chat: { id: userId, type: 'private' },
    text: `/start ${id}`,
  },
});
const callback = (row, choice = row.code, userId = 123456789) => ({
  callback_query: {
    id: 'callback',
    from: { id: userId },
    data: `a:${row.id}:${choice}`,
    message: { message_id: 1, chat: { id: userId } },
  },
});

test('fresh migrations create usable Telegram auth tables', (t) => {
  const h = harness(t);
  assert.ok(
    h.sqlite
      .prepare('PRAGMA table_info(sessions)')
      .all()
      .some((c) => c.name === 'verifiedAt')
  );
  assert.deepEqual(h.sqlite.prepare('PRAGMA foreign_key_check').all(), []);
});

test('upgrade revokes old password sessions and preserves school content', (t) => {
  const h = harness(t, {
    beforeUpgrade(sqlite) {
      sqlite.exec(`
      INSERT INTO admins (id, email, password_hash, createdAt) VALUES ('old', 'old@test.uz', 'old-hash', '2020');
      INSERT INTO sessions (id, admin_id, expiresAt, absoluteExpiresAt, createdAt) VALUES ('old-session', 'old', '2099', '2099', '2020');
      INSERT INTO news (id, title_uz, createdAt, updatedAt) VALUES ('news1', 'Maktab', '2020', '2020');
    `);
    },
  });
  assert.equal(
    h.sqlite.prepare("SELECT COUNT(*) AS n FROM sessions WHERE id = 'old-session'").get().n,
    0
  );
  assert.equal(
    h.sqlite.prepare("SELECT title_uz FROM news WHERE id = 'news1'").get().title_uz,
    'Maktab'
  );
});

test('login requires both the browser secret and the right Telegram account/code', async (t) => {
  const h = harness(t);
  const auth = h.load('@/lib/auth/approval');
  const bot = h.load('@/lib/telegram/updates');
  const row = await auth.createApproval(request(), 'login');
  assert.equal(await auth.pollApproval(row.id), 'pending');
  await bot.handleUpdate(startUpdate(row.id));
  assert.equal(h.messages.at(-1).buttons[0].length, 3);
  await bot.handleUpdate(callback(row, row.code, 987654321));
  assert.equal(await auth.pollApproval(row.id), 'pending');
  await bot.handleUpdate(callback(row));
  const secret = h.values.get('__Host-ax_login');
  h.values.delete('__Host-ax_login');
  assert.equal(await auth.pollApproval(row.id), 'expired');
  h.values.set('__Host-ax_login', secret);
  assert.equal(await auth.pollApproval(row.id), 'ok');
  assert.ok(await h.load('@/lib/auth/session').getSessionUser());
  assert.equal(await auth.pollApproval(row.id), 'expired');
  assert.equal(h.sqlite.prepare('SELECT COUNT(*) AS n FROM sessions').get().n, 1);
});

test('wrong code, explicit denial, expiry and non-admin cannot create sessions', async (t) => {
  for (const scenario of ['wrong', 'denied', 'expired', 'not_admin']) {
    const h = harness(t);
    const auth = h.load('@/lib/auth/approval');
    const bot = h.load('@/lib/telegram/updates');
    const row = await auth.createApproval(request(), 'login');
    if (scenario === 'not_admin') await bot.handleUpdate(startUpdate(row.id, 987654321));
    else {
      await bot.handleUpdate(startUpdate(row.id));
      if (scenario === 'expired')
        h.sqlite.prepare('UPDATE login_requests SET expiresAt = ?').run('2000-01-01');
      await bot.handleUpdate(
        callback(row, scenario === 'denied' ? 'x' : row.code === '10' ? '11' : '10')
      );
    }
    assert.equal(await auth.pollApproval(row.id), scenario === 'wrong' ? 'denied' : scenario);
    assert.equal(h.sqlite.prepare('SELECT COUNT(*) AS n FROM sessions').get().n, 0);
  }
});

test('an old tab cannot poll or clear a newer login request', async (t) => {
  const h = harness(t);
  const auth = h.load('@/lib/auth/approval');
  const first = await auth.createApproval(request(), 'login');
  const second = await auth.createApproval(request(), 'login');
  assert.equal(await auth.pollApproval(first.id), 'expired');
  assert.equal(await auth.pollApproval(second.id), 'pending');
});

test('a non-admin cannot deny a request already bound to an admin', async (t) => {
  const h = harness(t);
  const auth = h.load('@/lib/auth/approval');
  const bot = h.load('@/lib/telegram/updates');
  const row = await auth.createApproval(request(), 'login');
  await bot.handleUpdate(startUpdate(row.id));
  await bot.handleUpdate(startUpdate(row.id, 987654321));
  await bot.handleUpdate(callback(row));
  assert.equal(await auth.pollApproval(row.id), 'ok');
});

test('cancel removes only the request belonging to this browser and ID', async (t) => {
  const h = harness(t);
  const auth = h.load('@/lib/auth/approval');
  const row = await auth.createApproval(request(), 'login');
  await auth.cancelApproval('another-request-id');
  assert.equal(await auth.pollApproval(row.id), 'pending');
  await auth.cancelApproval(row.id);
  assert.equal(await auth.pollApproval(row.id), 'expired');
  assert.equal(h.sqlite.prepare('SELECT COUNT(*) AS n FROM login_requests').get().n, 0);
});

test('reauth updates only its original live session', async (t) => {
  for (const scenario of ['live', 'expired', 'different']) {
    const h = harness(t);
    const sessions = h.load('@/lib/auth/session');
    const auth = h.load('@/lib/auth/approval');
    await sessions.createSession('admin1');
    const sessionId = await sessions.currentSessionId();
    h.sqlite.prepare('UPDATE sessions SET verifiedAt = ?').run('2000-01-01');
    const row = await auth.createApproval(request(), 'reauth', { adminId: 'admin1', sessionId });
    if (scenario === 'expired')
      h.sqlite.prepare('UPDATE sessions SET expiresAt = ?').run('2000-01-01');
    if (scenario === 'different') h.values.set(sessions.SESSION_COOKIE, 'another-session-token');
    await h.load('@/lib/telegram/updates').handleUpdate(callback(row));
    assert.equal(await auth.pollApproval(row.id), scenario === 'live' ? 'ok' : 'denied');
  }
});

test('webhook rejects forged requests and retries temporary processing failures', async (t) => {
  const h = harness(t);
  const webhook = h.load('@/app/api/telegram/webhook/route');
  const req = (secret) =>
    new Request('https://school.test/api/telegram/webhook', {
      method: 'POST',
      headers: { 'x-telegram-bot-api-secret-token': secret },
      body: JSON.stringify(startUpdate('')),
    });
  assert.equal((await webhook.POST(req('forged'))).status, 401);
  assert.equal((await webhook.POST(req('test-secret'))).status, 200);
  h.failTransport();
  assert.equal((await webhook.POST(req('test-secret'))).status, 503);
});

test('login routes enforce same-origin and browser-bound request IDs', async (t) => {
  const h = harness(t);
  const login = h.load('@/app/api/admin/login/route');
  const poll = h.load('@/app/api/admin/login/poll/route');
  assert.equal(
    (
      await login.POST(
        new Request('https://school.test/api/admin/login', {
          method: 'POST',
          headers: { origin: 'https://evil.test' },
        })
      )
    ).status,
    403
  );
  const response = await login.POST(request());
  assert.equal(response.status, 200);
  assert.equal(response.headers.get('cache-control'), 'no-store');
  const info = await response.json();
  assert.equal(info.url, `https://t.me/school_test_bot?start=${info.id}`);
  const req = (body) =>
    new Request('https://school.test/api/admin/login/poll', {
      method: 'POST',
      headers: { origin: 'https://school.test' },
      body: JSON.stringify(body),
    });
  assert.equal((await poll.POST(req({}))).status, 400);
  assert.equal((await (await poll.POST(req({ id: info.id }))).json()).status, 'pending');
  assert.equal((await login.DELETE(req({ id: info.id }))).status, 200);
  assert.equal((await (await poll.POST(req({ id: info.id }))).json()).status, 'expired');
  h.disableBot();
  assert.equal((await login.POST(request())).status, 503);
});

test('approved request can be consumed only once under parallel polls', async (t) => {
  const h = harness(t);
  const auth = h.load('@/lib/auth/approval');
  const bot = h.load('@/lib/telegram/updates');
  const row = await auth.createApproval(request(), 'login');
  await bot.handleUpdate(startUpdate(row.id));
  await bot.handleUpdate(callback(row));
  const results = await Promise.all([auth.pollApproval(row.id), auth.pollApproval(row.id)]);
  assert.deepEqual(results.sort(), ['expired', 'ok']);
  assert.equal(h.sqlite.prepare('SELECT COUNT(*) AS n FROM sessions').get().n, 1);
});

test('reauth endpoint and admin mutations require a valid, recently verified session', async (t) => {
  const h = harness(t);
  const reauth = h.load('@/app/api/admin/reauth/route');
  const users = h.load('@/app/api/admin/users/route');
  const user = h.load('@/app/api/admin/users/[id]/route');
  assert.equal((await reauth.POST(request())).status, 401);
  const sessions = h.load('@/lib/auth/session');
  await sessions.createSession('admin1');
  h.sqlite.prepare('UPDATE sessions SET verifiedAt = ?').run('2000-01-01');
  const create = () =>
    new Request('https://school.test/api/admin/users', {
      method: 'POST',
      headers: { origin: 'https://school.test' },
      body: JSON.stringify({ telegramId: '987654321', name: 'New Admin' }),
    });
  assert.equal((await users.POST(create())).status, 403);
  const info = await (await reauth.POST(request())).json();
  assert.ok(info.id);
  const row = h.sqlite.prepare('SELECT * FROM login_requests WHERE id = ?').get(info.id);
  await h.load('@/lib/telegram/updates').handleUpdate(callback(row));
  assert.equal(await h.load('@/lib/auth/approval').pollApproval(info.id), 'ok');
  const created = await users.POST(create());
  assert.equal(created.status, 201);
  const { id } = await created.json();
  assert.equal((await users.POST(create())).status, 409);
  const deletion = new Request('https://school.test/api/admin/users', {
    method: 'DELETE',
    headers: { origin: 'https://school.test' },
  });
  assert.equal(
    (await user.DELETE(deletion, { params: Promise.resolve({ id: 'admin1' }) })).status,
    400
  );
  assert.equal((await user.DELETE(deletion, { params: Promise.resolve({ id }) })).status, 200);
});

test('Telegram transport derives the webhook secret and caches bot username', async (t) => {
  const h = harness(t, { realBot: true });
  const calls = [];
  t.mock.method(globalThis, 'fetch', async (_url, init) => {
    calls.push(JSON.parse(init.body));
    return Response.json({ ok: true, result: { username: 'school_test_bot' } });
  });
  const bot = h.load('@/lib/telegram/bot');
  assert.equal(await bot.getBotUsername(), 'school_test_bot');
  assert.equal(await bot.getBotUsername(), 'school_test_bot');
  assert.equal(calls.length, 1);
  const expected = require('node:crypto')
    .createHmac('sha256', '123456:fake-test-token')
    .update('alxorezmiy-webhook')
    .digest('hex');
  assert.equal(await bot.webhookSecret(), expected);
  assert.equal(bot.safeEqual(expected, expected), true);
  assert.equal(bot.safeEqual(expected, `${expected.slice(0, -1)}x`), false);
  globalThis.fetch.mock.mockImplementation(async () =>
    Response.json({ ok: false, description: 'Forbidden' }, { status: 403 })
  );
  await assert.rejects(bot.sendMessage('123456789', 'Test'), /Forbidden/);
});

test('API refreshes the cookie after a Server Component renewed the database session', async (t) => {
  const h = harness(t);
  const sessions = h.load('@/lib/auth/session');
  await sessions.createSession('admin1');
  const sessionId = await sessions.currentSessionId();
  h.sqlite
    .prepare('UPDATE sessions SET expiresAt = ? WHERE id = ?')
    .run(new Date(Date.now() + 60_000).toISOString(), sessionId);
  h.setReadOnlyCookies(true);
  assert.ok(await sessions.getSessionUser());
  const renewed = h.sqlite
    .prepare('SELECT expiresAt FROM sessions WHERE id = ?')
    .get(sessionId).expiresAt;
  h.setReadOnlyCookies(false);
  assert.ok(await sessions.getSessionUser());
  assert.equal(h.cookieOptions.get(sessions.SESSION_COOKIE).expires.toISOString(), renewed);
});

test('logout and session revocation immediately remove panel access', async (t) => {
  const h = harness(t);
  const sessions = h.load('@/lib/auth/session');
  await sessions.createSession('admin1');
  await sessions.revokeAllSessions('admin1');
  assert.equal(await sessions.getSessionUser(), null);
  await sessions.createSession('admin1');
  const logout = h.load('@/app/api/admin/logout/route');
  assert.equal((await logout.POST(request())).status, 200);
  assert.equal(await sessions.getSessionUser(), null);
  assert.equal(h.values.has(sessions.SESSION_COOKIE), false);
});

test('bot setup and read-only diagnostics use the configured HTTPS webhook', async (t) => {
  const { pathToFileURL } = require('node:url');
  const originalArgv = process.argv;
  const originalToken = process.env.TELEGRAM_BOT_TOKEN;
  t.after(() => {
    process.argv = originalArgv;
    if (originalToken === undefined) delete process.env.TELEGRAM_BOT_TOKEN;
    else process.env.TELEGRAM_BOT_TOKEN = originalToken;
  });
  process.env.TELEGRAM_BOT_TOKEN = `123456:${'a'.repeat(35)}`;
  t.mock.method(console, 'log', () => {});
  const methods = [];
  t.mock.method(globalThis, 'fetch', async (url, init) => {
    const method = url.split('/').at(-1);
    methods.push(method);
    const body = JSON.parse(init.body);
    if (method === 'setWebhook') {
      assert.equal(body.url, 'https://school.test/api/telegram/webhook');
      assert.match(body.secret_token, /^[a-f0-9]{64}$/);
      assert.equal(body.drop_pending_updates, undefined);
    }
    const result =
      method === 'getMe'
        ? { username: 'school_test_bot' }
        : method === 'getWebhookInfo'
          ? { url: 'https://school.test/api/telegram/webhook', pending_update_count: 0 }
          : true;
    return Response.json({ ok: true, result });
  });
  const file = pathToFileURL(resolve(root, 'scripts/setup-bot.mjs')).href;
  process.argv = [process.execPath, 'setup-bot.mjs', '--site', 'https://school.test'];
  await import(`${file}?test=setup`);
  assert.deepEqual(methods, ['getMe', 'setWebhook', 'setMyCommands', 'getWebhookInfo']);
  methods.length = 0;
  process.argv.push('--check');
  await import(`${file}?test=check`);
  assert.deepEqual(methods, ['getMe', 'getWebhookInfo']);
});
