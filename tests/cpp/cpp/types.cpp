#include "pch.h"
#include "types.h"
#include "JS.h"


inline namespace JS {
	const Value& self() {
		static const auto self = Value::fromGlobalObject(Context::eval(L"src.js"));
		return self;
	}

	const Property& booleanConst() {
		static Property property = L"booleanConst";
		return property;
	}
}

bool getBooleanConst() {
	return JS::self()[JS::booleanConst()];
}
