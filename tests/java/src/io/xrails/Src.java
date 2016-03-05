package io.xrails;

import java.util.List;
import java.util.Optional;
import java.util.function.Supplier;

import static java.util.Objects.requireNonNull;
import static io.xrails.Proxy.Array;

public class Src {

    static final Proxy global = new Proxy("../src.js");

//objects

    public static SimpleObject getSimpleObjectInstance() {
        return global.get("simpleObjectInstance", SimpleObject::new, SimpleObject.class);
    }

//functions

    public static Boolean getVoidNoArgFunctionCalled() {
        return global.get("voidNoArgFunctionCalled");
    }

    public static void voidNoArgFunction() {
        global.call("voidNoArgFunction");
    }

    public static String stringNoArgFunction() {
        return global.call("stringNoArgFunction");
    }

    public static Number numberMultipleArgFunction(Number a, Number b) {
        return global.call("numberMultipleArgFunction", a, b);
    }

    public static Supplier<String> getStringNoArgLambda() {
        return null;//global.get("stringNoArgLambda", (mirror -> () -> (String)mirror.call(null)));
    }

//types

    // constants

    public static Boolean getBooleanConst() {
        return global.get("booleanConst");
    }

    public static Number getNumberConst() {
        return global.get("numberConst");
    }

    public static String getStringConst() {
        return global.get("stringConst");
    }

    public static List<Number> getNumberArrayConst() {
        return global.get("numberArrayConst", Array::new, List.class, Number.class);
    }

    public static List<List<String>> getStringArrayArrayConst() {
        return global.get("stringArrayArrayConst", o -> new Array<List<String>>(o, Array::new), List.class, List.class, Number.class);
    }

    //nullable constants

    public static Optional<Boolean> getOptionalBooleanConst() {
        return Optional.ofNullable(global.get("optionalBooleanConst"));
    }

    public static Optional<Number> getOptionalNumberConst() {
        return Optional.ofNullable(global.get("optionalNumberConst"));
    }

    public static Optional<String> getOptionalStringConst() {
        return Optional.ofNullable(global.get("optionalStringConst"));
    }

    public static Optional<List<Number>> getOptionalNumberArrayConst() {
        return Optional.ofNullable(global.get("optionalNumberArrayConst", Array::new, List.class, Number.class));
    }

    //variables

    public static Boolean getBooleanVar() {
        return global.get("booleanVar");
    }

    public static void setBooleanVar(Boolean value) {
        global.set("booleanVar", value);
    }

    public static Number getNumberVar() {
        return global.get("numberVar");
    }

    public static void setNumberVar(Number value) {
        requireNonNull(value);
        global.set("numberVar", value);
    }

    public static String getStringVar() {
        return global.get("stringVar");
    }

    public static void setStringVar(String value) {
        requireNonNull(value);
        global.set("stringVar", value);
    }

    ////nullable variables

    public static Optional<Boolean> getOptionalBooleanVar() {
        return Optional.ofNullable(global.get("optionalBooleanVar"));
    }

    public static void setOptionalBooleanVar(Boolean value) {
        global.set("optionalBooleanVar", value);
    }

    public static Optional<Number> getOptionalNumberVar() {
        return Optional.ofNullable(global.get("optionalNumberVar"));
    }

    public static void setOptionalNumberVar(Number value) {
        global.set("optionalNumberVar", value);
    }

    public static Optional<String> getOptionalStringVar() {
        return Optional.ofNullable(global.get("optionalStringVar"));
    }

    public static void setOptionalStringVar(String value) {
        global.set("optionalStringVar", value);
    }
}
