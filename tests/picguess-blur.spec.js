const { expect, test } = require('@playwright/test');

const IMAGE_DATA_URL =
  'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=';

function svgDataUrl(width, height, color) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="${width}" height="${height}" fill="${color}"/><circle cx="${width / 2}" cy="${height / 2}" r="${Math.min(width, height) / 4}" fill="white"/></svg>`;
  return `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
}

async function openGame(page) {
  await page.goto('/game', { waitUntil: 'domcontentloaded' });
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

test('question image frame contains very wide and very tall images', async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await openGame(page);

  const state = await page.evaluate(({ wide, tall }) => {
    const makeQuestion = (image, questionInRound) => ({
      q: `Image layout ${questionInRound}`,
      image,
      category: 'flags',
      subject: 'flags',
      time: 15,
      buzzerless: true,
      quizType: 'speed',
      questionInRound,
      questionsPerRound: 2,
      round: 1,
      options: ['Alpha', 'Bravo', 'Charlie', 'Delta'],
      correct: 0,
    });

    window.showQuestion(makeQuestion(wide, 1));
    const wideFrame = document.querySelector('#questionImage').getBoundingClientRect();
    const wideImg = document.querySelector('#questionImage img').getBoundingClientRect();
    const wideFit = getComputedStyle(document.querySelector('#questionImage img')).objectFit;

    window.showQuestion(makeQuestion(tall, 2));
    const tallFrame = document.querySelector('#questionImage').getBoundingClientRect();
    const tallImg = document.querySelector('#questionImage img').getBoundingClientRect();
    const tallFit = getComputedStyle(document.querySelector('#questionImage img')).objectFit;

    const soloFrameEl = document.querySelector('#soloQuestionImage');
    const soloImgEl = document.querySelector('#soloQuestionImage img');
    soloFrameEl.style.display = 'block';
    soloImgEl.src = tall;
    const soloFrame = soloFrameEl.getBoundingClientRect();
    const soloImg = soloImgEl.getBoundingClientRect();
    const soloFit = getComputedStyle(soloImgEl).objectFit;

    return {
      wideFrame: { width: wideFrame.width, height: wideFrame.height },
      wideImg: { width: wideImg.width, height: wideImg.height },
      wideFit,
      tallFrame: { width: tallFrame.width, height: tallFrame.height },
      tallImg: { width: tallImg.width, height: tallImg.height },
      tallFit,
      soloFrame: { width: soloFrame.width, height: soloFrame.height },
      soloImg: { width: soloImg.width, height: soloImg.height },
      soloFit,
    };
  }, {
    wide: svgDataUrl(2400, 300, '#2f80ed'),
    tall: svgDataUrl(320, 1800, '#9c3b3e'),
  });

  expect(state.wideFit).toBe('contain');
  expect(state.tallFit).toBe('contain');
  expect(state.soloFit).toBe('contain');
  expect(state.wideFrame.height).toBeLessThanOrEqual(322);
  expect(state.tallFrame.height).toBeLessThanOrEqual(322);
  expect(state.soloFrame.height).toBeLessThanOrEqual(322);
  expect(Math.abs(state.wideFrame.height - state.tallFrame.height)).toBeLessThanOrEqual(1);
  expect(state.wideImg.width).toBeLessThanOrEqual(state.wideFrame.width);
  expect(state.wideImg.height).toBeLessThanOrEqual(state.wideFrame.height);
  expect(state.tallImg.width).toBeLessThanOrEqual(state.tallFrame.width);
  expect(state.tallImg.height).toBeLessThanOrEqual(state.tallFrame.height);
  expect(state.soloImg.width).toBeLessThanOrEqual(state.soloFrame.width);
  expect(state.soloImg.height).toBeLessThanOrEqual(state.soloFrame.height);
});
