package io.xrails;

import jdk.nashorn.api.scripting.*;
import jdk.nashorn.internal.runtime.ECMAException;
import jdk.nashorn.internal.runtime.ScriptObject;

import java.util.List;
import java.util.Optional;
import java.util.function.Supplier;

import static java.util.Objects.isNull;
import static java.util.Objects.requireNonNull;

public class Src {

    static final ScriptObjectMirror global = JS.eval("../src.js");

//objects

    public static SimpleObject getSimpleObjectInstance() {
        return JS.wrap(global.get("simpleObjectInstance"), SimpleObject::new);
    }

    public static Object getAnyObjectInstance() {
        return JS.wrap(global.get("anyObjectInstance"), JS.Object::new);
    }

    public static Boolean getSimpleInterfaceInstanceCalled() {
        return (Boolean)global.get("simpleInterfaceInstanceCalled");
    }

    public static SimpleInterface getSimpleInterfaceInstance() {
        return JS.wrap(global.get("simpleInterfaceInstance"), SimpleInterface.class);
    }

    public static void acceptSimpleInterface(SimpleInterface simpleInterface) {
        global.callMember("acceptSimpleInterface", simpleInterface);
    }

//functions

    public static Boolean getVoidNoArgFunctionCalled() {
        return (Boolean)global.get("voidNoArgFunctionCalled");
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

    public static void setStringNoArgLambda(Supplier<String> cb) {
        global.setMember("stringNoArgLambda", cb);
    }

    public static void throwSimpleError() throws Exception {
        global.callMember("throwSimpleError");
    }

    public static void throwSpecialError() throws SpecialException {
        try {
            global.callMember("throwSpecialError");
        } catch (NashornException e) {
            throw new SpecialException((ScriptObjectMirror)e.getEcmaError());
        }
    }

//types

    // constants

    public static Boolean getBooleanConst() {
        return (Boolean)global.get("booleanConst");
    }

    public static Number getNumberConst() {
        return (Number)global.get("numberConst");
    }

    public static String getStringConst() {
        return (String)global.get("stringConst");
    }

    public static List<Number> getNumberArrayConst() {
        ScriptObjectMirror value = (ScriptObjectMirror)global.get("numberArrayConst");
        return new JS.Array<>(value);
    }

    public static List<List<String>> getStringArrayArrayConst() {
        ScriptObjectMirror value = (ScriptObjectMirror)global.get("stringArrayArrayConst");
        return new JS.Array<>(value, JS.Array::new);
    }

    public static Object getAnyConst() {
        Object value = global.get("anyConst");
        return value instanceof ScriptObjectMirror ? new JS.Object((ScriptObjectMirror)value) : value;
    }

    //nullable constants

    public static Optional<Boolean> getOptionalBooleanConst() {
        return Optional.ofNullable((Boolean)global.get("optionalBooleanConst"));
    }

    public static Optional<Number> getOptionalNumberConst() {
        return Optional.ofNullable((Number)global.get("optionalNumberConst"));
    }

    public static Optional<String> getOptionalStringConst() {
        String value = (String)global.get("optionalStringConst");
        return Optional.ofNullable(value);
    }

    public static Optional<List<Number>> getOptionalNumberArrayConst() {
        ScriptObjectMirror value = (ScriptObjectMirror)global.get("optionalNumberArrayConst");
        return isNull(value) ? Optional.empty() : Optional.of(new JS.Array<>(value));
    }

    public static Optional<Object> getOptionalAnyConst() {
        ScriptObjectMirror value = (ScriptObjectMirror)global.get("optionalAnyConst");
        return isNull(value) ? Optional.empty() : Optional.of(new JS.Object(value));
    }

    //variables

    public static Boolean getBooleanVar() {
        return (Boolean)global.get("booleanVar");
    }

    public static void setBooleanVar(Boolean value) {
        global.setMember("booleanVar", value);
    }

    public static Number getNumberVar() {
        return (Number)global.get("numberVar");
    }

    public static void setNumberVar(Number value) {
        requireNonNull(value);
        global.setMember("numberVar", value);
    }

    public static String getStringVar() {
        return (String)global.get("stringVar");
    }

    public static void setStringVar(String value) {
        requireNonNull(value);
        global.setMember("stringVar", value);
    }

    public static void setAnyVar(Object value) {
        global.setMember("anyVar", value);
    }

    public static Object getAnyVar() {
        return JS.wrap(global.get("anyVar"), JS.Object::new);
    }

    public static List<Number> getNumberArrayVar() {
        return JS.wrap(global.get("numberArrayVar"), JS.Array::new);
    }

    public static void setNumberArrayVar(List<Number> value) {
        global.setMember("numberArrayVar", JS.heap.computeIfAbsent(value, o -> new JS.ArrayMirror<>(value)));
    }

    public static List<List<String>> getStringArrayArrayVar() {
        return JS.wrap(global.get("stringArrayArrayVar"), o -> new JS.Array<>(o, JS.Array::new));
    }

    public static void setStringArrayArrayVar(List<List<String>> value) {
        global.setMember("stringArrayArrayVar", JS.heap.computeIfAbsent(value, o -> new JS.ArrayMirror<>(value, JS.ArrayMirror::new)));
    }

    ////nullable variables

    public static Optional<Boolean> getOptionalBooleanVar() {
        return Optional.ofNullable((Boolean)global.get("optionalBooleanVar"));
    }

    public static void setOptionalBooleanVar(Boolean value) {
        global.setMember("optionalBooleanVar", value);
    }

    public static Optional<Number> getOptionalNumberVar() {
        return Optional.ofNullable((Number)global.get("optionalNumberVar"));
    }

    public static void setOptionalNumberVar(Number value) {
        global.setMember("optionalNumberVar", value);
    }

    public static Optional<String> getOptionalStringVar() {
        return Optional.ofNullable((String)global.get("optionalStringVar"));
    }

    public static void setOptionalStringVar(String value) {
        global.setMember("optionalStringVar", value);
    }

    public static Optional<Object> getOptionalAnyVar() {
        return Optional.ofNullable(JS.wrap(global.get("optionalAnyVar"), JS.Object::new));
    }

    public static void setOptionalAnyVar(Object value) {
        global.setMember("optionalAnyVar", value);
    }
}
