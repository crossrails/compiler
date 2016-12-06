#include "pch.h"
#include "types.h"
#include "CppUnitTest.h"

using namespace Microsoft::VisualStudio::CppUnitTestFramework;

namespace cpp
{
    TEST_CLASS(UnitTest1)
    {
    public:
        TEST_METHOD(TestMethod1)
        {
			JsRuntimeHandle runtime;
			JsContextRef context;
			Assert::IsTrue(JsCreateRuntime(JsRuntimeAttributeNone, nullptr, &runtime) == JsNoError);
			Assert::IsTrue(JsCreateContext(runtime, &context) == JsNoError);
			Assert::IsTrue(JsSetCurrentContext(context) == JsNoError);
			Assert::IsTrue(JsStartDebugging() == JsNoError);
		}
    };
}

class Foo
{
public:
	int var;
};

class Bar : public Foo
{
public:
//	char* var;
};

Bar bar;

void main()
{

	bar.var;
}