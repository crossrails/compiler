package io.xrails;

import com.eclipsesource.v8.*;
import com.eclipsesource.v8.utils.V8ObjectUtils;

import static io.xrails.Src.global;


public class SimpleObject {

    private static final V8Function constructor = (V8Function)global.getObject("SimpleObject");
    private static final V8Object prototype = constructor.getObject("prototype");

    private final V8Object object;

    SimpleObject(V8Object object) {
        this.object = object;
        JS.heap.put(this, object);
    }

    public static Boolean staticVoidNoArgMethodCalled() {
        return (Boolean)constructor.get("staticVoidNoArgMethodCalled");
    }
    
    public static void staticVoidNoArgMethodCalled(Boolean newValue) {
        constructor.add("staticVoidNoArgMethodCalled", newValue);
    }
    
    public Boolean methodToOverrideCalled() {
        return (Boolean)object.get("methodToOverrideCalled");
    }
    
    public void methodToOverrideCalled(Boolean newValue) {
        object.add("methodToOverrideCalled", newValue);
    }
    
    public SimpleObject() {
        object = new V8Object(global.getRuntime());
        object.setPrototype(prototype);
        object.add("constructor", constructor);
        object.registerJavaMethod((JavaCallback)(r, p) -> numberSingleObjectArgMethod(new SimpleObject(p.getObject(0))), "numberSingleObjectArgMethod");
        object.registerJavaMethod((JavaVoidCallback)(r, p) -> callOverriddenMethod(), "callOverriddenMethod");
        object.registerJavaMethod((JavaVoidCallback)(r, p) -> methodToOverride(), "methodToOverride");
        object.registerJavaMethod((JavaCallback)(r, p) -> JS.heap.get(upcastThisToObject()), "upcastThisToObject");
        constructor.call(object, new V8Array(global.getRuntime()));
        JS.heap.put(this, object);
    }

    public SimpleObject(Number v) {
        object = new V8Object(global.getRuntime());
        object.setPrototype(prototype);
        object.add("constructor", constructor);
        object.registerJavaMethod((JavaCallback)(r, p) -> numberSingleObjectArgMethod(new SimpleObject(p.getObject(0))), "numberSingleObjectArgMethod");
        object.registerJavaMethod((JavaVoidCallback)(r, p) -> callOverriddenMethod(), "callOverriddenMethod");
        object.registerJavaMethod((JavaVoidCallback)(r, p) -> methodToOverride(), "methodToOverride");
        object.registerJavaMethod((JavaCallback)(r, p) -> JS.heap.get(upcastThisToObject()), "upcastThisToObject");
        constructor.call(object, new V8Array(global.getRuntime()).push(v.doubleValue()));
        JS.heap.put(this, object);
    }

    public static void staticVoidNoArgMethod() {
        constructor.executeVoidFunction("staticVoidNoArgMethod", null);
    }

    public Number numberSingleObjectArgMethod(SimpleObject a) {
        return (Number)((V8Function)prototype.get("numberSingleObjectArgMethod")).call(object, JS.push(new V8Array(global.getRuntime()), JS.toJS(a, SimpleObject.class, null)));
    }

    public void callOverriddenMethod() {
        ((V8Function)prototype.get("callOverriddenMethod")).call(object, null);
    }

    public void methodToOverride() {
        ((V8Function)prototype.get("methodToOverride")).call(object, null);
    }

    public Object upcastThisToObject() {
        return JS.fromJS(((V8Function)prototype.get("upcastThisToObject")).call(object, null));
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