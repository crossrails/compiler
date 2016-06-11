package io.xrails;

import java.util.*;
import jdk.nashorn.api.scripting.*;

class Types {

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

    public static List<Object> getNumberOrNullArrayConst() {
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

    public static void setBooleanVar(Boolean value) {
        global.setMember("booleanVar", value);
    }

    public static Number getNumberVar() {
        return (Number)global.get("numberVar");
    }

    public static void setNumberVar(Number value) {
        global.setMember("numberVar", value);
    }

    public static String getStringVar() {
        return (String)global.get("stringVar");
    }

    public static void setStringVar(String value) {
        global.setMember("stringVar", value);
    }

    public static List<Number> getNumberArrayVar() {
        return JS.wrap(global.get("numberArrayVar"), JS.Array::new);
    }

    public static void setNumberArrayVar(List<Number> value) {
        global.setMember("numberArrayVar", JS.heap.computeIfAbsent(value, o -> new JS.ArrayMirror<>(value)));
    }

    public static Object getAnyVar() {
        return JS.wrap(global.get("anyVar"), JS.Object::new);
    }

    public static void setAnyVar(Object value) {
        global.setMember("anyVar", value);
    }

    public static List<List<String>> getStringArrayArrayVar() {
        return JS.wrap(global.get("stringArrayArrayVar"), o -> new JS.Array<>(o, JS.Array::new));
    }

    public static void setStringArrayArrayVar(List<List<String>> value) {
        global.setMember("stringArrayArrayVar", JS.heap.computeIfAbsent(value, o -> new JS.ArrayMirror<>(value, JS.ArrayMirror::new)));
    }

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

    public static Optional<List<Number>> getOptionalNumberArrayVar() {
        return Optional.ofNullable(JS.wrap(global.get("optionalNumberArrayVar"), JS.Array::new));
    }

    public static void setOptionalNumberArrayVar(List<Number> value) {
        global.setMember("optionalNumberArrayVar", JS.heap.computeIfAbsent(value, o -> new JS.ArrayMirror<>(value)));
    }

    public static Optional<Object> getOptionalAnyVar() {
        return Optional.ofNullable(JS.wrap(global.get("optionalAnyVar"), JS.Object::new));
    }

    public static void setOptionalAnyVar(Object value) {
        global.setMember("optionalAnyVar", value);
    }


}