const { expect, test } = require('@playwright/test');

test('custom AI game restores a replaced connection and continues', async ({ page }) => {
  await page.goto('/game', { waitUntil: 'domcontentloaded' });

  const result = await page.evaluate(async () => {
    const code = `AIR${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const url = `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws/${code}`;

    function client() {
      const socket = new WebSocket(url);
      const events = [];
      const waiters = new Map();
      socket.addEventListener('message', ({ data }) => {
        const message = JSON.parse(data);
        const pending = waiters.get(message.event);
        if (pending) {
          waiters.delete(message.event);
          pending.resolve(message.data);
        } else {
          events.push(message);
        }
      });
      return {
        socket,
        open: () => new Promise((resolve, reject) => {
          socket.addEventListener('open', resolve, { once: true });
          socket.addEventListener('error', reject, { once: true });
        }),
        send: (data) => socket.send(JSON.stringify(data)),
        waitFor: (event, timeoutMs = 15_000) => {
          const index = events.findIndex(message => message.event === event);
          if (index >= 0) return Promise.resolve(events.splice(index, 1)[0].data);
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
        },
      };
    }

    const host = client();
    await host.open();
    host.send({
      action: 'create', language: 'en', subjects: ['ai_custom'],
      gameMode: 'ffa', isPublic: false, quizType: 'speed',
      aiQuestions: [
        { q: 'AI question one', options: ['One', 'Two', 'Three', 'Four'], correct: 0, time: 10 },
        { question: 'AI question two', options: ['Red', 'Blue', 'Green', 'Gold'], answer: 'Blue', time: 10 },
        { q: '', options: [], correct: 99 },
      ],
    });
    await host.waitFor('roomCreated');
    host.send({ action: 'join', playerName: 'AI Host' });
    const hostJoined = await host.waitFor('joined');

    const guest = client();
    await guest.open();
    guest.send({ action: 'join', playerName: 'AI Guest' });
    const guestJoined = await guest.waitFor('joined');
    await host.waitFor('players');

    host.send({
      action: 'start', userId: hostJoined.userId,
      matchToken: hostJoined.matchToken, language: 'en',
    });
    const [hostQuestion, guestQuestion] = await Promise.all([
      host.waitFor('question'), guest.waitFor('question'),
    ]);

    // Replace a half-open connection before the server notices a disconnect.
    const replacement = client();
    await replacement.open();
    replacement.send({
      action: 'rejoin', userId: guestJoined.userId,
      matchToken: guestJoined.matchToken,
    });
    const rejoined = await replacement.waitFor('rejoined');

    host.send({
      action: 'answer', userId: hostJoined.userId,
      matchToken: hostJoined.matchToken, idx: 0,
    });
    replacement.send({
      action: 'answer', userId: guestJoined.userId,
      matchToken: guestJoined.matchToken, idx: 1,
    });
    const [resultEvent, nextHostQuestion, nextGuestQuestion] = await Promise.all([
      host.waitFor('speedResult'),
      host.waitFor('question'),
      replacement.waitFor('question'),
    ]);

    host.socket.close();
    replacement.socket.close();
    return { hostQuestion, guestQuestion, rejoined, resultEvent, nextHostQuestion, nextGuestQuestion };
  });

  expect(['AI question one', 'AI question two']).toContain(result.hostQuestion.q);
  expect(result.guestQuestion.q).toBe(result.hostQuestion.q);
  expect(result.rejoined.gameState).toBe('speed_answer');
  expect(result.rejoined.currentQuestion.q).toBe(result.hostQuestion.q);
  expect(result.resultEvent.results['AI Guest'].answered).toBe(true);
  expect(['AI question one', 'AI question two']).toContain(result.nextHostQuestion.q);
  expect(result.nextGuestQuestion.q).toBe(result.nextHostQuestion.q);
});

test('reconnect error and close schedule only one retry', async ({ page }) => {
  await page.goto('/game', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof window.attemptReconnect === 'function');

  const connectionCount = await page.evaluate(async () => {
    const NativeWebSocket = window.WebSocket;
    const instances = [];
    class FakeWebSocket {
      static OPEN = 1;
      constructor() {
        this.readyState = 0;
        instances.push(this);
      }
      send() {}
      close() { this.onclose?.(); }
    }
    window.WebSocket = FakeWebSocket;
    currentRoomCode = 'ABC123';
    userId = 'user';
    matchToken = 'token';
    window.attemptReconnect();
    instances[0].onerror?.();
    instances[0].onclose?.();
    await new Promise(resolve => setTimeout(resolve, 800));
    // A late close from the stale socket must not affect its replacement.
    instances[0].onclose?.();
    await new Promise(resolve => setTimeout(resolve, 800));
    window.cancelReconnect();
    window.WebSocket = NativeWebSocket;
    return instances.length;
  });

  expect(connectionCount).toBe(2);
});
