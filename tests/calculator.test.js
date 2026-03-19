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

    // Mock window.confirm to return true
    const originalConfirm = window.confirm;
    window.confirm = () => true;

    resetButton.click();

    // Restore window.confirm
    window.confirm = originalConfirm;

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

describe('Deposit Helper', () => {
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

  it('should switch to deposit tab and sync data from calculator', () => {
    // 1. Set values in the calculator tab
    const hundredBillInput = document.getElementById('hundre_dollar_bill_count');
    hundredBillInput.value = 5;
    hundredBillInput.dispatchEvent(new window.Event('input', { bubbles: true }));

    const twentyBillInput = document.getElementById('twenty_dollar_bill_count');
    twentyBillInput.value = 3;
    twentyBillInput.dispatchEvent(new window.Event('input', { bubbles: true }));

    // 2. Switch to the deposit tab
    const depositTabButton = document.querySelector('[data-tab="deposit"]');
    depositTabButton.click();

    // 3. Verify data is synced
    expect(document.getElementById('dep_hundre_dollar_bill_count').value).toBe('5');
    expect(document.getElementById('dep_twenty_dollar_bill_count').value).toBe('3');

    // Check that totals are calculated in deposit tab as well
    expect(document.getElementById('dep_total_hundre_dollar_bill').textContent).toBe('500.00');
    expect(document.getElementById('dep_total_twenty_dollar_bill').textContent).toBe('60.00');
  });

  it('should calculate till requirements correctly', () => {
    // 1. Set values in the calculator tab
    document.getElementById('hundre_dollar_bill_count').value = 2;
    document.getElementById('hundre_dollar_bill_count').dispatchEvent(new window.Event('input', { bubbles: true })); // 200
    document.getElementById('twenty_dollar_bill_count').value = 3;
    document.getElementById('twenty_dollar_bill_count').dispatchEvent(new window.Event('input', { bubbles: true })); // 60
    document.getElementById('five_dollar_bill_count').value = 4;
    document.getElementById('five_dollar_bill_count').dispatchEvent(new window.Event('input', { bubbles: true }));  // 20
    document.getElementById('one_dollar_coins_count').value = 5;
    document.getElementById('one_dollar_coins_count').dispatchEvent(new window.Event('input', { bubbles: true })); // 5

    // 2. Switch to the deposit tab to sync
    document.querySelector('[data-tab="deposit"]').click();

    // 3. Set received cash
    const receivedCashInput = document.getElementById('received_cash');
    receivedCashInput.value = '226'; // Needs 2x100, 1x20, 1x5, 1x1
    receivedCashInput.dispatchEvent(new window.Event('input', { bubbles: true }));

    // 4. Verify till requirements
    const tillRequirementsDiv = document.getElementById('till_requirements');
    const tillItems = tillRequirementsDiv.querySelectorAll('.till-item');

    expect(tillItems.length).toBe(4); // Four denominations are needed
    expect(tillItems[0].textContent).toContain('$100 Bills x 2');
    expect(tillItems[0].textContent).toContain('$200.00');

    expect(tillItems[1].textContent).toContain('$20 Bills x 1');
    expect(tillItems[1].textContent).toContain('$20.00');

    expect(tillItems[2].textContent).toContain('$5 Bills x 1');
    expect(tillItems[2].textContent).toContain('$5.00');

    expect(tillItems[3].textContent).toContain('$1 Coins x 1');
    expect(tillItems[3].textContent).toContain('$1.00');
  });

  it('should show a warning if the exact amount cannot be made', () => {
    // 1. Set values in the calculator tab (not enough to make the amount)
    document.getElementById('twenty_dollar_bill_count').value = 3; // Total of 60
    document.getElementById('twenty_dollar_bill_count').dispatchEvent(new window.Event('input', { bubbles: true }));

    // 2. Switch to deposit tab
    document.querySelector('[data-tab="deposit"]').click();

    // 3. Set received cash to an amount that cannot be made
    const receivedCashInput = document.getElementById('received_cash');
    receivedCashInput.value = '65';
    receivedCashInput.dispatchEvent(new window.Event('input', { bubbles: true }));

    // 4. Verify the warning message
    const tillRequirementsDiv = document.getElementById('till_requirements');
    const warningMessage = tillRequirementsDiv.querySelector('.till-item[style*="color: #F44336;"]');

    expect(warningMessage).not.toBe(null);
    expect(warningMessage.textContent).toContain('Cannot make exact amount - remaining:');
    expect(warningMessage.textContent).toContain('$5.00');
  });
});
