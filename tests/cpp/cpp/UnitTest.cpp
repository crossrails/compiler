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
			Assert::IsTrue(getBooleanConst());
		}
    };
}
