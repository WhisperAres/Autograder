// Script to create BITS-Pay test cases in the database for a given assignment
// Usage: node backend/scripts/create_bits_pay_tests.js <assignmentId>

const path = require('path');
const models = require('../src/models');

async function main() {
  const assignmentId = process.argv[2];
  if (!assignmentId) {
    console.error('Usage: node create_bits_pay_tests.js <assignmentId>');
    process.exit(1);
  }

  const TestCase = require('../src/models/testCase');

  const tests = [
    {
      testName: 'isInternational',
      testCode: `Transaction t1 = new Transaction("TXN-101", 100.0, 'C', true);
Transaction t2 = new Transaction("TXN-102", 100.0, 'D', false);
assertTrue(t1.isInternational());
assertFalse(t2.isInternational());`,
      marks: 0.5,
      isHidden: false
    },
    {
      testName: 'getProcessingFee',
      testCode: `Transaction international = new Transaction("INT-201", 200.0, 'D', true);
Transaction domestic = new Transaction("DOM-202", 200.0, 'D', false);
assertEquals(5, international.getProcessingFee());
assertEquals(0, domestic.getProcessingFee());`,
      marks: 0.5,
      isHidden: false
    },
    {
      testName: 'getType',
      testCode: `Transaction credit = new Transaction("TXN-301", 150.0, 'C', false);
Transaction debit = new Transaction("TXN-302", 150.0, 'D', true);
assertEquals('C', credit.getType());
assertEquals('D', debit.getType());`,
      marks: 0.5,
      isHidden: false
    },
    {
      testName: 'addTransaction',
      testCode: `Wallet w = new Wallet("Poojan Virani", "2023A3PS0123G", 5);
Transaction t = new Transaction("TXN-401", 100.0, 'C', false);
assertTrue(w.addTransaction(t));
assertEquals(1, w.getCount());`,
      marks: 0.5,
      isHidden: false
    },
    {
      testName: 'getCampus',
      testCode: `Wallet goaWallet = new Wallet("Student1", "2023A3PS0123G", 5);
Wallet hydWallet = new Wallet("Student2", "2022A7PS1234A", 5);
Wallet pilaniWallet = new Wallet("Student3", "2021A1PS5678Z", 5);
assertEquals('G', goaWallet.getCampus());
assertEquals('A', hydWallet.getCampus());
assertEquals('Z', pilaniWallet.getCampus());`,
      marks: 0.5,
      isHidden: false
    },
    {
      testName: 'getShortCode',
      testCode: `Wallet w1 = new Wallet("Alice", "2023A3PS1102G", 5);
Wallet w2 = new Wallet("Bob", "2022A7PS1003H", 5);
assertEquals(1102, w1.getShortCode());
assertEquals(1003, w2.getShortCode());`,
      marks: 0.5,
      isHidden: false
    },
    {
      testName: 'calculateCreditScore',
      testCode: `Wallet w = new Wallet("Student", "2023A3PS0100K", 5);
assertEquals(175, w.calculateCreditScore());`,
      marks: 0.5,
      isHidden: false
    },
    {
      testName: 'calculateBalanceOnlyCredits',
      testCode: `Processor p = new Processor();
Wallet w = new Wallet("Test", "2023A3PS0001G", 5);
w.addTransaction(new Transaction("TXN-801", 100.0, 'C', false));
w.addTransaction(new Transaction("TXN-802", 50.0, 'C', false));
w.addTransaction(new Transaction("TXN-803", 25.0, 'C', false));
assertEquals(175.0, p.calculateBalance(w));`,
      marks: 0.25,
      isHidden: false
    },
    {
      testName: 'calculateBalanceMixed',
      testCode: `Processor p = new Processor();
Wallet w = new Wallet("Test", "2023A3PS0001G", 5);
w.addTransaction(new Transaction("TXN-901", 200.0, 'C', false));
w.addTransaction(new Transaction("TXN-902", 50.0, 'D', false));
w.addTransaction(new Transaction("TXN-903", 30.0, 'D', true));
assertEquals(115.0, p.calculateBalance(w));`,
      marks: 0.25,
      isHidden: false
    },
    {
      testName: 'convertToTokens',
      testCode: `Processor p = new Processor();
assertEquals(151, p.convertToTokens(100.99));
assertEquals(76, p.convertToTokens(50.8));`,
      marks: 0.5,
      isHidden: false
    },
    {
      testName: 'isEligibleForUpgrade',
      testCode: `Processor p = new Processor();
Wallet w = new Wallet("Test", "2023A3PS0500G", 5);
w.addTransaction(new Transaction("TXN-1101", 500.0, 'C', false));
assertTrue(p.isEligibleForUpgrade(w));`,
      marks: 0.25,
      isHidden: false
    },
    {
      testName: 'getHistory',
      testCode: `Processor p = new Processor();
Wallet w = new Wallet("Test", "2023A3PS0001G", 5);
Transaction t1 = new Transaction("TXN-1201", 100.0, 'C', false);
Transaction t2 = new Transaction("TXN-1202", 50.0, 'D', false);
w.addTransaction(t1);
w.addTransaction(t2);
Transaction[] history = p.getTransactions(w);
assertNotNull(history);
assertEquals(t1, history[0]);
assertEquals(t2, history[1]);`,
      marks: 0.25,
      isHidden: false
    },
    // Hidden tests
    {
      testName: 'hidden-eligibility-false-1',
      testCode: `Processor p = new Processor();
Wallet w = new Wallet("Test", "2023A3PS0050G", 5);
w.addTransaction(new Transaction("TXN-1301", 100.0, 'C', false));
assertFalse(p.isEligibleForUpgrade(w));`,
      marks: 0.5,
      isHidden: true
    },
    {
      testName: 'hidden-eligibility-false-2',
      testCode: `Processor p = new Processor();
Wallet w = new Wallet("Test", "2023A3PS0200H", 5);
w.addTransaction(new Transaction("TXN-1401", 300.0, 'C', false));
w.addTransaction(new Transaction("TXN-1402", 100.0, 'D', false));
assertFalse(p.isEligibleForUpgrade(w));`,
      marks: 0.5,
      isHidden: true
    },
    {
      testName: 'hidden-calc-balance-mixed-different',
      testCode: `Processor p = new Processor();
Wallet w = new Wallet("Test", "2023A3PS0001G", 5);
w.addTransaction(new Transaction("TXN-1501", 500.0, 'C', true));
w.addTransaction(new Transaction("TXN-1502", 100.0, 'D', true));
w.addTransaction(new Transaction("TXN-1503", 200.0, 'C', false));
w.addTransaction(new Transaction("TXN-1504", 50.0, 'D', false));
assertEquals(545.0, p.calculateBalance(w));`,
      marks: 0.75,
      isHidden: true
    },
    {
      testName: 'hidden-calc-credits-only',
      testCode: `Processor p = new Processor();
Wallet w = new Wallet("Test", "2023A3PS0001G", 5);
w.addTransaction(new Transaction("TXN-1601", 250.0, 'C', false));
w.addTransaction(new Transaction("TXN-1602", 150.0, 'C', true));
w.addTransaction(new Transaction("TXN-1603", 100.0, 'C', false));
assertEquals(500.0, p.calculateBalance(w));`,
      marks: 0.75,
      isHidden: true
    },
    {
      testName: 'hidden-getCategory',
      testCode: `Transaction t1 = new Transaction("TXN-701", 100.0, 'C', false);
Transaction t2 = new Transaction("INT-702", 200.0, 'D', true);
Transaction t3 = new Transaction("DOM-703", 150.0, 'C', false);
assertEquals("TXN", t1.getCategory());
assertEquals("INT", t2.getCategory());
assertEquals("DOM", t3.getCategory());`,
      marks: 0.75,
      isHidden: true
    },
    {
      testName: 'hidden-isInternational-variations',
      testCode: `Transaction domestic1 = new Transaction("TXN-801", 100.0, 'C', false);
Transaction domestic2 = new Transaction("TXN-802", 200.0, 'D', false);
Transaction international = new Transaction("TXN-803", 300.0, 'C', true);
assertFalse(domestic1.isInternational());
assertFalse(domestic2.isInternational());
assertTrue(international.isInternational());`,
      marks: 0.5,
      isHidden: true
    },
    {
      testName: 'hidden-getShortCode-variations',
      testCode: `Wallet w1 = new Wallet("Test1", "2023A3PS0001G", 5);
Wallet w2 = new Wallet("Test2", "2022A7PS9999H", 5);
Wallet w3 = new Wallet("Test3", "2021A1PS0500P", 5);
assertEquals(1, w1.getShortCode());
assertEquals(9999, w2.getShortCode());
assertEquals(500, w3.getShortCode());`,
      marks: 0.5,
      isHidden: true
    },
    {
      testName: 'hidden-calc-balance-negative',
      testCode: `Processor p = new Processor();
Wallet w = new Wallet("Test", "2023A3PS0001G", 5);
w.addTransaction(new Transaction("TXN-1901", 100.0, 'C', false));
w.addTransaction(new Transaction("TXN-1902", 200.0, 'D', true));
w.addTransaction(new Transaction("TXN-1903", 50.0, 'D', false));
assertEquals(-1.0, p.calculateBalance(w));`,
      marks: 0.75,
      isHidden: true
    }
  ];

  try {
    for (const t of tests) {
      await TestCase.create({
        assignmentId: parseInt(assignmentId),
        testName: t.testName,
        testCode: t.testCode,
        marks: t.marks,
        isHidden: t.isHidden
      });
      console.log('Inserted test:', t.testName);
    }
    console.log('All tests inserted for assignment', assignmentId);
  } catch (err) {
    console.error('Error inserting tests:', err.message || err);
  } finally {
    process.exit(0);
  }
}

main();
