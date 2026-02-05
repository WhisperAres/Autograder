public class Test1770269056730.582 {
    public static void main(String[] args) {
        try {
            static void testTransactionGetType() {
        Transaction credit = new Transaction("TXN-301", 150.0, 'C', false);
        Transaction debit  = new Transaction("TXN-302", 150.0, 'D', true);

        assert credit.getType() == 'C' : "Wrong";
        assert debit.getType() == 'D' : "Wrong";

        System.out.println("All assertions passed!");
    }
            System.out.println("PASS");
        } catch (AssertionError e) {
            System.out.println("FAIL: " + e.getMessage());
        } catch (Exception e) {
            System.out.println("FAIL: " + e.getMessage());
        }
    }
}