package io.xrails;

import java.util.*;
import java.util.function.*;
import jdk.nashorn.api.scripting.*;

import static io.xrails.Src.global;

public class SimpleObject {

    private static final ScriptObjectMirror classMirror = (ScriptObjectMirror)global.get("SimpleObject");

    private final ScriptObjectMirror mirror;
    private final JSObject proxy;

    SimpleObject(ScriptObjectMirror mirror) { 
        this.mirror = mirror; 
        this.proxy = mirror; 
        JS.heap.put(this, proxy);
    }

    public static Boolean getStaticVoidNoArgMethodCalled() {
        return (Boolean)classMirror.get("staticVoidNoArgMethodCalled");
    }

    public static void setStaticVoidNoArgMethodCalled(Boolean staticVoidNoArgMethodCalled) {
        classMirror.setMember("staticVoidNoArgMethodCalled", staticVoidNoArgMethodCalled);
    }

    public Boolean getMethodToOverrideCalled() {
        return (Boolean)mirror.get("methodToOverrideCalled");
    }

    public void setMethodToOverrideCalled(Boolean methodToOverrideCalled) {
        mirror.setMember("methodToOverrideCalled", methodToOverrideCalled);
    }

    public SimpleObject(Number v) {
        mirror = (ScriptObjectMirror)classMirror.newObject(v); 
        proxy = getClass() == SimpleObject.class ? mirror : new JS.AbstractMirror(mirror) { 
            @Override 
            void build(BiConsumer<String, Function<Object[], Object>> builder) { 
                builder.accept("numberSingleObjectArgMethod", args -> numberSingleObjectArgMethod((SimpleObject)args[0]));
                builder.accept("callOverriddenMethod", args -> { callOverriddenMethod(); return null; });
                builder.accept("methodToOverride", args -> { methodToOverride(); return null; });
                builder.accept("upcastThisToObject", args -> upcastThisToObject()); 
            } 
        }; 
        JS.heap.put(this, proxy); 
    }

    public static void staticVoidNoArgMethod() {
        classMirror.callMember("staticVoidNoArgMethod");
    }

    public Number numberSingleObjectArgMethod(SimpleObject a) {
        return (Number)((JSObject)mirror.getMember("numberSingleObjectArgMethod")).call(proxy, JS.heap.get(a));
    }

    public void callOverriddenMethod() {
        ((JSObject)mirror.getMember("callOverriddenMethod")).call(proxy);
    }

    public void methodToOverride() {
        ((JSObject)mirror.getMember("methodToOverride")).call(proxy);
    }

    public Object upcastThisToObject() {
        return JS.wrap(((JSObject)mirror.getMember("upcastThisToObject")).call(proxy), JS.Object::new);
    }

    @Override
    public String toString() {
        return mirror.toString();
    }

    @Override
    public int hashCode() {
        return mirror.hashCode();
    }

    @Override
    public boolean equals(Object obj) {
        return proxy.equals(JS.heap.getOrDefault(obj, obj));
    }
}