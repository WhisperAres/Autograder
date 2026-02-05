public class Test1770269056096.263 {
    public static void main(String[] args) {
        try {
            Transaction international = new Transaction("INT-201", 200.0, 'D', true);
Transaction domestic = new Transaction("DOM-202", 200.0, 'D', false);

assert international.getProcessingFee() == 5 : "International fee should be 5";
assert domestic.getProcessingFee() == 0 : "Domestic fee should be 0";

System.out.println("PASS");
            System.out.println("PASS");
        } catch (AssertionError e) {
            System.out.println("FAIL: " + e.getMessage());
        } catch (Exception e) {
            System.out.println("FAIL: " + e.getMessage());
        }
    }
}