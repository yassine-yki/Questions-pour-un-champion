const { expect, test } = require('@playwright/test');

test('category choices survive the translation render during room creation', async ({ page }) => {
  await page.goto('/game', { waitUntil: 'domcontentloaded' });
  await page.waitForFunction(() =>
    typeof window.renderSubjectsToContainer === 'function' &&
    typeof window.applyTranslations === 'function'
  );

  const state = await page.evaluate(() => {
    window.renderSubjectsToContainer('createSubjects');
    const science = document.querySelector('#createSubjects [data-subject="science"]');
    const history = document.querySelector('#createSubjects [data-subject="history"]');
    science.click();
    history.click();

    const before = window.getSelectedSubjects('createSubjects');
    window.applyTranslations();
    const after = window.getSelectedSubjects('createSubjects');

    return {
      before,
      after,
      scienceChecked: document.querySelector('#createSubjects-science').checked,
      historyChecked: document.querySelector('#createSubjects-history').checked,
      scienceOn: document.querySelector('#createSubjects [data-subject="science"]').classList.contains('is-on'),
      historyOn: document.querySelector('#createSubjects [data-subject="history"]').classList.contains('is-on'),
    };
  });

  expect(state.after).toEqual(state.before);
  expect(state.scienceChecked).toBe(false);
  expect(state.historyChecked).toBe(false);
  expect(state.scienceOn).toBe(false);
  expect(state.historyOn).toBe(false);
});
