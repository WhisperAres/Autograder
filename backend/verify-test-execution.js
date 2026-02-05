#!/usr/bin/env node

/**
 * Test Runner - Local Verification Script
 * Verifies that test case execution works before running in the system
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const testCode = `
public class VerifyTest {
    public static void main(String[] args) {
        try {
            // Test 1: Simple assertion
            int sum = 5 + 5;
            assert sum == 10 : "Sum should be 10";
            
            // Test 2: Boolean assertion
            boolean isValid = true;
            assert isValid == true : "Should be valid";
            
            // All passed
            System.out.println("PASS");
        } catch (AssertionError e) {
            System.out.println("FAIL: " + e.getMessage());
        } catch (Exception e) {
            System.out.println("FAIL: " + e.getMessage());
            e.printStackTrace();
        }
    }
}
`;

const tempDir = path.join(__dirname, 'temp', `verify_${Date.now()}`);

console.log('🧪 Verifying test case execution...\n');

try {
    // Create temp directory
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Write test file
    fs.writeFileSync(path.join(tempDir, 'VerifyTest.java'), testCode);
    console.log('✓ Created test file');
    
    // Compile
    execSync(`cd "${tempDir}" && javac VerifyTest.java`, { encoding: 'utf-8' });
    console.log('✓ Compiled successfully');
    
    // Run
    const output = execSync(`cd "${tempDir}" && java VerifyTest`, { 
        encoding: 'utf-8',
        timeout: 5000
    }).trim();
    
    console.log('✓ Executed successfully');
    console.log(`✓ Output: ${output}`);
    
    if (output.includes('PASS')) {
        console.log('\n✅ TEST EXECUTION WORKING!\n');
        console.log('Your test case system is ready to use.');
        console.log('\nTest Case Format:');
        console.log('================');
        console.log('Name: Verify Math');
        console.log('Code:');
        console.log('  int sum = 5 + 5;');
        console.log('  assert sum == 10 : "Sum should be 10";');
        console.log('  System.out.println("PASS");');
        console.log('Marks: 10');
    } else {
        console.log('\n⚠️  Unexpected output:', output);
    }
    
} catch (error) {
    console.error('\n❌ VERIFICATION FAILED\n');
    console.error('Error:', error.message);
    console.error('\nMake sure Java is installed:');
    console.error('  javac -version');
    console.error('  java -version');
} finally {
    // Cleanup
    try {
        fs.rmSync(tempDir, { recursive: true, force: true });
    } catch (e) {
        // Ignore cleanup errors
    }
}
