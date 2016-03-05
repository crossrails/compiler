package io.xrails;

import jdk.nashorn.api.scripting.ScriptObjectMirror;

import static io.xrails.Src.global;

/**
 * Created by nbransby on 05/03/2016.
 */
class SimpleObject {

    private static final Proxy constructor = global.get("SimpleObject", Proxy::new);

    final Proxy proxy;

    public SimpleObject(Number number) {
        proxy = new Proxy(constructor, number);
    }

    SimpleObject(ScriptObjectMirror mirror) {
        proxy = new Proxy(mirror);
    }

    public Number numberSingleObjectArgMethod(SimpleObject a) {
        return proxy.call("numberSingleObjectArgMethod", a.proxy.mirror);
    }

    public Object upcastThisToObject() {
        return proxy.call("upcastThisToObject");
    }

    public static void staticVoidNoArgMethod() {
        constructor.call("staticVoidNoArgMethod");
    }
}
