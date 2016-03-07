package io.xrails;

import jdk.nashorn.api.scripting.AbstractJSObject;
import jdk.nashorn.api.scripting.JSObject;
import jdk.nashorn.api.scripting.NashornScriptEngineFactory;
import jdk.nashorn.api.scripting.ScriptObjectMirror;

import javax.script.ScriptEngine;
import javax.script.ScriptException;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.util.*;
import java.util.function.BiConsumer;
import java.util.function.Function;

/**
 * Created by nbransby on 05/03/2016.
 */
class JS {

    public static final Map<java.lang.Object, java.lang.Object> heap = new WeakHashMap<>();

    private static final ScriptEngine engine = new NashornScriptEngineFactory().getScriptEngine();

    static ScriptObjectMirror eval(String filename) {
        try {
            engine.eval(new FileReader(filename));
            return (ScriptObjectMirror)engine.eval("this");
        } catch (ScriptException | FileNotFoundException e) {
            throw new IllegalArgumentException(e);
        }
    }

    static class Array<E> extends AbstractList<E> {

        private final ScriptObjectMirror mirror;
        private final Function<java.lang.Object, E> e;

        Array(ScriptObjectMirror mirror) {
            this.mirror = mirror;
            this.e = e -> (E)e;
        }

        Array(ScriptObjectMirror mirror, Function<ScriptObjectMirror, E> e) {
            this.mirror = mirror;
            this.e = o -> e.apply((ScriptObjectMirror)o);
        }

        @Override
        public E get(int index) {
            return e.apply(mirror.getSlot(index));
        }

        @Override
        public int size() {
            return ((Number)mirror.getMember("length")).intValue();
        }
    }

    static class Object {

        private final ScriptObjectMirror mirror;

        Object(ScriptObjectMirror mirror) {
            this.mirror = mirror;
            JS.heap.put(this, mirror);
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
        public boolean equals(java.lang.Object obj) {
            return mirror.equals(JS.heap.getOrDefault(obj, obj));
        }
    }

    static abstract class AbstractMirror extends AbstractJSObject {

        private final ScriptObjectMirror prototype;
        private final Map<String, JSObject> methods = new HashMap<>();

        AbstractMirror() {
            this(null);
        }

        AbstractMirror(ScriptObjectMirror prototype) {
            this.prototype = prototype;
            build((name, invocation) -> methods.put(name, new AbstractJSObject() {
                @Override
                public java.lang.Object call(java.lang.Object thiz, java.lang.Object... args) {
                    return invocation.apply(args);
                }
            }));

        }

        abstract void build(BiConsumer<String, Function<java.lang.Object[], java.lang.Object>> builder);

        @Override
        public java.lang.Object getMember(String name) {
            java.lang.Object object = methods.get(name);
            return object != null ? object : prototype.getMember(name);
        }

        @Override
        public void setMember(String name, java.lang.Object value) {
            prototype.setMember(name, value);
        }
    }
}
