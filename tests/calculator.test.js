import { describe, it, expect, beforeEach } from 'vitest';
import { JSDOM } from 'jsdom';
import fs from 'fs';
import path from 'path';

describe('Coin Calculator', () => {
  let dom;
  let window;
  let document;

  beforeEach(() => {
    const html = fs.readFileSync(path.resolve(__dirname, '../index.html'), 'utf-8');
    dom = new JSDOM(html, { runScripts: 'dangerously', resources: 'usable' });
    window = dom.window;
    document = window.document;

    // JSDOM doesn't run DOMContentLoaded automatically on load
    document.dispatchEvent(new window.Event('DOMContentLoaded', {
      bubbles: true,
      cancelable: true,
    }));
  });

  const testCases = [
    { inputId: 'toonie_roll', value: 2, outputId: 'total_toonie', expected: '100.00' },
    { inputId: 'loonie_roll', value: 3, outputId: 'total_loonie', expected: '75.00' },
    { inputId: 'quarter_roll', value: 1, outputId: 'total_quarter', expected: '10.00' },
    { inputId: 'dime_roll', value: 4, outputId: 'total_dime', expected: '20.00' },
    { inputId: 'nickel_roll', value: 5, outputId: 'total_nickel', expected: '10.00' },
    { inputId: 'hundre_dollar_bill_count', value: 1, outputId: 'total_hundre_dollar_bill', expected: '100.00' },
    { inputId: 'fifty_dollar_bill_count', value: 2, outputId: 'total_fifty_dollar_bill', expected: '100.00' },
    { inputId: 'twenty_dollar_bill_count', value: 3, outputId: 'total_twenty_dollar_bill', expected: '60.00' },
    { inputId: 'ten_dollar_bill_count', value: 4, outputId: 'total_ten_dollar_bill', expected: '40.00' },
    { inputId: 'five_dollar_bill_count', value: 5, outputId: 'total_five_dollar_bill', expected: '25.00' },
    { inputId: 'two_dollar_coins_count', value: 6, outputId: 'total_two_dollar_coins', expected: '12.00' },
    { inputId: 'one_dollar_coins_count', value: 7, outputId: 'total_one_dollar_coins', expected: '7.00' },
    { inputId: 'quarter_count', value: 8, outputId: 'total_quarter_cent', expected: '2.00' },
    { inputId: 'ten_cent_count', value: 9, outputId: 'total_ten_cent', expected: '0.90' },
    { inputId: 'five_cent_count', value: 10, outputId: 'total_five_cent', expected: '0.50' },
  ];

  testCases.forEach(({ inputId, value, outputId, expected }) => {
    it(`should calculate the total for ${inputId} correctly`, () => {
      const input = document.getElementById(inputId);
      const output = document.getElementById(outputId);

      input.value = value;
      input.dispatchEvent(new window.Event('input', { bubbles: true }));

      expect(output.textContent).toBe(expected);
    });
  });

  it('should calculate the grand total and difference correctly', () => {
    const grandTotal = document.getElementById('grand_total');
    const difference = document.getElementById('difference');
    const openCash = document.getElementById('open_cash');

    // Default open cash is 300
    expect(openCash.value).toBe('300');
    expect(grandTotal.textContent).toBe('0.00');
    expect(difference.textContent).toBe('-300.00');

    const toonieRollInput = document.getElementById('toonie_roll');
    toonieRollInput.value = 1;
    toonieRollInput.dispatchEvent(new window.Event('input', { bubbles: true }));

    const fiftyBillInput = document.getElementById('fifty_dollar_bill_count');
    fiftyBillInput.value = 2;
    fiftyBillInput.dispatchEvent(new window.Event('input', { bubbles: true }));

    // toonie roll (1 * 50) + fifty bill (2 * 50) = 50 + 100 = 150
    expect(grandTotal.textContent).toBe('150.00');
    // 150 - 300 = -150
    expect(difference.textContent).toBe('-150.00');

    // Change open cash
    openCash.value = '100';
    openCash.dispatchEvent(new window.Event('input', { bubbles: true }));
    expect(grandTotal.textContent).toBe('150.00');
    // 150 - 100 = 50
    expect(difference.textContent).toBe('50.00');
  });

  it('should reset all fields when reset button is clicked', () => {
    // Set some values
    const toonieRollInput = document.getElementById('toonie_roll');
    toonieRollInput.value = 1;
    toonieRollInput.dispatchEvent(new window.Event('input', { bubbles: true }));

    const fiftyBillInput = document.getElementById('fifty_dollar_bill_count');
    fiftyBillInput.value = 2;
    fiftyBillInput.dispatchEvent(new window.Event('input', { bubbles: true }));

    const openCash = document.getElementById('open_cash');
    openCash.value = '100';
    openCash.dispatchEvent(new window.Event('input', { bubbles: true }));

    // Check that values are set
    expect(document.getElementById('total_toonie').textContent).toBe('50.00');
    expect(document.getElementById('total_fifty_dollar_bill').textContent).toBe('100.00');
    expect(document.getElementById('grand_total').textContent).toBe('150.00');
    expect(document.getElementById('difference').textContent).toBe('50.00');

    // Click reset
    const resetButton = document.getElementById('resetButton');
    resetButton.click();

    // Check that values are reset
    expect(document.getElementById('toonie_roll').value).toBe('');
    expect(document.getElementById('fifty_dollar_bill_count').value).toBe('');
    expect(document.getElementById('total_toonie').textContent).toBe('0.00');
    expect(document.getElementById('total_fifty_dollar_bill').textContent).toBe('0.00');
    expect(document.getElementById('open_cash').value).toBe('300');
    expect(document.getElementById('grand_total').textContent).toBe('0.00');
    expect(document.getElementById('difference').textContent).toBe('-300.00');
  });
});
