package io.xrails;

import java.io.BufferedReader;
import java.io.InputStreamReader;
import java.nio.charset.Charset;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.ArrayList;
import java.util.Arrays;
import java.util.List;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 *
 *
 */
public class App {
    public static void main( String[] args ) {
        //java -cp target/Wiki-1.0-SNAPSHOT.jar io.xrails.App
        try {
            Runtime rt = Runtime.getRuntime();
            Process pr = rt.exec("node ../src/main --help");
            String output = App.formatConsoleOutput(pr);
            System.out.println(output);

            List<String> lines = Arrays.asList(output);
            Path file = Paths.get("wiki.md");
            Files.write(file, lines, Charset.forName("UTF-8"));
        }  catch(Exception e) {
            System.out.println(e.toString());
            e.printStackTrace();
        }
    }

    static String formatConsoleOutput(Process pr) {
        BufferedReader input = new BufferedReader(new InputStreamReader(pr.getInputStream()));
        List<TableLine> table = new ArrayList<TableLine>();
        String line = null;
        String output = "";
        boolean skipLineFormatting = false;
        boolean finalLine = false;
        try {
            while ((line = input.readLine()) != null) {
                //apply table formatting here.
                if (!skipLineFormatting) {
                    if (line.startsWith("Examples:")) {
                        skipLineFormatting = true;
                        line = "\n### " + line;
                        line += App.createExampleTableHeader();
                    } else {
                        if (line.startsWith("  -")) {
                            TableLine tableLine = new TableLine(line);
                            String description = tableLine.description;
                            if (tableLine.defaultType != null) {
                                description = description+", defaults to "+tableLine.defaultType+"";
                            }
                            line = "| `"+tableLine.option+"` | `"+tableLine.type+"` | "+description+" |";
                            table.add(tableLine);
                        } else if (line.contains("options:")) {
                            line = "\n### " + line + App.createTableHeader();
                        } else {
                            line = "|" + line + "|";
                        }

                    }
                } else {
                    if (!finalLine) {
                        // format the example table
                        if (line.length() > 3) {
                            line = App.formatExampleLine(line);
                        } else {
                            finalLine = true;
                        }
                    }
                }
                output += line + "\n";
            }
        } catch (Exception e) {
            //System.out.println("Exception caught "+e);
        }
        output = App.removeExecutionJunk(output);

        //System.out.print("Tableout: "+table);

        return output;
    }

    static String formatProperties(String second) {
        if (second.contains("[")) {
            second = second.replaceAll("\\[", "");
            second = second.replaceAll("\\]", "");
            second = second.replaceAll("default:", "");
        }
        second = second.replaceAll("choices:", "");
        return second;
    }

    static String removeExecutionJunk(String output) {
        output = output.replace("|Usage: ../src/main [file.js] [options]|\n","");
        output = output.replace("|Usage: ../src/main [file.js|package.json|bower.json] [options]|\n","");
        output = output.replace("||\n","");
        return output;
    }

    static String createTableHeader() {
        //String header = "\n| Option | Description | Type | Default |\n" +
        String header = "\n| Option | Type | Description |\n" +
                "| --- | --- | --- |";
        return header;
    }

    static String createExampleTableHeader() {
        String header = "\n| Option | Description |\n" +
                "| --- | --- |";
        return header;
    }

    static String formatExampleLine(String line) {
        int index = line.indexOf("  ", 1);
        if (index > -1) {
            String first = line.substring(0, index);
            String second = line.substring(index + 1, line.length());
            line = first + " | " + second;
        }
        line = "| " + line + " |";
        return line;
    }
}
