package io.xrails;

import jdk.nashorn.api.scripting.AbstractJSObject;
import jdk.nashorn.api.scripting.ScriptObjectMirror;

import java.util.Map;
import java.util.function.BiConsumer;
import java.util.function.Function;

/**
 * Created by nbransby on 07/03/2016.
 */
class JS$SimpleInterfaceMirror extends JS.AbstractMirror {

    private final SimpleInterface instance;

    JS$SimpleInterfaceMirror(SimpleInterface instance) {
        this.instance = instance;
    }

    void build(BiConsumer<String, Function<Object[], Object>> builder) {
        builder.accept("voidNoArgMethod", args -> { instance.voidNoArgMethod(); return null; });
    }
}
