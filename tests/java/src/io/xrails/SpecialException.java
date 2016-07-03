package io.xrails;

import java.util.*;
import java.util.function.*;
import jdk.nashorn.api.scripting.*;

import static io.xrails.Src.global;

public class SpecialException extends Exception {

    private static final ScriptObjectMirror classMirror = (ScriptObjectMirror)global.get("SpecialError");

    private final ScriptObjectMirror prototype;
    private final JSObject mirror;

    SpecialException(ScriptObjectMirror mirror) { 
        this.prototype = mirror; 
        this.mirror = mirror; 
        JS.heap.put(this, mirror);
    }

    public String getMessage() {
        return (String)prototype.get("message");
    }
    
    public void setMessage(String message) {
        prototype.setMember("message", message);
    }
    
    public SpecialException(String message) {
        prototype = (ScriptObjectMirror)classMirror.newObject(message); 
        mirror = getClass() == SpecialException.class ? prototype : new JS.AbstractMirror(prototype) { 
            @Override 
            void build(BiConsumer<String, Function<Object[], Object>> builder) { 
 
            } 
        }; 
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
    public boolean equals(Object obj) {
        return mirror.equals(JS.heap.getOrDefault(obj, obj));
    }
}