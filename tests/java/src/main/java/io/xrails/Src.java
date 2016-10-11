package io.xrails;

import com.eclipsesource.v8.V8Function;
import com.eclipsesource.v8.V8Object;
import com.eclipsesource.v8.utils.V8ObjectUtils;

import java.util.*;
import java.util.function.*;
import java.util.stream.Collectors;
import java.util.stream.Stream;


public class Src {

    static final V8Object global = JS.eval("src.js");

    static {
        JS.registerType("SimpleObject", SimpleObject.class, SimpleObject::new);
    }

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
        return JS.fromJS(global.get("numberOrNullArrayConst"), JS.Array.class, JS.Array::new);
    }
    
    public static List<Number> numberArrayConst() {
        return JS.fromJS(global.get("numberArrayConst"), JS.Array.class, JS.Array::new);
    }
    
    public static List<List<String>> stringArrayArrayConst() {
        return JS.fromJS(global.get("stringArrayArrayConst"), JS.Array.class, o -> new JS.Array<>(o, JS.Array::new));
    }
    
    public static Object anyConst() {
        return JS.fromJS(global.get("anyConst"));
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
        return Optional.ofNullable(JS.fromJS(global.get("optionalNumberArrayConst"), JS.Array.class, JS.Array::new));
    }
    
    public static Optional<Object> optionalNullAnyConst() {
        return Optional.ofNullable(JS.fromJS(global.get("optionalNullAnyConst")));
    }
    
    public static Optional<Object> optionalNonNullAnyConst() {
        return Optional.ofNullable(JS.fromJS(global.get("optionalNonNullAnyConst")));
    }
    
    public static Boolean booleanVar() {
        return (Boolean)global.get("booleanVar");
    }
    
    public static void booleanVar(Boolean newValue) {
        JS.add(global, "booleanVar", newValue);
    }
    
    public static Number numberVar() {
        return (Number)global.get("numberVar");
    }
    
    public static void numberVar(Number newValue) {
        JS.add(global, "numberVar", newValue);
    }
    
    public static String stringVar() {
        return (String)global.get("stringVar");
    }
    
    public static void stringVar(String newValue) {
        JS.add(global, "stringVar", newValue);
    }
    
    public static List<Number> numberArrayVar() {
        return JS.fromJS(global.get("numberArrayVar"), JS.Array.class, JS.Array::new);
    }
    
    public static void numberArrayVar(List<Number> newValue) {
        JS.add(global, "numberArrayVar", JS.toJS(newValue, List.class, o -> V8ObjectUtils.toV8Array(global.getRuntime(), o)));
    }
    
    public static Object anyVar() {
        return JS.fromJS(global.get("anyVar"));
    }
    
    public static void anyVar(Object newValue) {
        JS.add(global, "anyVar", JS.toJS(newValue, Object.class, o -> new V8Object(global.getRuntime())));
    }
    
    public static List<List<String>> stringArrayArrayVar() {
        return JS.fromJS(global.get("stringArrayArrayVar"), JS.Array.class, o -> new JS.Array<>(o, JS.Array::new));
    }
    
    public static void stringArrayArrayVar(List<List<String>> newValue) {
        JS.add(global, "stringArrayArrayVar", JS.toJS(newValue, List.class, o -> V8ObjectUtils.toV8Array(global.getRuntime(), Stream.of(o).map(t -> V8ObjectUtils.toV8Array(global.getRuntime(), t)).collect(Collectors.toList()))));
    }
    
    public static Optional<Boolean> optionalBooleanVar() {
        return Optional.ofNullable(global.getBoolean("optionalBooleanVar"));
    }
    
    public static void optionalBooleanVar(Boolean newValue) {
        global.add("optionalBooleanVar", newValue);
    }
    
    public static Optional<Number> optionalNumberVar() {
        return Optional.ofNullable((Number)global.get("optionalNumberVar"));
    }
    
    public static void optionalNumberVar(Number newValue) {
        global.add("optionalNumberVar", newValue.doubleValue());
    }
    
    public static Optional<String> optionalStringVar() {
        return Optional.ofNullable((String)global.get("optionalStringVar"));
    }
    
    public static void optionalStringVar(String newValue) {
        global.add("optionalStringVar", newValue);
    }
    
    public static Optional<List<Number>> optionalNumberArrayVar() {
        return Optional.ofNullable(JS.fromJS(global.get("optionalNumberArrayVar"), JS.Array.class, JS.Array::new));
    }
    
    public static void optionalNumberArrayVar(List<Number> newValue) {
        JS.add(global, "optionalNumberArrayVar", JS.toJS(newValue, List.class, o -> V8ObjectUtils.toV8Array(global.getRuntime(), o)));
    }
    
    public static Optional<Object> optionalAnyVar() {
        return Optional.ofNullable(JS.fromJS(global.get("optionalAnyVar")));
    }
    
    public static void optionalAnyVar(Object newValue) {
        JS.add(global, "optionalAnyVar", JS.toJS(newValue, Object.class, o -> new V8Object(global.getRuntime())));
    }
    
    public static Boolean voidNoArgFunctionCalled() {
        return (Boolean)global.get("voidNoArgFunctionCalled");
    }
    
    public static void voidNoArgFunctionCalled(Boolean newValue) {
        global.add("voidNoArgFunctionCalled", newValue);
    }
    
    public static void voidNoArgFunction() {
        global.executeJSFunction("voidNoArgFunction");
    }

    public static String stringNoArgFunction() {
        return (String)global.executeJSFunction("stringNoArgFunction");
    }

    public static Number numberMultipleArgFunction(Number a, Number b) {
        return (Number)global.executeJSFunction("numberMultipleArgFunction", a, b);
    }

    public static Supplier<String> stringNoArgLambda() {
        return () -> (String)global.executeJSFunction("stringNoArgLambda");
    }
    
    public static void stringNoArgLambda(Supplier<String> newValue) {
        JS.add(global, "stringNoArgLambda", JS.heap.computeIfAbsent(newValue, o -> new V8Function(global.getRuntime(), (receiver, parameters) -> newValue.get())));
    }
    
    public static void throwSimpleError() throws Exception {
        global.executeJSFunction("throwSimpleError");
    }

    public static void throwSpecialError() throws SpecialException {
        global.executeJSFunction("throwSpecialError");
    }

    public static SimpleObject simpleObjectInstance() {
        return JS.fromJS(global.get("simpleObjectInstance"), SimpleObject.class, SimpleObject::new);
    }
    
    public static Object anyObjectInstance() {
        return JS.fromJS(global.get("anyObjectInstance"));
    }
    
    public static Optional<Object> optionalAnyObjectInstance() {
        return Optional.ofNullable(JS.fromJS(global.get("optionalAnyObjectInstance")));
    }
    
    public static void optionalAnyObjectInstance(Object newValue) {
        JS.add(global, "optionalAnyObjectInstance", JS.fromJS(newValue));
    }
    
    public static Boolean simpleInterfaceInstanceCalled() {
        return (Boolean)global.get("simpleInterfaceInstanceCalled");
    }
    
    public static void simpleInterfaceInstanceCalled(Boolean newValue) {
        global.add("simpleInterfaceInstanceCalled", newValue);
    }
    
    public static SimpleInterface simpleInterfaceInstance() {
        return new SimpleInterface() {
            @Override
            public void voidNoArgMethod() {
                global.getObject("simpleInterfaceInstance").executeJSFunction("voidNoArgMethod");
            }
        };
    }
    
    public static void simpleInterfaceInstance(SimpleInterface newValue) {
        global.add("simpleInterfaceInstance", (V8Object)JS.heap.get(newValue));
    }
    
    public static void acceptSimpleInterface(SimpleInterface simpleInterface) {
        global.executeJSFunction("acceptSimpleInterface", simpleInterface);
    }

}