package io.xrails;

import jdk.nashorn.api.scripting.JSObject;
import jdk.nashorn.api.scripting.ScriptObjectMirror;

import java.util.function.BiConsumer;
import java.util.function.Function;

import static io.xrails.Src.global;

/**
 * Created by nbransby on 05/03/2016.
 */
class SpecialException extends Exception {

    private static final ScriptObjectMirror classMirror = (ScriptObjectMirror)global.get("SpecialException");

    private final ScriptObjectMirror prototype;
    private final JSObject mirror;

    public SpecialException(String message) {
        super(message);
        prototype = (ScriptObjectMirror)classMirror.newObject(message);
        mirror = getClass() == SpecialException.class ? prototype : new JS.AbstractMirror(prototype) {
            @Override
            void build(BiConsumer<String, Function<Object[], Object>> builder) {
            }
        };
        JS.heap.put(this, mirror);
    }

    SpecialException(ScriptObjectMirror prototype) {
        this.prototype = prototype;
        this.mirror = prototype;
        JS.heap.put(this, mirror);
    }

    public String getMessage() {
        return (String) prototype.get("message");
    }

    @Override
    public String toString() {
        return prototype.toString();
    }

    @Override
    public int hashCode() {
        return prototype.hashCode();
    }

    @Override
    public boolean equals(Object obj) {
        return mirror.equals(JS.heap.getOrDefault(obj, obj));
    }
}
