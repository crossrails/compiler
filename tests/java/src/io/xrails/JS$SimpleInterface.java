package io.xrails;

import jdk.nashorn.api.scripting.ScriptObjectMirror;

/**
 * Created by nbransby on 07/03/2016.
 */
class JS$SimpleInterface implements SimpleInterface {

    private ScriptObjectMirror mirror;

    JS$SimpleInterface(ScriptObjectMirror mirror) {
        this.mirror = mirror;
        JS.heap.put(this, mirror);
    }

    @Override
    public void voidNoArgMethod() {
        mirror.callMember("voidNoArgMethod");
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
