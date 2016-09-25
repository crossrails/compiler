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
import java.util.stream.Collectors;

class JS {

    private static final ScriptEngine engine = new NashornScriptEngineFactory().getScriptEngine();
    private static final ScriptObjectMirror wrapper;

    static final Map<java.lang.Object, java.lang.Object> heap = new WeakHashMap<>();

    static {
        try {
            heap.put(null, null);
            wrapper = (ScriptObjectMirror)engine.eval(
                    "function(name, obj) { var Type = Java.type(name); return new Type(obj); }");
        } catch (ScriptException e) {
            throw new IllegalStateException(e);
        }
    }

    static ScriptObjectMirror eval(String filename) {
        try {
            engine.eval(new FileReader(filename));
            return (ScriptObjectMirror)engine.eval("this");
        } catch (ScriptException | FileNotFoundException e) {
            throw new IllegalArgumentException(e);
        }
    }

    static <T> T wrap(java.lang.Object object, Class type) {
        return wrap(object, mirror -> (T)wrapper.call(null, type.getName(), mirror));
    }

    static <T> T wrap(java.lang.Object object, Function<ScriptObjectMirror, T> constructor) {
        if(object instanceof ScriptObjectMirror) {
            object = constructor.apply((ScriptObjectMirror)object);
        }
        return (T)object;
    }

    static class ArrayMirror<E> extends AbstractJSObject implements List<E> {

        private final List<E> list;
        private final Function<E, ?> cast;

        ArrayMirror(List<E> list) {
            this.list = list;
            this.cast = e -> e;
        }

        ArrayMirror(List<E> list, Function<E, ?> cast) {
            this.list = list;
            this.cast = cast;
        }

        @Override
        public boolean hasMember(String name) {
            return name.equals("length");
        }

        @Override
        public boolean hasSlot(int slot) {
            return slot < list.size();
        }

        @Override
        public java.lang.Object getSlot(int index) {
            return cast.apply(list.get(index));
        }

        @Override
        public java.lang.Object getMember(String name) {
            return hasMember(name) ? list.size() : null;
        }

        @Override
        public boolean isArray() {
            return true;
        }

        @Override
        public int size() {
            return list.size();
        }

        @Override
        public boolean isEmpty() {
            return list.isEmpty();
        }

        @Override
        public boolean contains(java.lang.Object o) {
            return list.contains(o);
        }

        @Override
        public Iterator<E> iterator() {
            return list.iterator();
        }

        @Override
        public java.lang.Object[] toArray() {
            return list.toArray();
        }

        @Override
        public <T> T[] toArray(T[] a) {
            return list.toArray(a);
        }

        @Override
        public boolean add(E e) {
            return list.add(e);
        }

        @Override
        public boolean remove(java.lang.Object o) {
            return list.remove(o);
        }

        @Override
        public boolean containsAll(Collection<?> c) {
            return list.containsAll(c);
        }

        @Override
        public boolean addAll(Collection<? extends E> c) {
            return list.addAll(c);
        }

        @Override
        public boolean addAll(int index, Collection<? extends E> c) {
            return list.addAll(index, c);
        }

        @Override
        public boolean removeAll(Collection<?> c) {
            return list.removeAll(c);
        }

        @Override
        public boolean retainAll(Collection<?> c) {
            return list.retainAll(c);
        }

        @Override
        public void clear() {
            list.clear();
        }

        @Override
        public E get(int index) {
            return list.get(index);
        }

        @Override
        public E set(int index, E element) {
            return list.set(index, element);
        }

        @Override
        public void add(int index, E element) {
            list.add(index, element);
        }

        @Override
        public E remove(int index) {
            return list.remove(index);
        }

        @Override
        public int indexOf(java.lang.Object o) {
            return list.indexOf(o);
        }

        @Override
        public int lastIndexOf(java.lang.Object o) {
            return list.lastIndexOf(o);
        }

        @Override
        public ListIterator<E> listIterator() {
            return list.listIterator();
        }

        @Override
        public ListIterator<E> listIterator(int index) {
            return list.listIterator(index);
        }

        @Override
        public List<E> subList(int fromIndex, int toIndex) {
            return list.subList(fromIndex, toIndex);
        }

        @Override
        public boolean equals(java.lang.Object obj) {
            return list.equals(obj);
        }

        @Override
        public int hashCode() {
            return list.hashCode();
        }

    }

    static class Array<E> extends AbstractList<E> {

        private final JSObject mirror;
        private final Function<java.lang.Object, E> e;

        Array(JSObject mirror) {
            this.mirror = mirror;
            this.e = e -> (E)e;
            JS.heap.put(this, mirror);
        }

        Array(JSObject mirror, Function<ScriptObjectMirror, E> e) {
            this.mirror = mirror;
            this.e = o -> e.apply((ScriptObjectMirror)o);
            JS.heap.put(this, mirror);
        }

        @Override
        public E get(int index) {
            return e.apply(mirror.getSlot(index));
        }

        @Override
        public int size() {
            return ((Number)mirror.getMember("length")).intValue();
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

    static class Object extends AbstractMap<String, java.lang.Object> {

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
        public Set<Entry<String, java.lang.Object>> entrySet() {
            return Arrays.stream(mirror.getOwnKeys(false)).map(key -> new AbstractMap.SimpleEntry<String, java.lang.Object>(key, JS.wrap(mirror.get(key), JS.Object::new))).collect(Collectors.toSet());
        }

        @Override
        public boolean equals(java.lang.Object obj) {
            return mirror.equals(JS.heap.getOrDefault(obj, obj));
        }
    }

    static abstract class AbstractMirror extends AbstractJSObject {

        private final JSObject prototype;
        private final Map<String, JSObject> methods = new HashMap<>();

        AbstractMirror() {
            this(null);
        }

        AbstractMirror(JSObject prototype) {
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
