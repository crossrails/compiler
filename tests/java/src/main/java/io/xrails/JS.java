package io.xrails;

import com.eclipsesource.v8.*;
import com.eclipsesource.v8.utils.V8Map;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Paths;
import java.util.*;
import java.util.function.Function;
import java.util.stream.Collectors;
import java.util.stream.Stream;

class JS {

    private static class Type {
        final Class<?> aClass;
        final Function<V8Object, Object> fromJS;
        final Function<Object, Object> toJS;

        Type(Class<?> aClass, Function<V8Object, Object> fromJS, Function<Object, Object> toJS) {
            this.aClass = aClass;
            this.fromJS = fromJS;
            this.toJS = toJS;
        }
    }

    private static final V8 engine = V8.createV8Runtime();

    private static final Map<Object, Type> types = new HashMap<>();
    static final Map<Object, Object> heap = new WeakHashMap<>();

    static {
        heap.put(null, null);
        registerType("Number", Number.class, o -> o, o -> o);
        registerType("String", String.class, o -> o, o -> o);
        registerType("Boolean", Boolean.class, o -> o, o -> o);
        registerType("Object", Object.class, JSObject::new, o -> new V8Object(engine));
    }

    static V8Object eval(String filename) {
        try {
            engine.executeScript(new String(Files.readAllBytes(Paths.get(filename))));
            return engine;
        } catch (V8ScriptException | IOException e) {
            throw new IllegalArgumentException(e);
        }
    }

    static void registerType(String name, Class aClass, Function<V8Object, Object> fromJS) {
        registerType(name, aClass, fromJS, o -> (V8Object)JS.heap.get(o));
    }

    static void registerType(String name, Class aClass, Function<V8Object, Object> fromJS, Function<Object, Object> toJS) {
        Type type = new Type(aClass, fromJS, toJS);
        types.put(aClass, type);
        types.put(engine.getObject(name), type);
    }

    static Object fromJS(Object object) {
        return fromJS(object, JSObject.class, JSObject::new);
    }

    static <T> T fromJS(Object object, Class<? super T> aClass, Function<V8Object, T> fromJS) {
        return !(object instanceof V8Object) ? (T)object : (T)heap.computeIfAbsent(object, o -> {
            V8Object prototype = (V8Object)object;
            do {
                prototype = prototype.getObject("prototype");
                if(prototype.isUndefined()) break;
                Type type = types.get(prototype.getObject("constructor"));
                if(type == null) continue;
                if(!aClass.isAssignableFrom(type.aClass)) break;
                Object result = type.fromJS.apply((V8Object) object);
                heap.put(result, object);
                return result;
            } while(true);
            return fromJS.apply((V8Object)object);
        });
    }

    static <T> Object toJS(T object, Class aClass, Function<T, V8Object> toJS) {
        return heap.computeIfAbsent(object, o -> {
            Class c = object.getClass();
            do {
                Type type = types.get(c);
                c = c.getSuperclass();
                if(type == null) continue;
                if(!aClass.isAssignableFrom(type.aClass)) break;
                Object result = type.toJS.apply(object);
                heap.put(result, object);
                return result;
            } while(c != null);
            return toJS.apply(object);
        });
    }

    static void add(V8Object object, String key, Number value) {
        object.add(key, value.doubleValue());
    }

    static void add(V8Object object, String key, Boolean value) {
        object.add(key, value);
    }

    static void add(V8Object object, String key, String value) {
        object.add(key, value);
    }

    static void add(V8Object object, String key, V8Object value) {
        object.add(key, value);
    }

    static void add(V8Object object, String key, Object value) {
        if(value instanceof V8Object) {
            add(object, key, (V8Object)value);
        } else if(value instanceof Number) {
            add(object, key, (Number)value);
        } else if(value instanceof Boolean) {
            add(object, key, (Boolean)value);
        } else if(value instanceof String) {
            add(object, key, (String)value);
        } else {
            throw new IllegalArgumentException(value.toString());
        }
    }

    static V8Array push(V8Array object, Number value) {
        return object.push(value.doubleValue());
    }

    static V8Array push(V8Array object, Boolean value) {
        return object.push(value);
    }

    static V8Array push(V8Array object, String value) {
        return object.push(value);
    }

    static V8Array push(V8Array object, V8Object value) {
        return object.push(value);
    }

    static V8Array push(V8Array object, Object value) {
        if(value instanceof V8Object) {
            push(object, (V8Object)value);
        } else if(value instanceof Number) {
            push(object, (Number)value);
        } else if(value instanceof Boolean) {
            push(object, (Boolean)value);
        } else if(value instanceof String) {
            push(object, (String)value);
        } else {
            throw new IllegalArgumentException(value.toString());
        }
        return object;
    }

    static class Array<E> extends AbstractList<E> {

        private final V8Array array;
        private final Function<java.lang.Object, E> e;

        Array(V8Object array) {
            this.array = (V8Array)array;
            this.e = e -> (E)e;
            JS.heap.put(this, array);
        }

        Array(V8Object array, Function<V8Object, E> e) {
            this.array = (V8Array)array;
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

    }

    private static class JSObject extends AbstractMap<String, java.lang.Object> {

        private final V8Object object;

        JSObject(V8Object object) {
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
            return Arrays.stream(object.getKeys()).map(key -> new AbstractMap.SimpleEntry<String, java.lang.Object>(key, JS.fromJS(object.get(key), JSObject.class, JSObject::new))).collect(Collectors.toSet());
        }

        @Override
        public boolean equals(java.lang.Object obj) {
            return object.equals(JS.heap.get(obj));
        }
    }
}
