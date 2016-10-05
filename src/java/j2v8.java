import com.eclipsesource.v8.*;

import java.io.FileNotFoundException;
import java.io.FileReader;
import java.util.*;
import java.util.function.BiConsumer;
import java.util.function.Function;
import java.util.stream.Collectors;

class JS {

    private static final V8 engine = V8.createV8Runtime();
    private static final V8Function wrapper;

    static final Map<java.lang.Object, java.lang.Object> heap = new WeakHashMap<>();

    static {
        try {
            heap.put(null, null);
            wrapper = (V8Function)engine.executeObjectScript(
                    "function(name, obj) { var Type = Java.type(name); return new Type(obj); }");
        } catch (V8ScriptException e) {
            throw new IllegalStateException(e);
        }
    }

    static V8Object eval(String filename) {
        try {
            engine.executeScript(new FileReader(filename).toString());
            return engine.getObject("this");
        } catch (V8ScriptException | FileNotFoundException e) {
            throw new IllegalArgumentException(e);
        }
    }

    static <T> T wrap(java.lang.Object object, Class type) {
        return wrap(object, mirror -> {
            V8Array parameters = new V8Array(engine);
            parameters.push(type.getName());
            parameters.push(mirror);
            return (T)wrapper.call(null, parameters);
        });
    }

    static <T> T wrap(java.lang.Object object, Function<V8Object, T> constructor) {
        if(object instanceof V8Object) {
            object = constructor.apply((V8Object)object);
        }
        return (T)object;
    }


    static class Array<E> extends AbstractList<E> {

        private final V8Array array;
        private final Function<java.lang.Object, E> e;

        Array(V8Array array) {
            this.array = array;
            this.e = e -> (E)e;
            JS.heap.put(this, array);
        }

        Array(V8Array array, Function<V8Object, E> e) {
            this.array = array;
            this.e = o -> e.apply((V8Object)o);
            JS.heap.put(this, array);
        }

        @Override
        public E get(int index) {
            return e.apply(array.get(index));
        }

        @Override
        public int size() {
            return array.length();
        }

        @Override
        public String toString() {
            return array.toString();
        }

        @Override
        public int hashCode() {
            return array.hashCode();
        }

        @Override
        public boolean equals(java.lang.Object obj) {
            return array.equals(JS.heap.getOrDefault(obj, obj));
        }
    }

    static class Object extends AbstractMap<String, java.lang.Object> {

        private final V8Object object;

        Object(V8Object object) {
            this.object = object;
            JS.heap.put(this, object);
        }

        @Override
        public String toString() {
            return object.toString();
        }

        @Override
        public int hashCode() {
            return object.hashCode();
        }

        @Override
        public Set<Entry<String, java.lang.Object>> entrySet() {
            return Arrays.stream(object.getKeys()).map(key -> new AbstractMap.SimpleEntry<String, java.lang.Object>(key, JS.wrap(object.get(key), JS.Object::new))).collect(Collectors.toSet());
        }

        @Override
        public boolean equals(java.lang.Object obj) {
            return object.equals(JS.heap.getOrDefault(obj, obj));
        }
    }

    static abstract class AbstractMirror extends V8Object {

        private final V8Object prototype;

        AbstractMirror() {
            this(null);
        }

        AbstractMirror(V8Object prototype) {
            this.prototype = prototype;
            build((name, invocation) -> this.registerJavaMethod(invocation, name));
        }

        abstract void build(BiConsumer<String, JavaCallback> builder);

    }
}
