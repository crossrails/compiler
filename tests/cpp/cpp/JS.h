#pragma once
#include <jsrt.h>
#include <string>
#include <stdexcept>
#include <ppltasks.h>

using namespace std;
using namespace concurrency;
using namespace Platform;
using namespace Windows::Foundation;
using namespace Windows::Storage;

void JsAssert(JsErrorCode code) {
	if (code == JsNoError) return;
	throw runtime_error(to_string(code));
}

class Context {
	const JsRuntimeHandle runtime;
	const JsContextRef ref;

public:
	Context(JsContextRef ref, JsRuntimeHandle runtime) : ref(ref), runtime(runtime) {
		JsAssert(JsSetCurrentContext(ref));
	}

	Context(const Context& context) : ref(context.ref), runtime(context.runtime) {
		JsAssert(JsAddRef(ref, nullptr));
	}

	~Context() {
		JsAssert(JsRelease(ref, nullptr));
	}

	static Context eval(const wchar_t *path) {
		JsRuntimeHandle runtime;
		JsContextRef ref;
		JsAssert(JsCreateRuntime(JsRuntimeAttributeNone, nullptr, &runtime));
		JsAssert(JsCreateContext(runtime, &ref));
		const auto context = Context(ref, runtime);
		Uri^ uri = ref new Uri("ms-appx:///Assets/src.js");
		create_task(StorageFile::GetFileFromApplicationUriAsync(uri)).then([path](task<StorageFile^> file) {
			create_task(FileIO::ReadTextAsync(file.get())).then([path](task<String^> text) {
				JsAssert(JsRunScript(text.get().Data(), 0, path, nullptr));
			});
		});
		return context;
	}

	operator JsContextRef() const {
		return ref;
	}
};

class Property {
	const wchar_t *name;
	JsPropertyIdRef id;

public:

	Property(const wchar_t *name) : name(name) {
		JsAssert(JsGetPropertyIdFromName(name, &id));
	}

	operator JsPropertyIdRef() const {
		return id; 
	}
};

class Value  {

	const Context context;
	const JsValueRef ref;

public:

	Value(JsValueRef& ref, const Context& context) : ref(ref), context(context) {
	}

	Value(const Value& value) : ref(value.ref), context(value.context) {
		JsAssert(JsAddRef(ref, nullptr));
	}

	~Value() {
		JsAssert(JsRelease(ref, nullptr));
	}

	static Value fromGlobalObject(const Context& context) {
		JsValueRef globalObject;
		JsAssert(JsGetGlobalObject(&globalObject));
		return Value(globalObject, context);
	}

	virtual const Value operator[](const Property& property) const {
		JsValueRef value;
		JsAssert(JsGetProperty(ref, property, &value));
		return Value(value, context);
	}

	operator bool() const {
		bool boolValue;
		JsAssert(JsBooleanToBool(ref, &boolValue));
		return boolValue;
	}
};
