const { expect, test } = require('@playwright/test');

test('Speed mode runs a simultaneous multiplayer question end to end', async ({ page }) => {
  await page.goto('/game', { waitUntil: 'domcontentloaded' });

  const result = await page.evaluate(async () => {
    const code = `SPD${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const socketUrl = `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws/${code}`;

    function makeClient() {
      const socket = new WebSocket(socketUrl);
      const events = [];
      const waiters = new Map();

      socket.addEventListener('message', ({ data }) => {
        const message = JSON.parse(data);
        events.push(message);
        const pending = waiters.get(message.event);
        if (pending) {
          waiters.delete(message.event);
          pending.resolve(message.data);
        }
      });

      function waitFor(event, timeoutMs = 12_000) {
        const existing = events.find((message) => message.event === event);
        if (existing) return Promise.resolve(existing.data);
        return new Promise((resolve, reject) => {
          const timeout = setTimeout(() => {
            waiters.delete(event);
            reject(new Error(`Timed out waiting for ${event}`));
          }, timeoutMs);
          waiters.set(event, {
            resolve: (data) => {
              clearTimeout(timeout);
              resolve(data);
            },
          });
        });
      }

      return {
        socket,
        send: (message) => socket.send(JSON.stringify(message)),
        open: () => new Promise((resolve, reject) => {
          socket.addEventListener('open', resolve, { once: true });
          socket.addEventListener('error', reject, { once: true });
        }),
        waitFor,
      };
    }

    const host = makeClient();
    await host.open();
    host.send({
      action: 'create',
      language: 'en',
      subjects: ['science'],
      gameMode: 'ffa',
      isPublic: false,
      quizType: 'speed',
    });
    await host.waitFor('roomCreated');
    host.send({ action: 'join', playerName: 'Speed Host' });
    const hostJoined = await host.waitFor('joined');

    const guest = makeClient();
    await guest.open();
    guest.send({ action: 'join', playerName: 'Speed Guest' });
    const guestJoined = await guest.waitFor('joined');
    await host.waitFor('players');

    host.send({
      action: 'start',
      userId: hostJoined.userId,
      matchToken: hostJoined.matchToken,
      language: 'en',
    });

    const [hostQuestion, guestQuestion] = await Promise.all([
      host.waitFor('question'),
      guest.waitFor('question'),
    ]);

    host.send({
      action: 'answer',
      userId: hostJoined.userId,
      matchToken: hostJoined.matchToken,
      idx: 0,
    });
    guest.send({
      action: 'answer',
      userId: guestJoined.userId,
      matchToken: guestJoined.matchToken,
      idx: 0,
    });

    const [hostLocked, guestLocked, speedResult] = await Promise.all([
      host.waitFor('answerLocked'),
      guest.waitFor('answerLocked'),
      host.waitFor('speedResult'),
    ]);

    host.socket.close();
    guest.socket.close();

    return {
      hostQuestion,
      guestQuestion,
      hostLocked,
      guestLocked,
      speedResult,
    };
  });

  expect(result.hostQuestion.quizType).toBe('speed');
  expect(result.hostQuestion.buzzerless).toBe(true);
  expect(result.hostQuestion.questionsPerRound).toBe(10);
  expect(result.guestQuestion.q).toBe(result.hostQuestion.q);
  expect(result.hostLocked.idx).toBe(0);
  expect(result.guestLocked.idx).toBe(0);
  expect(result.speedResult.results['Speed Host'].answered).toBe(true);
  expect(result.speedResult.results['Speed Guest'].answered).toBe(true);
  expect(result.speedResult.scores).toHaveProperty('Speed Host');
  expect(result.speedResult.scores).toHaveProperty('Speed Guest');
});
