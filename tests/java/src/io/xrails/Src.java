package io.xrails;

import java.util.*;
import java.util.function.*;
import jdk.nashorn.api.scripting.*;

public class Src {

    static final ScriptObjectMirror global = JS.eval("../reference/src.js");

    public static Boolean getBooleanConst() {
        return (Boolean)global.get("booleanConst");
    }
    
    public static Number getNumberConst() {
        return (Number)global.get("numberConst");
    }
    
    public static String getStringConst() {
        return (String)global.get("stringConst");
    }
    
    public static List<Optional<Number>> getNumberOrNullArrayConst() {
        return JS.wrap(global.get("numberOrNullArrayConst"), JS.Array::new);
    }
    
    public static List<Number> getNumberArrayConst() {
        return JS.wrap(global.get("numberArrayConst"), JS.Array::new);
    }
    
    public static List<List<String>> getStringArrayArrayConst() {
        return JS.wrap(global.get("stringArrayArrayConst"), o -> new JS.Array<>(o, JS.Array::new));
    }
    
    public static Object getAnyConst() {
        return JS.wrap(global.get("anyConst"), JS.Object::new);
    }
    
    public static Optional<Boolean> getOptionalBooleanConst() {
        return Optional.ofNullable((Boolean)global.get("optionalBooleanConst"));
    }
    
    public static Optional<Number> getOptionalNumberConst() {
        return Optional.ofNullable((Number)global.get("optionalNumberConst"));
    }
    
    public static Optional<String> getOptionalStringConst() {
        return Optional.ofNullable((String)global.get("optionalStringConst"));
    }
    
    public static Optional<List<Number>> getOptionalNumberArrayConst() {
        return Optional.ofNullable(JS.wrap(global.get("optionalNumberArrayConst"), JS.Array::new));
    }
    
    public static Optional<Object> getOptionalNullAnyConst() {
        return Optional.ofNullable(JS.wrap(global.get("optionalNullAnyConst"), JS.Object::new));
    }
    
    public static Optional<Object> getOptionalNonNullAnyConst() {
        return Optional.ofNullable(JS.wrap(global.get("optionalNonNullAnyConst"), JS.Object::new));
    }
    
    public static Boolean getBooleanVar() {
        return (Boolean)global.get("booleanVar");
    }
    
    public static void setBooleanVar(Boolean booleanVar) {
        global.setMember("booleanVar", booleanVar);
    }
    
    public static Number getNumberVar() {
        return (Number)global.get("numberVar");
    }
    
    public static void setNumberVar(Number numberVar) {
        global.setMember("numberVar", numberVar);
    }
    
    public static String getStringVar() {
        return (String)global.get("stringVar");
    }
    
    public static void setStringVar(String stringVar) {
        global.setMember("stringVar", stringVar);
    }
    
    public static List<Number> getNumberArrayVar() {
        return JS.wrap(global.get("numberArrayVar"), JS.Array::new);
    }
    
    public static void setNumberArrayVar(List<Number> numberArrayVar) {
        global.setMember("numberArrayVar", JS.heap.computeIfAbsent(numberArrayVar, o -> new JS.ArrayMirror<>(numberArrayVar)));
    }
    
    public static Object getAnyVar() {
        return JS.wrap(global.get("anyVar"), JS.Object::new);
    }
    
    public static void setAnyVar(Object anyVar) {
        global.setMember("anyVar", anyVar);
    }
    
    public static List<List<String>> getStringArrayArrayVar() {
        return JS.wrap(global.get("stringArrayArrayVar"), o -> new JS.Array<>(o, JS.Array::new));
    }
    
    public static void setStringArrayArrayVar(List<List<String>> stringArrayArrayVar) {
        global.setMember("stringArrayArrayVar", JS.heap.computeIfAbsent(stringArrayArrayVar, o -> new JS.ArrayMirror<>(stringArrayArrayVar, JS.ArrayMirror::new)));
    }
    
    public static Optional<Boolean> getOptionalBooleanVar() {
        return Optional.ofNullable((Boolean)global.get("optionalBooleanVar"));
    }
    
    public static void setOptionalBooleanVar(Boolean optionalBooleanVar) {
        global.setMember("optionalBooleanVar", optionalBooleanVar);
    }
    
    public static Optional<Number> getOptionalNumberVar() {
        return Optional.ofNullable((Number)global.get("optionalNumberVar"));
    }
    
    public static void setOptionalNumberVar(Number optionalNumberVar) {
        global.setMember("optionalNumberVar", optionalNumberVar);
    }
    
    public static Optional<String> getOptionalStringVar() {
        return Optional.ofNullable((String)global.get("optionalStringVar"));
    }
    
    public static void setOptionalStringVar(String optionalStringVar) {
        global.setMember("optionalStringVar", optionalStringVar);
    }
    
    public static Optional<List<Number>> getOptionalNumberArrayVar() {
        return Optional.ofNullable(JS.wrap(global.get("optionalNumberArrayVar"), JS.Array::new));
    }
    
    public static void setOptionalNumberArrayVar(List<Number> optionalNumberArrayVar) {
        global.setMember("optionalNumberArrayVar", JS.heap.computeIfAbsent(optionalNumberArrayVar, o -> new JS.ArrayMirror<>(optionalNumberArrayVar)));
    }
    
    public static Optional<Object> getOptionalAnyVar() {
        return Optional.ofNullable(JS.wrap(global.get("optionalAnyVar"), JS.Object::new));
    }
    
    public static void setOptionalAnyVar(Object optionalAnyVar) {
        global.setMember("optionalAnyVar", optionalAnyVar);
    }
    
    public static Boolean getVoidNoArgFunctionCalled() {
        return (Boolean)global.get("voidNoArgFunctionCalled");
    }
    
    public static void setVoidNoArgFunctionCalled(Boolean voidNoArgFunctionCalled) {
        global.setMember("voidNoArgFunctionCalled", voidNoArgFunctionCalled);
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

    public static Supplier<String> getStringNoArgLambda() {
        return JS.wrap(global.get("stringNoArgLambda"), Supplier.class);
    }
    
    public static void setStringNoArgLambda(Supplier<String> stringNoArgLambda) {
        global.setMember("stringNoArgLambda", stringNoArgLambda);
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
            if(constructor instanceof  ScriptObjectMirror) {
                Object name = ((ScriptObjectMirror)constructor).get("name");
                if(name instanceof String) switch ((String)name) {
                    case "SpecialError":
                        throw new SpecialException((ScriptObjectMirror)e.getEcmaError());
                }
            }
            throw e;
        }
    }

    public static SimpleObject getSimpleObjectInstance() {
        return JS.wrap(global.get("simpleObjectInstance"), SimpleObject::new);
    }
    
    public static Object getAnyObjectInstance() {
        return JS.wrap(global.get("anyObjectInstance"), JS.Object::new);
    }
    
    public static Optional<Object> getOptionalAnyObjectInstance() {
        return Optional.ofNullable(JS.wrap(global.get("optionalAnyObjectInstance"), JS.Object::new));
    }
    
    public static void setOptionalAnyObjectInstance(Object optionalAnyObjectInstance) {
        global.setMember("optionalAnyObjectInstance", optionalAnyObjectInstance);
    }
    
    public static Boolean getSimpleInterfaceInstanceCalled() {
        return (Boolean)global.get("simpleInterfaceInstanceCalled");
    }
    
    public static void setSimpleInterfaceInstanceCalled(Boolean simpleInterfaceInstanceCalled) {
        global.setMember("simpleInterfaceInstanceCalled", simpleInterfaceInstanceCalled);
    }
    
    public static SimpleInterface getSimpleInterfaceInstance() {
        return JS.wrap(global.get("simpleInterfaceInstance"), SimpleInterface.class);
    }
    
    public static void setSimpleInterfaceInstance(SimpleInterface simpleInterfaceInstance) {
        global.setMember("simpleInterfaceInstance", simpleInterfaceInstance);
    }
    
    public static void acceptSimpleInterface(SimpleInterface simpleInterface) {
        global.callMember("acceptSimpleInterface", simpleInterface);
    }

}