const { expect, test } = require('@playwright/test');

async function openGame(page) {
  await page.goto('/game', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() =>
    typeof window.getMessageHandler === 'function' &&
    typeof window.getMessageHandler('wagerPhase') === 'function'
  );
}

test('Wager mode runs wager, answer, and scoring phases end to end', async ({ page }) => {
  await openGame(page);

  const result = await page.evaluate(async () => {
    const code = `WGR${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const url = `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws/${code}`;

    function makeClient() {
      const socket = new WebSocket(url);
      const events = [];
      const waiters = new Map();
      socket.addEventListener('message', ({ data }) => {
        const message = JSON.parse(data);
        events.push(message);
        const pending = waiters.get(message.event);
        if (pending) {
          waiters.delete(message.event);
          pending(message.data);
        }
      });
      return {
        socket,
        open: () => new Promise((resolve, reject) => {
          socket.addEventListener('open', resolve, { once: true });
          socket.addEventListener('error', reject, { once: true });
        }),
        send: (data) => socket.send(JSON.stringify(data)),
        waitFor: (event, timeoutMs = 12_000) => {
          const found = events.find((message) => message.event === event);
          if (found) return Promise.resolve(found.data);
          return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => {
              waiters.delete(event);
              reject(new Error(`Timed out waiting for ${event}`));
            }, timeoutMs);
            waiters.set(event, (data) => {
              clearTimeout(timeout);
              resolve(data);
            });
          });
        },
      };
    }

    const host = makeClient();
    await host.open();
    host.send({
      action: 'create', language: 'en', subjects: ['picguess'],
      gameMode: 'ffa', isPublic: false, quizType: 'wager',
    });
    await host.waitFor('roomCreated');
    host.send({ action: 'join', playerName: 'Wager Host' });
    const hostJoined = await host.waitFor('joined');

    const guest = makeClient();
    await guest.open();
    guest.send({ action: 'join', playerName: 'Wager Guest' });
    const guestJoined = await guest.waitFor('joined');
    await host.waitFor('players');

    host.send({
      action: 'start', userId: hostJoined.userId,
      matchToken: hostJoined.matchToken, language: 'en',
    });
    const [hostPhase, guestPhase] = await Promise.all([
      host.waitFor('wagerPhase'), guest.waitFor('wagerPhase'),
    ]);

    host.send({
      action: 'wager', userId: hostJoined.userId,
      matchToken: hostJoined.matchToken, amount: 40,
    });
    guest.send({
      action: 'wager', userId: guestJoined.userId,
      matchToken: guestJoined.matchToken, amount: 25,
    });

    const [hostAccepted, guestAccepted, hostQuestion, guestQuestion] = await Promise.all([
      host.waitFor('wagerAccepted'), guest.waitFor('wagerAccepted'),
      host.waitFor('question'), guest.waitFor('question'),
    ]);

    host.send({
      action: 'answer', userId: hostJoined.userId,
      matchToken: hostJoined.matchToken, idx: 0,
    });
    guest.send({
      action: 'answer', userId: guestJoined.userId,
      matchToken: guestJoined.matchToken, idx: 1,
    });
    const wagerResult = await host.waitFor('wagerResult');
    host.socket.close();
    guest.socket.close();

    return { hostPhase, guestPhase, hostAccepted, guestAccepted, hostQuestion, guestQuestion, wagerResult };
  });

  expect(result.hostPhase.maxWagers['Wager Host']).toBe(100);
  expect(result.guestPhase.maxWagers['Wager Guest']).toBe(100);
  expect(result.hostAccepted.amount).toBe(40);
  expect(result.guestAccepted.amount).toBe(25);
  expect(result.hostQuestion.quizType).toBe('wager');
  expect(result.hostQuestion.buzzerless).toBe(true);
  expect(result.hostQuestion.category).toBe('picguess');
  expect(result.hostQuestion.picguess).toBe(true);
  expect(result.hostQuestion.image).toBeTruthy();
  expect(result.hostQuestion.blurStart).toBe(20);
  expect(result.guestQuestion.q).toBe(result.hostQuestion.q);
  expect(result.wagerResult.results['Wager Host'].answered).toBe(true);
  expect(result.wagerResult.results['Wager Guest'].answered).toBe(true);

  for (const [name, wager] of [['Wager Host', 40], ['Wager Guest', 25]]) {
    const player = result.wagerResult.results[name];
    expect(player.delta).toBe(player.correct ? 50 + (2 * wager) : -wager);
    expect(result.wagerResult.scores[name]).toBe(100 + player.delta);
  }
});

test('an old Wager result timer does not remove the next wager phase', async ({ page }) => {
  await openGame(page);

  await page.evaluate(() => {
    window.getMessageHandler('wagerResult')({
      answer: 'Gold',
      correctIdx: 0,
      results: {},
      scores: {},
      serverNow: 1_000,
      nextEventAt: 1_100,
    });
    window.getMessageHandler('wagerPhase')({
      round: 1,
      questionInRound: 2,
      questionsPerRound: 5,
      wagerTime: 15,
      difficulty: 1,
      maxWagers: {},
      scores: {},
    });
  });

  await page.waitForTimeout(4_700);
  await expect(page.locator('#wagerOverlay #wagerConfirm')).toBeVisible();
  await expect(page.locator('#wagerOverlay')).toContainText('Question 2/5');
});

test('Wager image questions use the Picguess reveal effect', async ({ page }) => {
  await openGame(page);

  const state = await page.evaluate(() => {
    window.getMessageHandler('question')({
      q: 'Guess the image',
      options: ['A', 'B', 'C', 'D'],
      image: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=',
      category: 'picguess',
      subject: 'picguess',
      picguess: true,
      blurStart: 20,
      time: 15,
      quizType: 'wager',
      buzzerless: true,
      questionInRound: 1,
      questionsPerRound: 5,
    });
    const frame = document.getElementById('questionImage');
    const image = frame.querySelector('img');
    return {
      frameClass: frame.classList.contains('picguess-frame'),
      filter: image.style.filter,
      hintCount: frame.querySelectorAll('.picguess-hint').length,
      meterCount: frame.querySelectorAll('.picguess-reveal-meter').length,
    };
  });

  expect(state.frameClass).toBe(true);
  expect(state.filter).toContain('blur(20px)');
  expect(state.hintCount).toBe(1);
  expect(state.meterCount).toBe(1);
});
