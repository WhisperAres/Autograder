public class Test1770269014878.044 {
    public static void main(String[] args) {
        try {
            Transaction t1 = new Transaction("TXN-101", 100.0, 'C', true);
Transaction t2 = new Transaction("TXN-102", 100.0, 'D', false);

assert t1.isInternational() == true : "t1 should be international";
assert t2.isInternational() == false : "t2 should not be international";

System.out.println("All assertions passed!");
            System.out.println("PASS");
        } catch (AssertionError e) {
            System.out.println("FAIL: " + e.getMessage());
        } catch (Exception e) {
            System.out.println("FAIL: " + e.getMessage());
        }
    }
}