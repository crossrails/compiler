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
        int index = line.indexOf("  ");
        boolean keepChecking = true;
        while (keepChecking) {
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
                    if (line.contains("[")) {
                        ch = '[';
                        index = line.indexOf('[')-1;
                    }
                }
                if (ch == '[') {
                    String first = line.substring(0, index + 1);
                    this.description = first.replaceAll(this.option, "");
                    String second = line.substring(index + 1, line.length());
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
                        String secondBracket = second.substring(bracketIndex + 2, second.length());
                        secondBracket = secondBracket.replaceAll("\\[","").replaceAll("]","");
                        secondBracket = secondBracket.replaceAll("default: ", "");
                        this.defaultType = secondBracket;
                        index += 2;
                    } else {
                        second = second.replaceAll("\\[","").replaceAll("]","");
                        if (this.type == null) {
                            this.type = second;
                        } else {
                            this.description = this.description.replaceAll(" \\["+this.type+"\\] ", "");
                            this.defaultType = second.replaceAll("default: ","").replaceAll(" ","");
                        }
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
