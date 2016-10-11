package io.xrails;

import com.eclipsesource.v8.V8Array;
import com.eclipsesource.v8.V8Function;
import com.eclipsesource.v8.V8Object;

import static io.xrails.Src.global;


public class SpecialException extends Exception {

    private static final V8Function constructor = (V8Function)global.getObject("SpecialError");

    private final V8Object object;

    SpecialException(V8Object object) {
        this.object = object;
        JS.heap.put(this, object);
    }

    public String message() {
        return object.getString("message");
    }
    
    public void message(String newValue) {
        object.add("message", newValue);
    }
    
    public SpecialException(String message) {
        object = new V8Object(global.getRuntime());
        object.setPrototype(constructor);
        V8Array parameters = new V8Array(global.getRuntime());
        parameters.push(message);
        constructor.call(object, parameters);
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
    public boolean equals(Object obj) {
        return object.equals(JS.heap.get(obj));
    }
}