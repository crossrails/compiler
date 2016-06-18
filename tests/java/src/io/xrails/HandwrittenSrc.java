package io.xrails;

import jdk.nashorn.api.scripting.NashornException;
import jdk.nashorn.api.scripting.ScriptObjectMirror;

import java.util.List;
import java.util.Optional;
import java.util.function.Supplier;

import static java.util.Objects.isNull;
import static java.util.Objects.requireNonNull;

import static io.xrails.Src.global;

public class HandwrittenSrc {

//functions

    public static Supplier<String> getStringNoArgLambda() {
        return JS.wrap(global.get("stringNoArgLambda"), Supplier.class);
    }

    public static void setStringNoArgLambda(Supplier<String> cb) {
        global.setMember("stringNoArgLambda", cb);
    }

}
