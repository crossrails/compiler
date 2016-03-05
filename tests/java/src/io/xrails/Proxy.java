package io.xrails;

import jdk.nashorn.api.scripting.NashornScriptEngineFactory;
import jdk.nashorn.api.scripting.ScriptObjectMirror;

import javax.script.ScriptEngine;
import javax.script.ScriptException;
import java.io.FileNotFoundException;
import java.io.FileReader;
import java.util.AbstractList;
import java.util.HashMap;
import java.util.Map;
import java.util.WeakHashMap;
import java.util.function.Function;

/**
 * Created by nbransby on 05/03/2016.
 */
class Proxy {

    private static final ScriptEngine engine = new NashornScriptEngineFactory().getScriptEngine();
    private static final Map<ScriptObjectMirror, Map<Class[], Object>> heap = new WeakHashMap<>();

    final ScriptObjectMirror mirror;

    Proxy(String filename) {
        try {
            engine.eval(new FileReader(filename));
            mirror = (ScriptObjectMirror)engine.eval("this");
        } catch (ScriptException | FileNotFoundException e) {
            throw new IllegalArgumentException(e);
        }
    }

    Proxy(Proxy constructor, Object... args) {
        this.mirror = (ScriptObjectMirror)constructor.mirror.newObject(args);
    }

    Proxy(ScriptObjectMirror mirror) {
        this.mirror = mirror;
    }

    <T> T get(String name) {
        return (T)mirror.get(name);
    }

    <T> T get(String name, Function<ScriptObjectMirror, T> infer, Class... erasure) {
        final ScriptObjectMirror mirror = get(name);
        if(mirror == null) {
            return null;
        }
        Map<Class[], Object> map = heap.computeIfAbsent(mirror, o -> new HashMap<>());
        return (T)map.computeIfAbsent(erasure, e -> infer.apply(mirror));
    }

    void set(String name, Object value) {
        mirror.setMember(name, value);
    }

    <T> T call(String name, Object... args) {
        return (T)mirror.callMember(name, args);
    }

    static class Array<E> extends AbstractList<E> {

        private final ScriptObjectMirror mirror;
        private final Function<Object, E> infer;

        Array(Object mirror) {
            this.mirror = (ScriptObjectMirror)mirror;
            this.infer = o -> (E)o;
        }

        Array(ScriptObjectMirror mirror, Function<Object, E> infer) {
            this.mirror = mirror;
            this.infer = infer;
        }

        @Override
        public E get(int index) {
            return infer.apply(mirror.getSlot(index));
        }

        @Override
        public int size() {
            return mirror.size();
        }
    }
}
