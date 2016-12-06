#pragma once
#include <jsrt.h>

using namespace std;


class Context {
	const JsRuntimeHandle runtime;
	const JsContextRef ref;

public:
	Context(JsContextRef ref, JsRuntimeHandle runtime) : ref(ref), runtime(runtime) {
	}

	Context(const Context& context) : ref(context.ref), runtime(context.runtime) {
		JsAddRef(ref, nullptr);
	}

	~Context() {
		JsRelease(ref, nullptr);
	}

	static Context& eval(const wchar_t *path) {
		JsRuntimeHandle runtime;
		JsContextRef ref;
		JsCreateRuntime(JsRuntimeAttributeNone, nullptr, &runtime) == JsNoError;
		JsCreateContext(runtime, &ref) == JsNoError;
		Context context = Context(ref, runtime);
		JsSetCurrentContext(ref) == JsNoError;
		//JsRunScript(script, ref, path, 0) == JsNoError;
		return context;
	}

};

class Property {
	const wchar_t *name;
	const JsPropertyIdRef id;

public:

	Property& operator=(const wchar_t *name) {
		JsPropertyIdRef id;
		JsGetPropertyIdFromName(name, &id);
		return Property(name, id);
	}

	static Property& from(const wchar_t *name) {
		JsPropertyIdRef id;
		JsGetPropertyIdFromName(name, &id);
		return Property(name, id);
	}

	Property(const wchar_t *name, JsPropertyIdRef id) : name(name), id(id) {
	}

	operator JsPropertyIdRef() const {
		return id; 
	}
};

class Value;

class This {

public:
	virtual const Value& operator[](const Property& property) const = 0;
};

class Instance {
};

class Value : public Instance, public This {

	const Context context;
	const JsValueRef ref;

public:

	Value(JsValueRef& ref, const Context& context) : ref(ref), context(context) {
	}

	Value(const Value& value) : ref(value.ref), context(value.context) {
		JsAddRef(ref, nullptr);
	}

	~Value() {
		JsRelease(ref, nullptr);
	}

	static This& fromGlobalObject(const Context& context) {
		JsValueRef globalObject;
		JsGetGlobalObject(&globalObject) == JsNoError;
		return Value(globalObject, context);
	}

	virtual const Value& operator[](const Property& property) const {
		JsValueRef value;
		JsGetProperty(ref, property, &value) == JsNoError;
		return Value(value, context);
	}

	operator bool() const {
		bool *boolValue = nullptr;
		JsBooleanToBool(ref, boolValue);
		return boolValue;
	}
};
