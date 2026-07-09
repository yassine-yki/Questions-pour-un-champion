const { expect, test } = require('@playwright/test');

const IMAGE_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=';

async function openGame(page) {
  await page.goto('/game');
  await page.waitForFunction(() =>
    typeof window.startPicguessImageReveal === 'function' &&
    typeof window.showQuestion === 'function'
  );
}

test('Picguess reveal helper resets cached images back to blurred', async ({ page }) => {
  await openGame(page);

  const state = await page.evaluate(async (src) => {
    const img = document.createElement('img');
    img.src = src;
    document.body.appendChild(img);
    await img.decode().catch(() => {});

    window.startPicguessImageReveal(img, { blurStart: 20, durationMs: 15_000 });
    const firstStart = {
      filter: img.style.filter,
      transition: img.style.transition,
      transform: img.style.transform,
    };

    img.style.filter = 'blur(0px) brightness(1) saturate(1)';
    img.style.transform = 'scale(1)';
    img.style.transition = 'filter 15000ms linear, transform 15000ms linear';

    window.startPicguessImageReveal(img, { blurStart: 20, durationMs: 15_000 });

    return {
      firstStart,
      secondStart: {
        filter: img.style.filter,
        transition: img.style.transition,
        transform: img.style.transform,
      },
    };
  }, IMAGE_DATA_URL);

  expect(state.firstStart.filter).toContain('blur(20px)');
  expect(state.firstStart.transition).toBe('none');
  expect(state.secondStart.filter).toContain('blur(20px)');
  expect(state.secondStart.transition).toBe('none');
  expect(state.secondStart.transform).toBe('scale(1.06)');
});

test('multiplayer question renderer blurs consecutive Picguess images', async ({ page }) => {
  await openGame(page);

  const state = await page.evaluate((src) => {
    const makeQuestion = (questionInRound) => ({
      q: `Picture question ${questionInRound}`,
      image: src,
      picguess: true,
      category: 'picguess',
      subject: 'picguess',
      blurStart: 20,
      time: 15,
      buzzerless: true,
      quizType: 'speed',
      questionInRound,
      questionsPerRound: 2,
      round: 1,
      options: ['Alpha', 'Bravo', 'Charlie', 'Delta'],
      correct: 0,
    });

    window.showQuestion(makeQuestion(1));
    const img = document.querySelector('#questionImage img');
    const firstStart = {
      filter: img.style.filter,
      transition: img.style.transition,
      transform: img.style.transform,
    };

    img.style.filter = 'blur(0px) brightness(1) saturate(1)';
    img.style.transform = 'scale(1)';
    img.style.transition = 'filter 15000ms linear, transform 15000ms linear';

    window.showQuestion(makeQuestion(2));

    return {
      firstStart,
      secondStart: {
        filter: img.style.filter,
        transition: img.style.transition,
        transform: img.style.transform,
      },
      hintCount: document.querySelectorAll('#questionImage .picguess-hint').length,
      meterCount: document.querySelectorAll('#questionImage .picguess-reveal-meter').length,
    };
  }, IMAGE_DATA_URL);

  expect(state.firstStart.filter).toContain('blur(20px)');
  expect(state.secondStart.filter).toContain('blur(20px)');
  expect(state.secondStart.transition).toBe('none');
  expect(state.secondStart.transform).toBe('scale(1.06)');
  expect(state.hintCount).toBe(1);
  expect(state.meterCount).toBe(1);
});
