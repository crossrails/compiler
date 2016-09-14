package io.xrails;

import org.junit.Before;
import org.junit.Test;

import java.lang.ref.WeakReference;
import java.util.Arrays;
import java.util.Collections;

import static io.xrails.Src.*;
import static org.junit.Assert.*;

/**
 * Created by nbransby on 20/02/2016.
 */
public class SrcTest {

    @Before
    public void setUp() {
        JS.eval("../input/src.js");
    }

    @Test
    public void testSimpleException() throws Exception {
        try {
            throwSimpleError();
            fail();
        } catch (Exception e) {
            assertEquals("Error: Simple error message", e.getMessage());
        }
    }

    @Test
    public void testSpecialException() throws Exception {
        try {
            throwSpecialError();
            fail();
        } catch (SpecialException e) {
            assertEquals("Special error message", e.message());
        }
    }

    @Test
    public void testObjects() throws Exception {
        SimpleObject.staticVoidNoArgMethod();

        assertNotNull(simpleObjectInstance());

        assertEquals(49.0, simpleObjectInstance().numberSingleObjectArgMethod(simpleObjectInstance()));

        assertEquals(14.0, simpleObjectInstance().numberSingleObjectArgMethod(new SimpleObject(2)));

        assertEquals(simpleObjectInstance(), simpleObjectInstance());
        assertEquals(simpleObjectInstance(), simpleObjectInstance().upcastThisToObject());
        assertEquals(simpleObjectInstance().upcastThisToObject(), simpleObjectInstance());
    }

    private boolean testInheritanceMethodCalled = false;

    @Test
    public void testInheritance() throws Exception {
        SimpleObject o = new SimpleObject(5);
        o.callOverriddenMethod();
        assertTrue(o.methodToOverrideCalled());

        o = new SimpleObject(5) {
            @Override
            public void methodToOverride() {
                testInheritanceMethodCalled = true;
            }
        };
        o.callOverriddenMethod();
        assertTrue(testInheritanceMethodCalled);
        assertFalse(o.methodToOverrideCalled());

        o = new SimpleObject(5) {
            @Override
            public void methodToOverride() {
                super.methodToOverride();
            }
        };
        o.methodToOverride();
        assertTrue(o.methodToOverrideCalled());
    }

    private boolean testInterfaceMethodCalled = false;

    @Test
    public void testInterface() throws Exception {
        simpleInterfaceInstance().voidNoArgMethod();
        assertTrue(simpleInterfaceInstanceCalled());

        acceptSimpleInterface(new SimpleInterface() {
            @Override
            public void voidNoArgMethod() {
                testInterfaceMethodCalled = true;
            }
        });
        assertTrue(testInterfaceMethodCalled);
        testInterfaceMethodCalled = false;
        simpleInterfaceInstance().voidNoArgMethod();
        assertTrue(testInterfaceMethodCalled);
    }

    @Test
    public void testFunctions() throws Exception {
        voidNoArgFunction();
        assertTrue(voidNoArgFunctionCalled());

        assertEquals("stringNoArgFunctionReturnValue", stringNoArgFunction());

        assertEquals(25.0, numberMultipleArgFunction(5, 5));
        assertEquals(-3.0, numberMultipleArgFunction(-2, 1.5));

        assertEquals("stringNoArgLambdaReturnValue", stringNoArgLambda().get());
        assertEquals(stringNoArgLambda().get(), stringNoArgLambda().get());
        stringNoArgLambda(() -> "expectedReturnValue");
        assertEquals("expectedReturnValue", stringNoArgLambda().get());
    }

    @Test
    public void testConstTypes() throws Exception {
        assertFalse(booleanConst());
        assertTrue(Double.isNaN(numberConst().doubleValue()));
        assertEquals("stringConstLiteral", stringConst());
        assertEquals(Arrays.asList(1, 2, 3), numberArrayConst());
        assertEquals(Arrays.asList(Arrays.asList("1", "2", "3"), Arrays.asList("4", "5", "6"), Arrays.asList("7", "8", "9")), stringArrayArrayConst());
        assertEquals("anyConstLiteral", anyConst());
        assertEquals(Arrays.asList(1, null, 3), numberOrNullArrayConst());
    }

    @Test
    public void testOptionalConstTypes() throws Exception {
        assertFalse(optionalBooleanConst().isPresent());
        assertFalse(optionalNumberConst().isPresent());
        assertFalse(optionalStringConst().isPresent());
        assertFalse(optionalNumberArrayConst().isPresent());
        assertFalse(optionalNullAnyConst().isPresent());
        assertEquals(optionalNonNullAnyConst().get(), stringConst());
    }

    @Test
    public void testVarTypes() throws Exception {
        assertTrue(booleanVar());
        booleanVar(booleanConst());
        assertEquals(booleanConst(), booleanVar());

        assertEquals(0, numberVar());
        numberVar(numberConst());
        assertTrue(Double.isNaN(numberVar().doubleValue()));

        assertEquals("stringVarLiteral", stringVar());
        stringVar(stringConst());
        assertEquals(stringConst(), stringVar());

        assertEquals("anyVarLiteral", anyVar());
        anyVar(anyConst());
        assertEquals(anyConst(), anyVar());

        assertEquals(Collections.emptyList(), numberArrayVar());
        numberArrayVar(numberArrayConst());
        assertEquals(numberArrayConst(), numberArrayVar());

        assertEquals(Collections.emptyList(), stringArrayArrayVar());
        stringArrayArrayVar(stringArrayArrayConst());
        assertEquals(stringArrayArrayConst(), stringArrayArrayVar());

        numberArrayVar(Collections.singletonList(5));
        assertEquals(Collections.singletonList(5), numberArrayVar());

        stringArrayArrayVar(Collections.singletonList(Collections.singletonList("yo")));
        assertEquals(Collections.singletonList(Collections.singletonList("yo")), stringArrayArrayVar());
    }

    @Test
    public void testOptionalVarTypes() throws Exception {
        assertFalse(optionalBooleanVar().isPresent());
        optionalBooleanVar(false);
        assertEquals(booleanConst(), optionalBooleanVar().get());
        optionalBooleanVar(null);
        assertFalse(optionalBooleanVar().isPresent());

        assertFalse(optionalNumberVar().isPresent());
        optionalNumberVar(4000);
        assertEquals(4000, optionalNumberVar().get());
        optionalNumberVar(null);
        assertFalse(optionalNumberVar().isPresent());

        assertFalse(optionalStringVar().isPresent());
        optionalStringVar("stringConstLiteral");
        assertEquals(stringConst(), optionalStringVar().get());
        optionalStringVar(null);
        assertFalse(optionalStringVar().isPresent());

        assertFalse(optionalAnyVar().isPresent());
        optionalAnyVar("anyConstLiteral");
        assertEquals(anyConst(), optionalAnyVar().get());
        optionalAnyVar(null);
        assertFalse(optionalAnyVar().isPresent());
    }

    @Test
    public void testNoErasureForBasicTypes() throws Exception {
        anyVar(booleanConst());
        assertEquals(booleanConst(), anyVar());
        assertTrue(anyVar() == booleanConst());
    }

    @Test
    public void testErasureForNonBasicTypes() throws Exception {
        anyVar(anyObjectInstance());
        assertEquals(anyObjectInstance(), anyVar());
        assertFalse(anyVar() == anyObjectInstance());
    }

    @Test
    public void testUnknownObjectDeallocation() throws Exception {
        Object o = new Object();
        WeakReference ref = new WeakReference<>(o);
        assertNotNull(ref.get());
        optionalAnyVar(o);
        o = null;
        System.gc();
        System.runFinalization();
        assertNotNull(ref.get());
        optionalAnyVar(null);
        System.gc();
        System.runFinalization();
        assertNull(ref.get());
    }

    @Test
    public void testKnownObjectDeallocation() throws Exception {
        Object o = new SimpleObject(1);
        WeakReference ref = new WeakReference<>(o);
        assertNotNull(ref.get());
        optionalAnyVar(o);
        o = null;
        System.gc();
        System.runFinalization();
        assertNotNull(ref.get());
        optionalAnyVar(null);
        System.gc();
        System.runFinalization();
        assertNull(ref.get());
    }

    @Test
    public void testNativeSideInterfaceDeallocation() throws Exception {
        SimpleInterface o = new SimpleInterface() {
            @Override
            public void voidNoArgMethod() {
            }
        };
        WeakReference ref = new WeakReference<>(o);
        assertNotNull(ref.get());
        optionalAnyVar(o);
        o = null;
        System.gc();
        System.runFinalization();
        assertNotNull(ref.get());
        optionalAnyVar(null);
        System.gc();
        System.runFinalization();
        assertNull(ref.get());
    }

    @Test
    public void testJSSideInterfaceDeallocation() throws Exception {
        SimpleInterface so = simpleInterfaceInstance();
        WeakReference ref2 = new WeakReference<>(so);
        optionalAnyVar(so);
        so = null;
        System.gc();
        System.runFinalization();
        assertNotNull(ref2.get());
        optionalAnyVar(null);
        System.gc();
        System.runFinalization();
        assertNull(ref2.get());
    }
}