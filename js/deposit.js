// ============================================
// Deposit Calculator Logic
// ============================================

const depositDefaults = {
  dep_hundre_dollar_bill_count: 100,
  dep_fifty_dollar_bill_count: 50,
  dep_twenty_dollar_bill_count: 20,
  dep_ten_dollar_bill_count: 10,
  dep_five_dollar_bill_count: 5,
  dep_two_dollar_coins_count: 2,
  dep_one_dollar_coins_count: 1,
  dep_quarter_count: 0.25,
  dep_ten_cent_count: 0.10,
  dep_five_cent_count: 0.05
};

function calculateDepositItemTotal(inputId) {
  const inputElement = document.getElementById(inputId);
  let resultId;

  // Handle specific cent counts first
  if (inputId === 'dep_quarter_count') {
    resultId = 'dep_total_quarter_cent';
  } else if (inputId === 'dep_ten_cent_count') {
    resultId = 'dep_total_ten_cent';
  } else if (inputId === 'dep_five_cent_count') {
    resultId = 'dep_total_five_cent';
  } else {
    // Original logic for bills and coins
    resultId = 'dep_total_' + inputId.replace(/^dep_/, '').replace(/_count$/, '');
  }

  let countValue = inputElement.value;
  // Sanitize input: allow only digits
  countValue = countValue.replace(/[^0-9]/g, '');
  inputElement.value = countValue;

  const count = parseInt(countValue) || 0;
  const defaultValue = depositDefaults[inputId];
  const total = defaultValue * count;

  const resultElement = document.getElementById(resultId);
  if (resultElement) {
    resultElement.textContent = total.toFixed(2);
  }

  calculateDepositGrandTotal();
}

function calculateDepositGrandTotal() {
  // Calculate total from synced money
  const totalIds = [
    'dep_total_hundre_dollar_bill', 'dep_total_fifty_dollar_bill', 'dep_total_twenty_dollar_bill',
    'dep_total_ten_dollar_bill', 'dep_total_five_dollar_bill', 'dep_total_two_dollar_coins',
    'dep_total_one_dollar_coins', 'dep_total_quarter_cent', 'dep_total_ten_cent', 'dep_total_five_cent'
  ];

  const totalYouHave = totalIds.reduce((acc, id) => {
    const element = document.getElementById(id);
    return acc + (parseFloat(element?.textContent) || 0);
  }, 0);

  // Helper to process input (sanitize and return float)
  const processInput = (inputId) => {
    const input = document.getElementById(inputId);
    if (!input) return 0;
    let val = input.value;
    let original = val;
    val = val.replace(/[^0-9.]/g, '');
    const decimalParts = val.split('.');
    if (decimalParts.length > 2) {
      val = decimalParts[0] + '.' + decimalParts[1];
    } else if (decimalParts.length === 2 && decimalParts[1].length > 2) {
      val = decimalParts[0] + '.' + decimalParts[1].substring(0, 2);
    }
    if (val !== original) {
      input.value = val;
    }
    return parseFloat(val) || 0;
  };

  const receivedCash = processInput('received_cash');
  const payoutCash = processInput('payout_cash');

  const netDeposit = receivedCash - payoutCash;

  const netDepositElement = document.getElementById('net_deposit');
  if (netDepositElement) {
    netDepositElement.textContent = netDeposit.toFixed(2);
    if (netDeposit < 0) {
      netDepositElement.style.color = '#F44336';
    } else {
      netDepositElement.style.color = '#ffffff';
    }
  }

  // Display till requirements based on net deposit amount only (if positive)
  calculateTillRequirements(netDeposit > 0 ? netDeposit : 0);
}

function calculateTillRequirements(receivedAmount) {
  const tillRequirementsDiv = document.getElementById('till_requirements');

  if (receivedAmount <= 0) {
    tillRequirementsDiv.innerHTML = '<p style="color: #aaa;">Enter the received cash amount to see till requirements.</p>';
    return;
  }

  // Get current counts and their values from deposit helper
  const currentDenominations = [
    { name: '$100 Bills', value: 100, count: parseInt(document.getElementById('dep_hundre_dollar_bill_count').value) || 0 },
    { name: '$50 Bills', value: 50, count: parseInt(document.getElementById('dep_fifty_dollar_bill_count').value) || 0 },
    { name: '$20 Bills', value: 20, count: parseInt(document.getElementById('dep_twenty_dollar_bill_count').value) || 0 },
    { name: '$10 Bills', value: 10, count: parseInt(document.getElementById('dep_ten_dollar_bill_count').value) || 0 },
    { name: '$5 Bills', value: 5, count: parseInt(document.getElementById('dep_five_dollar_bill_count').value) || 0 },
    { name: '$2 Coins', value: 2, count: parseInt(document.getElementById('dep_two_dollar_coins_count').value) || 0 },
    { name: '$1 Coins', value: 1, count: parseInt(document.getElementById('dep_one_dollar_coins_count').value) || 0 },
    { name: '$0.25 Coins', value: 0.25, count: parseInt(document.getElementById('dep_quarter_count').value) || 0 },
    { name: '$0.10 Coins', value: 0.10, count: parseInt(document.getElementById('dep_ten_cent_count').value) || 0 },
    { name: '$0.05 Coins', value: 0.05, count: parseInt(document.getElementById('dep_five_cent_count').value) || 0 }
  ];

  // Calculate total current amount
  let currentTotal = 0;
  currentDenominations.forEach(denom => {
    currentTotal += denom.count * denom.value;
  });
  currentTotal = Math.round(currentTotal * 100) / 100;

  // Always show optimal combination, regardless of total
  let remaining = receivedAmount;
  let html = `<p style="color: #4CAF50; margin-bottom: 15px;"><strong>To make $${receivedAmount.toFixed(2)}, take these from your current amounts:</strong></p>`;
  let hasRequirements = false;

  // Sort denominations by value descending for optimal combination
  currentDenominations.sort((a, b) => b.value - a.value);

  currentDenominations.forEach(denom => {
    if (remaining >= denom.value && denom.count > 0) {
      const maxCount = Math.min(denom.count, Math.floor(remaining / denom.value));
      if (maxCount > 0) {
        const amount = maxCount * denom.value;
        remaining = Math.round((remaining - amount) * 100) / 100;

        html += `<div class="till-item highlight-required">
          <span>${denom.name} x ${maxCount}</span>
          <span style="color: #4CAF50;">= $${amount.toFixed(2)}</span>
        </div>`;
        hasRequirements = true;
      }
    }
  });

  if (!hasRequirements) {
    html += `<div class="till-item" style="color: #666;">
      <span>Unable to make exact amount with current denominations</span>
    </div>`;
  }

  if (remaining > 0.001) {
    html += `<div class="till-item" style="color: #F44336;">
      <span>⚠️ Cannot make exact amount - remaining:</span>
      <span>$${remaining.toFixed(2)}</span>
    </div>`;
  }

  tillRequirementsDiv.innerHTML = html;
}

function resetDepositAll() {
  Object.keys(depositDefaults).forEach(inputId => {
    const inputElement = document.getElementById(inputId);
    if (inputElement) {
      inputElement.value = '';
      calculateDepositItemTotal(inputId);
    }
  });

  ['received_cash', 'payout_cash', 'payout_count'].forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.value = '0';
      if (id !== 'payout_count') calculateDepositGrandTotal();
    }
  });

  calculateDepositGrandTotal();

  const payoutWarning = document.getElementById('payout-warning');
  if (payoutWarning) {
    payoutWarning.style.display = 'none';
  }

  const payoutSection = document.getElementById('section-payout');
  if (payoutSection) {
    payoutSection.classList.remove('highlight-warning');
  }

  const uploadedCount = document.getElementById('payout-uploaded-count');
  if (uploadedCount) {
    uploadedCount.textContent = '0';
  }

  const expectedCount = document.getElementById('payout-expected-count');
  if (expectedCount) {
    expectedCount.textContent = '0';
  }
}

// Auto-sync data from Count Calculator to Deposit Helper
function autoSyncFromCalculator() {
  const fieldMapping = {
    'hundre_dollar_bill_count': 'dep_hundre_dollar_bill_count',
    'fifty_dollar_bill_count': 'dep_fifty_dollar_bill_count',
    'twenty_dollar_bill_count': 'dep_twenty_dollar_bill_count',
    'ten_dollar_bill_count': 'dep_ten_dollar_bill_count',
    'five_dollar_bill_count': 'dep_five_dollar_bill_count',
    'two_dollar_coins_count': 'dep_two_dollar_coins_count',
    'one_dollar_coins_count': 'dep_one_dollar_coins_count',
    'quarter_count': 'dep_quarter_count',
    'ten_cent_count': 'dep_ten_cent_count',
    'five_cent_count': 'dep_five_cent_count'
  };

  Object.keys(fieldMapping).forEach(calcId => {
    const calcElement = document.getElementById(calcId);
    const depElement = document.getElementById(fieldMapping[calcId]);

    if (calcElement && depElement) {
      depElement.value = calcElement.value || '';
      calculateDepositItemTotal(fieldMapping[calcId]);
    }
  });

  calculateDepositGrandTotal();
}

function initializeDepositCalculator() {
  // Add event listeners for cash inputs
  ['received_cash', 'payout_cash'].forEach(id => {
    const input = document.getElementById(id);
    if (input) {
      input.addEventListener('input', () => {
        calculateDepositGrandTotal();
        // Save to localStorage (uses function from calculator.js)
        if (typeof saveToLocalStorage === 'function') saveToLocalStorage();
      });
      input.addEventListener('blur', function () {
        let value = this.value.trim();
        if (value && !value.includes('.')) {
          this.value = value + '.00';
          calculateDepositGrandTotal();
          if (typeof saveToLocalStorage === 'function') saveToLocalStorage();
        }
      });
    }
  });

  // Payout count - ensure positive integers
  const payoutCount = document.getElementById('payout_count');
  if (payoutCount) {
    payoutCount.addEventListener('input', function () {
      this.value = this.value.replace(/[^0-9]/g, '');
      if (typeof saveToLocalStorage === 'function') saveToLocalStorage();
    });
  }

  // Initial calculation
  calculateDepositGrandTotal();

  // Initialize Photo Handlers
  initializePhotoHandlers();
}
