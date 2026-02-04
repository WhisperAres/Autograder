/**
 * TestCases - Comprehensive test suite for Calculator and ArrayOperations
 * Lab Assignment: Unit Testing Fundamentals
 * 
 * Contains 5 test cases:
 * 1. Test Calculator arithmetic operations
 * 2. Test Calculator division by zero
 * 3. Test ArrayOperations sum and average
 * 4. Test ArrayOperations find max and reverse
 * 5. Test ArrayOperations count occurrences
 */
public class TestCases {
    
    private static int passedTests = 0;
    private static int totalTests = 0;
    
    /**
     * TEST CASE 1: Calculator Arithmetic Operations
     * Tests: add, subtract, multiply, divide, max
     */
    public static void testCalculatorOperations() {
        System.out.println("\n=== TEST CASE 1: Calculator Arithmetic Operations ===");
        totalTests++;
        
        Calculator calc = new Calculator();
        
        // Test add
        assert calc.add(5, 3) == 8 : "Add failed: 5 + 3 should be 8";
        System.out.println("✓ Addition: 5 + 3 = " + calc.add(5, 3));
        
        // Test subtract
        assert calc.subtract(10, 4) == 6 : "Subtract failed: 10 - 4 should be 6";
        System.out.println("✓ Subtraction: 10 - 4 = " + calc.subtract(10, 4));
        
        // Test multiply
        assert calc.multiply(6, 7) == 42 : "Multiply failed: 6 * 7 should be 42";
        System.out.println("✓ Multiplication: 6 * 7 = " + calc.multiply(6, 7));
        
        // Test divide
        assert calc.divide(20, 4) == 5 : "Divide failed: 20 / 4 should be 5";
        System.out.println("✓ Division: 20 / 4 = " + calc.divide(20, 4));
        
        // Test max
        assert calc.max(15, 9) == 15 : "Max failed: max(15, 9) should be 15";
        System.out.println("✓ Maximum: max(15, 9) = " + calc.max(15, 9));
        
        System.out.println("PASSED: All Calculator operations work correctly");
        passedTests++;
    }
    
    /**
     * TEST CASE 2: Calculator Division by Zero Exception
     * Tests: divide throws ArithmeticException for division by zero
     */
    public static void testCalculatorDivisionByZero() {
        System.out.println("\n=== TEST CASE 2: Calculator Division by Zero ===");
        totalTests++;
        
        Calculator calc = new Calculator();
        boolean exceptionThrown = false;
        
        try {
            calc.divide(10, 0);
        } catch (ArithmeticException e) {
            exceptionThrown = true;
            System.out.println("✓ Exception caught: " + e.getMessage());
        }
        
        assert exceptionThrown : "Division by zero should throw ArithmeticException";
        System.out.println("PASSED: Division by zero properly throws exception");
        passedTests++;
    }
    
    /**
     * TEST CASE 3: ArrayOperations Sum and Average
     * Tests: sumArray and averageArray methods
     */
    public static void testArraySumAndAverage() {
        System.out.println("\n=== TEST CASE 3: Array Sum and Average ===");
        totalTests++;
        
        ArrayOperations arrayOps = new ArrayOperations();
        int[] testArray = {10, 20, 30, 40, 50};
        
        // Test sum
        int sum = arrayOps.sumArray(testArray);
        assert sum == 150 : "Sum failed: sum of [10,20,30,40,50] should be 150";
        System.out.println("✓ Array Sum: [10,20,30,40,50] = " + sum);
        
        // Test average
        double average = arrayOps.averageArray(testArray);
        assert average == 30.0 : "Average failed: average should be 30.0";
        System.out.println("✓ Array Average: [10,20,30,40,50] = " + average);
        
        // Test with empty array
        int emptySum = arrayOps.sumArray(new int[]{});
        assert emptySum == 0 : "Empty array sum should be 0";
        System.out.println("✓ Empty array handling: sum = " + emptySum);
        
        System.out.println("PASSED: Array sum and average calculations are correct");
        passedTests++;
    }
    
    /**
     * TEST CASE 4: ArrayOperations Find Max and Reverse
     * Tests: findMax and reverseArray methods
     */
    public static void testArrayMaxAndReverse() {
        System.out.println("\n=== TEST CASE 4: Array Max and Reverse ===");
        totalTests++;
        
        ArrayOperations arrayOps = new ArrayOperations();
        int[] testArray = {3, 8, 1, 9, 5};
        
        // Test find max
        int max = arrayOps.findMax(testArray);
        assert max == 9 : "Find max failed: maximum should be 9";
        System.out.println("✓ Find Max: [3,8,1,9,5] -> " + max);
        
        // Test reverse
        int[] reversed = arrayOps.reverseArray(testArray);
        assert reversed[0] == 5 && reversed[4] == 3 : "Reverse failed";
        System.out.println("✓ Reverse: [3,8,1,9,5] -> [5,9,1,8,3]");
        
        // Test with single element
        int[] singleElement = {42};
        int singleMax = arrayOps.findMax(singleElement);
        assert singleMax == 42 : "Single element max failed";
        System.out.println("✓ Single element max: [42] -> " + singleMax);
        
        System.out.println("PASSED: Array max and reverse operations work correctly");
        passedTests++;
    }
    
    /**
     * TEST CASE 5: ArrayOperations Count Occurrences
     * Tests: countOccurrences method with various inputs
     */
    public static void testCountOccurrences() {
        System.out.println("\n=== TEST CASE 5: Count Occurrences ===");
        totalTests++;
        
        ArrayOperations arrayOps = new ArrayOperations();
        
        // Test with repeated elements
        int[] testArray1 = {1, 2, 3, 2, 2, 4, 2, 5};
        int count1 = arrayOps.countOccurrences(testArray1, 2);
        assert count1 == 4 : "Count occurrences failed: 2 appears 4 times";
        System.out.println("✓ Count [1,2,3,2,2,4,2,5] for 2: " + count1);
        
        // Test with no occurrences
        int count2 = arrayOps.countOccurrences(testArray1, 10);
        assert count2 == 0 : "Count should be 0 when element not found";
        System.out.println("✓ Count [1,2,3,2,2,4,2,5] for 10: " + count2);
        
        // Test with all same elements
        int[] testArray2 = {7, 7, 7, 7};
        int count3 = arrayOps.countOccurrences(testArray2, 7);
        assert count3 == 4 : "Count should be 4 for array of all 7s";
        System.out.println("✓ Count [7,7,7,7] for 7: " + count3);
        
        System.out.println("PASSED: Count occurrences works correctly for all cases");
        passedTests++;
    }
    
    /**
     * Main method - runs all test cases
     */
    public static void main(String[] args) {
        System.out.println("╔════════════════════════════════════════════════════════╗");
        System.out.println("║     Lab Assignment Test Suite - Calculator & Arrays    ║");
        System.out.println("║                    Running 5 Test Cases                 ║");
        System.out.println("╚════════════════════════════════════════════════════════╝");
        
        try {
            testCalculatorOperations();
            testCalculatorDivisionByZero();
            testArraySumAndAverage();
            testArrayMaxAndReverse();
            testCountOccurrences();
            
            System.out.println("\n╔════════════════════════════════════════════════════════╗");
            System.out.println("║                    TEST RESULTS                        ║");
            System.out.println("║  PASSED: " + passedTests + "/" + totalTests + " test cases");
            System.out.println("║  STATUS: ALL TESTS PASSED ✓                            ║");
            System.out.println("╚════════════════════════════════════════════════════════╝\n");
            
        } catch (AssertionError e) {
            System.out.println("\n✗ TEST FAILED: " + e.getMessage());
            System.out.println("PASSED: " + passedTests + "/" + totalTests + " test cases");
            System.exit(1);
        }
    }
}
