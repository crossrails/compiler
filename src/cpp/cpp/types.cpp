#include "pch.h"
#include "types.h"
#include "JS.h"

const This& __this = Value::fromGlobalObject(Context::eval(L"src.js"));

inline namespace property {
	const Property& booleanConst() {
		static Property property = Property::from(L"booleanConst");
		return property;
	}
}

bool getBooleanConst() {
	return __this[property::booleanConst()];
}
