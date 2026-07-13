const { expect, test } = require('@playwright/test');

test('public pages and operational endpoints load without runtime errors', async ({ page, request }) => {
  const pageErrors = [];
  page.on('pageerror', error => pageErrors.push(error.message));

  const landing = await page.goto('/', { waitUntil: 'domcontentloaded' });
  expect(landing.ok()).toBe(true);
  await expect(page.locator('body')).toBeVisible();

  const game = await page.goto('/game', { waitUntil: 'domcontentloaded' });
  expect(game.ok()).toBe(true);
  await page.waitForFunction(() => typeof window.showSoloSetup === 'function');

  const health = await request.get('/api/health');
  expect(health.ok()).toBe(true);
  expect((await health.json()).ok).toBe(true);

  const questions = await request.get('/api/questions?language=en&subjects=science');
  expect(questions.ok()).toBe(true);
  const questionData = await questions.json();
  expect(questionData.questions.length).toBeGreaterThan(0);
  expect(pageErrors).toEqual([]);
});

test('solo game starts from selected categories and accepts an answer', async ({ page }) => {
  await page.goto('/game', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof window.startSoloGame === 'function');

  await page.evaluate(async () => {
    selectedLanguage = 'en';
    window.showSoloSetup();
    window.renderSubjectsToContainer('soloSubjects');
    document.getElementById('soloName').value = 'Jury Solo';
    document.querySelectorAll('#soloSubjects input[type="checkbox"]').forEach((box) => {
      box.checked = box.value === 'science';
      box.closest('.subject-pill')?.classList.toggle('is-on', box.checked);
    });
    await window.startSoloGame();
  });

  await expect(page.locator('#soloGameScreen')).toHaveClass(/active/);
  await expect(page.locator('#soloQuestionText')).not.toHaveText(/loading|chargement/i);
  await expect(page.locator('#soloOptionsBox button')).toHaveCount(4);
  const timer = Number((await page.locator('#soloTimer').textContent()).match(/\d+/)?.[0]);
  expect(timer).toBeGreaterThan(0);
  await page.locator('#soloOptionsBox button').first().click();
  await expect(page.locator('#soloOptionsBox button').first()).toHaveClass(/correct|incorrect/);
});

test('classic multiplayer completes a buzzer answer round', async ({ page }) => {
  await page.goto('/game', { waitUntil: 'domcontentloaded' });

  const result = await page.evaluate(async () => {
    const code = `CLS${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
    const url = `${location.protocol === 'https:' ? 'wss:' : 'ws:'}//${location.host}/ws/${code}`;
    function client() {
      const socket = new WebSocket(url);
      const queue = [];
      const waiters = new Map();
      socket.onmessage = ({ data }) => {
        const message = JSON.parse(data);
        const waiter = waiters.get(message.event);
        if (waiter) {
          waiters.delete(message.event);
          waiter(message.data);
        } else queue.push(message);
      };
      return {
        socket,
        open: () => new Promise((resolve, reject) => {
          socket.onopen = resolve;
          socket.onerror = reject;
        }),
        send: data => socket.send(JSON.stringify(data)),
        waitFor: (event, timeoutMs = 12_000) => {
          const index = queue.findIndex(item => item.event === event);
          if (index >= 0) return Promise.resolve(queue.splice(index, 1)[0].data);
          return new Promise((resolve, reject) => {
            const timeout = setTimeout(() => reject(new Error(`Timed out waiting for ${event}`)), timeoutMs);
            waiters.set(event, data => { clearTimeout(timeout); resolve(data); });
          });
        },
      };
    }

    const host = client();
    await host.open();
    host.send({ action: 'create', language: 'en', subjects: ['science'], gameMode: 'ffa', isPublic: false, quizType: 'classic' });
    await host.waitFor('roomCreated');
    host.send({ action: 'join', playerName: 'Classic Host' });
    const hostJoined = await host.waitFor('joined');

    const guest = client();
    await guest.open();
    guest.send({ action: 'join', playerName: 'Classic Guest' });
    await guest.waitFor('joined');
    await host.waitFor('players');

    host.send({ action: 'start', userId: hostJoined.userId, matchToken: hostJoined.matchToken, language: 'en' });
    const question = await host.waitFor('question');
    host.send({ action: 'buzz', userId: hostJoined.userId, matchToken: hostJoined.matchToken });
    const buzzed = await host.waitFor('buzzed');
    host.send({ action: 'answer', userId: hostJoined.userId, matchToken: hostJoined.matchToken, idx: 0 });
    const answer = await host.waitFor('answerResult');
    host.socket.close();
    guest.socket.close();
    return { question, buzzed, answer };
  });

  expect(result.question.quizType).toBe('classic');
  expect(result.question.options).toHaveLength(4);
  expect(result.buzzed.player).toBe('Classic Host');
  expect(result.answer.scores).toHaveProperty('Classic Host');
  expect(result.answer.answer).toBeTruthy();
});

test('primary setup screens do not overflow a narrow mobile viewport', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/game', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof window.showCreateMulti === 'function');

  const widths = await page.evaluate(() => {
    const measure = () => ({ viewport: innerWidth, page: document.documentElement.scrollWidth });
    window.showSoloSetup();
    const solo = measure();
    window.showCreateMulti();
    const create = measure();
    window.showJoinMulti();
    const join = measure();
    return { solo, create, join };
  });

  for (const screen of Object.values(widths)) {
    expect(screen.page).toBeLessThanOrEqual(screen.viewport + 1);
  }
});
