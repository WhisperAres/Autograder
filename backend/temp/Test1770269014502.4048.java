public class Test1770269014502.4048 {
    public static void main(String[] args) {
        try {
            void testTransactionIsInternational() {
        Transaction t1 = new Transaction("TXN-101", 100.0, 'C', true);
        Transaction t2 = new Transaction("TXN-102", 100.0, 'D', false);
        
        assertTrue(t1.isInternational());
        assertFalse(t2.isInternational());
    }
            System.out.println("PASS");
        } catch (AssertionError e) {
            System.out.println("FAIL: " + e.getMessage());
        } catch (Exception e) {
            System.out.println("FAIL: " + e.getMessage());
        }
    }
}