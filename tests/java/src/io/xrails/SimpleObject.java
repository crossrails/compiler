package io.xrails;

import java.util.*;
import java.util.function.*;
import jdk.nashorn.api.scripting.*;

import static io.xrails.Src.global;

public class SimpleObject {

    private static final ScriptObjectMirror classMirror = (ScriptObjectMirror)global.get("SimpleObject");

    private final ScriptObjectMirror prototype;
    private final JSObject mirror;

    SimpleObject(ScriptObjectMirror mirror) { 
        this.prototype = mirror; 
        this.mirror = mirror; 
        JS.heap.put(this, mirror);
    }

    public static Boolean getStaticVoidNoArgMethodCalled() {
        return (Boolean)classMirror.get("staticVoidNoArgMethodCalled");
    }

    public static void setStaticVoidNoArgMethodCalled(Boolean staticVoidNoArgMethodCalled) {
        classMirror.setMember("staticVoidNoArgMethodCalled", staticVoidNoArgMethodCalled);
    }

    public Boolean getMethodToOverrideCalled() {
        return (Boolean)prototype.get("methodToOverrideCalled");
    }

    public void setMethodToOverrideCalled(Boolean methodToOverrideCalled) {
        prototype.setMember("methodToOverrideCalled", methodToOverrideCalled);
    }

    public SimpleObject(Number v) {
        prototype = (ScriptObjectMirror)classMirror.newObject(v); 
        mirror = getClass() == SimpleObject.class ? prototype : new JS.AbstractMirror(prototype) { 
            @Override 
            void build(BiConsumer<String, Function<Object[], Object>> builder) { 
                builder.accept("numberSingleObjectArgMethod", args -> numberSingleObjectArgMethod((SimpleObject)args[0]));
                builder.accept("callOverriddenMethod", args -> { callOverriddenMethod(); return null; });
                builder.accept("methodToOverride", args -> { methodToOverride(); return null; });
                builder.accept("upcastThisToObject", args -> upcastThisToObject()); 
            } 
        }; 
        JS.heap.put(this, mirror); 
    }

    public static void staticVoidNoArgMethod() {
        classMirror.callMember("staticVoidNoArgMethod");
    }

    public Number numberSingleObjectArgMethod(SimpleObject a) {
        return (Number)((JSObject)prototype.getMember("numberSingleObjectArgMethod")).call(mirror, JS.heap.get(a));
    }

    public void callOverriddenMethod() {
        ((JSObject)prototype.getMember("callOverriddenMethod")).call(mirror);
    }

    public void methodToOverride() {
        ((JSObject)prototype.getMember("methodToOverride")).call(mirror);
    }

    public Object upcastThisToObject() {
        return JS.wrap(((JSObject)prototype.getMember("upcastThisToObject")).call(mirror), JS.Object::new);
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
        return mirror.equals(JS.heap.getOrDefault(obj, obj));
    }
}