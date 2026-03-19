// ============================================
// Calculator Logic + localStorage Persistence
// ============================================

const STORAGE_KEY = 'coinCalculatorData';

// Define default values for rolls and bills/coins
const defaults = {
  toonie_roll: 50,
  loonie_roll: 25,
  quarter_roll: 10,
  dime_roll: 5,
  nickel_roll: 2,
  hundre_dollar_bill_count: 100,
  fifty_dollar_bill_count: 50,
  twenty_dollar_bill_count: 20,
  ten_dollar_bill_count: 10,
  five_dollar_bill_count: 5,
  two_dollar_coins_count: 2,
  one_dollar_coins_count: 1,
  quarter_count: 0.25,
  ten_cent_count: 0.10,
  five_cent_count: 0.05
};

// --- localStorage Functions ---

function saveToLocalStorage() {
  const data = {};

  // Save calculator fields
  Object.keys(defaults).forEach(inputId => {
    const el = document.getElementById(inputId);
    if (el) data[inputId] = el.value;
  });

  // Save open cash
  const openCash = document.getElementById('open_cash');
  if (openCash) data['open_cash'] = openCash.value;

  // Save deposit fields
  const depositFields = ['received_cash', 'payout_cash', 'payout_count'];
  depositFields.forEach(id => {
    const el = document.getElementById(id);
    if (el) data[id] = el.value;
  });

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.warn('Failed to save to localStorage:', e);
  }
}

function loadFromLocalStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch (e) {
    console.warn('Failed to load from localStorage:', e);
    return null;
  }
}

function clearLocalStorage() {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (e) {
    console.warn('Failed to clear localStorage:', e);
  }
}

// --- Calculator Functions ---

// Function to sanitize input and calculate total for one item
function calculateItemTotal(inputId) {
  const inputElement = document.getElementById(inputId);
  // Derive result ID more robustly
  let resultId;
  // Handle specific cent counts first
  if (inputId === 'quarter_count') {
    resultId = 'total_quarter_cent';
  } else if (inputId === 'ten_cent_count') {
    resultId = 'total_ten_cent';
  } else if (inputId === 'five_cent_count') {
    resultId = 'total_five_cent';
  } else {
    // Original logic for rolls and bills
    resultId = 'total_' + inputId.replace(/_count$|_roll$/, '');
  }

  let countValue = inputElement.value;

  // Sanitize input: allow only digits (remove non-digits)
  countValue = countValue.replace(/[^0-9]/g, '');
  inputElement.value = countValue; // Update the input field with sanitized value

  const count = parseInt(countValue) || 0; // Use parseInt for integer counts
  const defaultValue = defaults[inputId];
  const total = defaultValue * count;

  const resultElement = document.getElementById(resultId);
  if (resultElement) {
    resultElement.textContent = total.toFixed(2);
  } else {
    console.error(`Result element not found for ID: ${resultId} derived from ${inputId}`);
  }

  calculateGrandTotal(); // Recalculate grand total whenever an item total changes
}

// Function to calculate the grand total and difference
function calculateGrandTotal() {
  const totalIds = [
    'total_toonie', 'total_loonie', 'total_quarter', 'total_dime', 'total_nickel',
    'total_hundre_dollar_bill', 'total_fifty_dollar_bill', 'total_twenty_dollar_bill',
    'total_ten_dollar_bill', 'total_five_dollar_bill', 'total_two_dollar_coins',
    'total_one_dollar_coins', 'total_quarter_cent', 'total_ten_cent', 'total_five_cent'
  ];

  const grandTotal = totalIds.reduce((acc, id) => {
    const element = document.getElementById(id);
    return acc + (parseFloat(element?.textContent) || 0);
  }, 0);

  const grandTotalElement = document.getElementById('grand_total');
  grandTotalElement.textContent = grandTotal.toFixed(2);
  highlightElement(grandTotalElement);

  // Calculate and display the difference
  const openCashInput = document.getElementById('open_cash');
  let openCashValue = openCashInput.value;
  openCashValue = openCashValue.replace(/[^0-9.]/g, '');
  const decimalParts = openCashValue.split('.');
  if (decimalParts.length > 2) {
    openCashValue = decimalParts[0] + '.' + decimalParts.slice(1).join('');
  }
  if (parseFloat(openCashValue) < 0) {
    openCashValue = '0';
  }
  openCashInput.value = openCashValue;

  const openCash = parseFloat(openCashValue) || 0;
  const difference = grandTotal - openCash;
  const differenceElement = document.getElementById('difference');
  differenceElement.textContent = difference.toFixed(2);
  differenceElement.style.color = difference >= 0 ? '#4CAF50' : '#F44336';
  highlightElement(differenceElement);
}

// Function to highlight an element
function highlightElement(element) {
  element.classList.add('highlight');
  setTimeout(() => {
    element.classList.remove('highlight');
  }, 1000);
}

// Function to reset all inputs
function resetAll() {
  if (confirm('Are you sure you want to reset all data?')) {
    Object.keys(defaults).forEach(inputId => {
      const inputElement = document.getElementById(inputId);
      if (inputElement) {
        inputElement.value = '';
        calculateItemTotal(inputId);
      }
    });
    const openCashInput = document.getElementById('open_cash');
    if (openCashInput) {
      openCashInput.value = '300';
      calculateGrandTotal();
    }

    // Clear localStorage on reset
    clearLocalStorage();
  }
}

// --- Tab Switching ---

function switchTab(tabName) {
  // Hide all tab contents
  const tabContents = document.querySelectorAll('.tab-content');
  tabContents.forEach(content => {
    content.style.display = 'none';
  });

  // Remove active class from all tab buttons
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    button.classList.remove('active');
  });

  // Show selected tab content
  const selectedTab = document.getElementById(tabName + '-tab');
  if (selectedTab) {
    selectedTab.style.display = 'block';
  }

  // Add active class to selected button
  const selectedButton = document.querySelector(`[data-tab="${tabName}"]`);
  if (selectedButton) {
    selectedButton.classList.add('active');
  }

  // Auto-sync when switching to deposit tab
  if (tabName === 'deposit') {
    autoSyncFromCalculator();
  }
}

// --- Initialization ---

function initializeCalculator() {
  // Load saved data
  const savedData = loadFromLocalStorage();

  // Restore saved values if available
  if (savedData) {
    // Restore open cash
    if (savedData['open_cash'] !== undefined) {
      document.getElementById('open_cash').value = savedData['open_cash'];
    }

    // Restore calculator fields
    Object.keys(defaults).forEach(inputId => {
      const el = document.getElementById(inputId);
      if (el && savedData[inputId] !== undefined) {
        el.value = savedData[inputId];
      }
    });

    // Restore deposit fields
    ['received_cash', 'payout_cash', 'payout_count'].forEach(id => {
      const el = document.getElementById(id);
      if (el && savedData[id] !== undefined) {
        el.value = savedData[id];
      }
    });
  }

  // Add event listeners to all count inputs
  Object.keys(defaults).forEach(inputId => {
    const inputElement = document.getElementById(inputId);
    if (inputElement) {
      inputElement.addEventListener('input', () => {
        calculateItemTotal(inputId);
        saveToLocalStorage();
      });
      // Initialize item total on load
      calculateItemTotal(inputId);
    } else {
      console.warn(`Input element not found for ID: ${inputId}`);
    }
  });

  // Add event listener for the open cash input
  const openCashInput = document.getElementById('open_cash');
  if (openCashInput) {
    openCashInput.addEventListener('input', () => {
      calculateGrandTotal();
      saveToLocalStorage();
    });
  }

  // Add event listener for reset button
  const resetButton = document.getElementById('resetButton');
  if (resetButton) {
    resetButton.addEventListener('click', resetAll);
  }

  // Calculate initial totals
  Object.keys(defaults).forEach(inputId => {
    const inputElement = document.getElementById(inputId);
    if (inputElement) {
      calculateItemTotal(inputId);
    }
  });
  calculateGrandTotal();

  // Tab buttons
  const tabButtons = document.querySelectorAll('.tab-button');
  tabButtons.forEach(button => {
    button.addEventListener('click', () => {
      const tabName = button.getAttribute('data-tab');
      switchTab(tabName);
    });
  });

  // Initialize with calculator tab active
  switchTab('calculator');

  // Initialize deposit calculator
  initializeDepositCalculator();
}

// Bootstrap on DOMContentLoaded
document.addEventListener('DOMContentLoaded', initializeCalculator);
