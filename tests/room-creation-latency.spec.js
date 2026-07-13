const { expect, test } = require('@playwright/test');

test('joining a new room skips a redundant full translation render', async ({ page }) => {
  await page.goto('/game', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof window.getMessageHandler === 'function');

  const state = await page.evaluate(() => {
    selectedLanguage = 'en';
    currentRoomCode = 'FAST01';
    let translationRenders = 0;
    const originalApplyTranslations = window.applyTranslations;
    window.applyTranslations = () => { translationRenders += 1; };

    window.getMessageHandler('joined')({
      userId: 'host-id',
      matchToken: 'host-token',
      isHost: true,
      language: 'en',
      team: null,
    });

    window.applyTranslations = originalApplyTranslations;
    return {
      translationRenders,
      lobbyActive: document.getElementById('lobbyScreen').classList.contains('active'),
      roomCode: document.getElementById('roomCode').textContent,
    };
  });

  expect(state.translationRenders).toBe(0);
  expect(state.lobbyActive).toBe(true);
  expect(state.roomCode).toBe('FAST01');
});

test('joining a room still translates when its language differs', async ({ page }) => {
  await page.goto('/game', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() => typeof window.getMessageHandler === 'function');

  const translationRenders = await page.evaluate(() => {
    selectedLanguage = 'fr';
    currentRoomCode = 'LANG01';
    let calls = 0;
    const originalApplyTranslations = window.applyTranslations;
    window.applyTranslations = () => { calls += 1; };
    window.getMessageHandler('joined')({
      userId: 'guest-id',
      matchToken: 'guest-token',
      isHost: false,
      language: 'en',
      team: null,
    });
    window.applyTranslations = originalApplyTranslations;
    return calls;
  });

  expect(translationRenders).toBe(1);
});
