package io.xrails;

import jdk.nashorn.api.scripting.JSObject;
import jdk.nashorn.api.scripting.ScriptObjectMirror;

import java.util.function.BiConsumer;
import java.util.function.Function;

import static io.xrails.Src.global;

/**
 * Created by nbransby on 05/03/2016.
 */
class SimpleObject {

    private static final ScriptObjectMirror classMirror = (ScriptObjectMirror)global.get("SimpleObject");

    private final ScriptObjectMirror mirror;
    private final JSObject proxy;

    public SimpleObject(Number number) {
        mirror = (ScriptObjectMirror)classMirror.newObject(number);
        proxy = getClass() == SimpleObject.class ? mirror : new JS.AbstractMirror(mirror) {
            @Override
            void build(BiConsumer<String, Function<Object[], Object>> builder) {
                builder.accept("methodToOverride", args -> { methodToOverride(); return null; });
            }
        };
        JS.heap.put(this, proxy);
    }

    SimpleObject(ScriptObjectMirror mirror) {
        this.mirror = mirror;
        this.proxy = mirror;
        JS.heap.put(this, proxy);
    }

    public Boolean getMethodToOverrideCalled() {
        return (Boolean)mirror.get("methodToOverrideCalled");
    }

    public Number numberSingleObjectArgMethod(SimpleObject a) {
        return (Number)((JSObject)mirror.getMember("numberSingleObjectArgMethod")).call(proxy, JS.heap.get(a));
    }

    public Object upcastThisToObject() {
        return new JS.Object((ScriptObjectMirror) mirror.callMember("upcastThisToObject"));
    }

    public void callOverriddenMethod() {
        ((JSObject)mirror.getMember("callOverriddenMethod")).call(proxy);
    }

    public void methodToOverride() {
        ((JSObject)mirror.getMember("methodToOverride")).call(proxy);
    }

    public static void staticVoidNoArgMethod() {
        classMirror.callMember("staticVoidNoArgMethod");
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
