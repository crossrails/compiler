package io.xrails;

import java.util.*;
import java.util.function.*;
import jdk.nashorn.api.scripting.*;

public class Src {

    static final ScriptObjectMirror global = JS.eval("src.js");

    public static Boolean booleanConst() {
        return (Boolean)global.get("booleanConst");
    }
    
    public static Number numberConst() {
        return (Number)global.get("numberConst");
    }
    
    public static String stringConst() {
        return (String)global.get("stringConst");
    }
    
    public static List<Optional<Number>> numberOrNullArrayConst() {
        return JS.wrap(global.get("numberOrNullArrayConst"), JS.Array::new);
    }
    
    public static List<Number> numberArrayConst() {
        return JS.wrap(global.get("numberArrayConst"), JS.Array::new);
    }
    
    public static List<List<String>> stringArrayArrayConst() {
        return JS.wrap(global.get("stringArrayArrayConst"), o -> new JS.Array<>(o, JS.Array::new));
    }
    
    public static Object anyConst() {
        return JS.wrap(global.get("anyConst"), JS.Object::new);
    }
    
    public static Optional<Boolean> optionalBooleanConst() {
        return Optional.ofNullable((Boolean)global.get("optionalBooleanConst"));
    }
    
    public static Optional<Number> optionalNumberConst() {
        return Optional.ofNullable((Number)global.get("optionalNumberConst"));
    }
    
    public static Optional<String> optionalStringConst() {
        return Optional.ofNullable((String)global.get("optionalStringConst"));
    }
    
    public static Optional<List<Number>> optionalNumberArrayConst() {
        return Optional.ofNullable(JS.wrap(global.get("optionalNumberArrayConst"), JS.Array::new));
    }
    
    public static Optional<Object> optionalNullAnyConst() {
        return Optional.ofNullable(JS.wrap(global.get("optionalNullAnyConst"), JS.Object::new));
    }
    
    public static Optional<Object> optionalNonNullAnyConst() {
        return Optional.ofNullable(JS.wrap(global.get("optionalNonNullAnyConst"), JS.Object::new));
    }
    
    public static Boolean booleanVar() {
        return (Boolean)global.get("booleanVar");
    }
    
    public static void booleanVar(Boolean newValue) {
        global.setMember("booleanVar", newValue);
    }
    
    public static Number numberVar() {
        return (Number)global.get("numberVar");
    }
    
    public static void numberVar(Number newValue) {
        global.setMember("numberVar", newValue);
    }
    
    public static String stringVar() {
        return (String)global.get("stringVar");
    }
    
    public static void stringVar(String newValue) {
        global.setMember("stringVar", newValue);
    }
    
    public static List<Number> numberArrayVar() {
        return JS.wrap(global.get("numberArrayVar"), JS.Array::new);
    }
    
    public static void numberArrayVar(List<Number> newValue) {
        global.setMember("numberArrayVar", JS.heap.computeIfAbsent(newValue, o -> new JS.ArrayMirror<>(newValue)));
    }
    
    public static Object anyVar() {
        return JS.wrap(global.get("anyVar"), JS.Object::new);
    }
    
    public static void anyVar(Object newValue) {
        global.setMember("anyVar", newValue);
    }
    
    public static List<List<String>> stringArrayArrayVar() {
        return JS.wrap(global.get("stringArrayArrayVar"), o -> new JS.Array<>(o, JS.Array::new));
    }
    
    public static void stringArrayArrayVar(List<List<String>> newValue) {
        global.setMember("stringArrayArrayVar", JS.heap.computeIfAbsent(newValue, o -> new JS.ArrayMirror<>(newValue, JS.ArrayMirror::new)));
    }
    
    public static Optional<Boolean> optionalBooleanVar() {
        return Optional.ofNullable((Boolean)global.get("optionalBooleanVar"));
    }
    
    public static void optionalBooleanVar(Boolean newValue) {
        global.setMember("optionalBooleanVar", newValue);
    }
    
    public static Optional<Number> optionalNumberVar() {
        return Optional.ofNullable((Number)global.get("optionalNumberVar"));
    }
    
    public static void optionalNumberVar(Number newValue) {
        global.setMember("optionalNumberVar", newValue);
    }
    
    public static Optional<String> optionalStringVar() {
        return Optional.ofNullable((String)global.get("optionalStringVar"));
    }
    
    public static void optionalStringVar(String newValue) {
        global.setMember("optionalStringVar", newValue);
    }
    
    public static Optional<List<Number>> optionalNumberArrayVar() {
        return Optional.ofNullable(JS.wrap(global.get("optionalNumberArrayVar"), JS.Array::new));
    }
    
    public static void optionalNumberArrayVar(List<Number> newValue) {
        global.setMember("optionalNumberArrayVar", JS.heap.computeIfAbsent(newValue, o -> new JS.ArrayMirror<>(newValue)));
    }
    
    public static Optional<Object> optionalAnyVar() {
        return Optional.ofNullable(JS.wrap(global.get("optionalAnyVar"), JS.Object::new));
    }
    
    public static void optionalAnyVar(Object newValue) {
        global.setMember("optionalAnyVar", newValue);
    }
    
    public static Boolean voidNoArgFunctionCalled() {
        return (Boolean)global.get("voidNoArgFunctionCalled");
    }
    
    public static void voidNoArgFunctionCalled(Boolean newValue) {
        global.setMember("voidNoArgFunctionCalled", newValue);
    }
    
    public static void voidNoArgFunction() {
        global.callMember("voidNoArgFunction");
    }

    public static String stringNoArgFunction() {
        return (String)global.callMember("stringNoArgFunction");
    }

    public static Number numberMultipleArgFunction(Number a, Number b) {
        return (Number)global.callMember("numberMultipleArgFunction", a, b);
    }

    public static Supplier<String> stringNoArgLambda() {
        return JS.wrap(global.get("stringNoArgLambda"), Supplier.class);
    }
    
    public static void stringNoArgLambda(Supplier<String> newValue) {
        global.setMember("stringNoArgLambda", newValue);
    }
    
    public static void throwSimpleError() throws Exception {
        global.callMember("throwSimpleError");
    }

    public static void throwSpecialError() throws SpecialException {

        try {
            global.callMember("throwSpecialError");
        } catch (NashornException e) {
            ScriptObjectMirror mirror = (ScriptObjectMirror)e.getEcmaError();
            Object constructor = mirror.get("constructor");
            if(constructor instanceof ScriptObjectMirror) {
                Object name = ((ScriptObjectMirror)constructor).get("name");
                if(name instanceof String) switch ((String)name) {
                    case "SpecialError":
                        throw new SpecialException((ScriptObjectMirror)e.getEcmaError());
                }
            }
            throw e;
        }
    }

    public static SimpleObject simpleObjectInstance() {
        return JS.wrap(global.get("simpleObjectInstance"), SimpleObject::new);
    }
    
    public static Object anyObjectInstance() {
        return JS.wrap(global.get("anyObjectInstance"), JS.Object::new);
    }
    
    public static Optional<Object> optionalAnyObjectInstance() {
        return Optional.ofNullable(JS.wrap(global.get("optionalAnyObjectInstance"), JS.Object::new));
    }
    
    public static void optionalAnyObjectInstance(Object newValue) {
        global.setMember("optionalAnyObjectInstance", newValue);
    }
    
    public static Boolean simpleInterfaceInstanceCalled() {
        return (Boolean)global.get("simpleInterfaceInstanceCalled");
    }
    
    public static void simpleInterfaceInstanceCalled(Boolean newValue) {
        global.setMember("simpleInterfaceInstanceCalled", newValue);
    }
    
    public static SimpleInterface simpleInterfaceInstance() {
        return JS.wrap(global.get("simpleInterfaceInstance"), SimpleInterface.class);
    }
    
    public static void simpleInterfaceInstance(SimpleInterface newValue) {
        global.setMember("simpleInterfaceInstance", newValue);
    }
    
    public static void acceptSimpleInterface(SimpleInterface simpleInterface) {
        global.callMember("acceptSimpleInterface", simpleInterface);
    }

}