package io.xrails;

import jdk.nashorn.api.scripting.NashornException;
import jdk.nashorn.api.scripting.ScriptObjectMirror;

import java.util.List;
import java.util.Optional;
import java.util.function.Supplier;

import static java.util.Objects.isNull;
import static java.util.Objects.requireNonNull;

import static io.xrails.Types.global;

public class Src {

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
}
