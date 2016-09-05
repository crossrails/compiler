package io.xrails;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Created by reeda on 31/08/2016.
 */
public class TableLine {
    public String option;
    public String description;
    public String type;
    public String defaultType;

    public TableLine(String line) {
        //parse the whole line.
        //System.out.println("line is: " + line);

        int index = line.indexOf("  ");
        boolean keepChecking = true;
        while (keepChecking) {
            //System.out.println("line " + index + " of line "+ line);
            index = line.indexOf("  ", index + 1);
            if (index == -1) {
                keepChecking = false;
            } else {
                char ch = line.charAt(index + 2);
                if (Character.isLetter(ch)) {
                    //can split param and description.
                    this.option = line.substring(0, index + 1);
                    String second = line.substring(index + 1, line.length());
                    this.description = second;
//                        System.out.println("Options: "+this.option);
//                    System.out.println("Description?: "+this.description);

                    if (line.contains("[")) {
                        ch = '[';
                        index = line.indexOf('[')-1;
                    }
                }
                if (ch == '[') {
                    String first = line.substring(0, index + 1);
                    this.description = first.replaceAll(this.option, "");
                    //System.out.println("Description?: "+this.description);
                    String second = line.substring(index + 1, line.length());
                    //System.out.println("Default?: "+second);
                    Pattern p = Pattern.compile("\\]");
                    Matcher m = p.matcher(second);
                    int count = 0;
                    while (m.find()) {
                        count += 1;
                    }
                    if (count > 1) {
                        int bracketIndex = second.indexOf("]");
                        String firstBracket = second.substring(0, bracketIndex + 1);
                        firstBracket = firstBracket.replaceAll("\\[","").replaceAll("]","");
                        this.type = firstBracket;
//                        System.out.println("Type?: "+this.type);
                        String secondBracket = second.substring(bracketIndex + 2, second.length());
                        secondBracket = secondBracket.replaceAll("\\[","").replaceAll("]","");
                        secondBracket = secondBracket.replaceAll("default: ", "");
                        this.defaultType = secondBracket;
//                        System.out.println("Default?: "+this.defaultType);
                        index += 2;
                    } else {
                        second = second.replaceAll("\\[","").replaceAll("]","");
//                        System.out.println("Type?: "+this.type);
                        if (this.type == null) {
                            this.type = second;
                        } else {
                            this.description = this.description.replaceAll(" \\["+this.type+"\\] ", "");
                            this.defaultType = second.replaceAll("default: ","").replaceAll(" ","");
                        }
//                        System.out.println("Type?: "+this.type);
                    }
                }
            }
        }
    }

    @Override
    public String toString() {
        return "\nOption: " + option + " Type: " + type + " default: " + defaultType + " Description: "+ description;
    }
}
