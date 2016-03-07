import java.util.ArrayList;
import java.util.List;

public class Main {

    public static void main(String[] args) {
        List<List<String>> list = new ArrayList<>() ;
        List<List<String>> anonymousList = new ArrayList<List<String>>() {};
        System.out.println(list.getClass().getGenericSuperclass());
        System.out.println(anonymousList.getClass().getGenericSuperclass());
        System.out.println(anonymousList.getClass().getGenericSuperclass().);
    }
}
