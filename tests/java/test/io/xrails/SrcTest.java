package io.xrails;

import org.junit.Before;
import org.junit.Test;

import java.lang.ref.WeakReference;
import java.util.Arrays;
import java.util.Collections;

import static io.xrails.HandwrittenSrc.*;
import static io.xrails.Src.*;
import static org.junit.Assert.*;

/**
 * Created by nbransby on 20/02/2016.
 */
public class SrcTest {

    @Before
    public void setUp() {
        JS.eval("../reference/src.js");
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
            assertEquals("Special error message", e.getMessage());
        }
    }

    @Test
    public void testObjects() throws Exception {
        SimpleObject.staticVoidNoArgMethod();

        assertNotNull(getSimpleObjectInstance());

        assertEquals(49.0, getSimpleObjectInstance().numberSingleObjectArgMethod(getSimpleObjectInstance()));

        assertEquals(14.0, getSimpleObjectInstance().numberSingleObjectArgMethod(new SimpleObject(2)));

        assertEquals(getSimpleObjectInstance(), getSimpleObjectInstance());
        assertEquals(getSimpleObjectInstance(), getSimpleObjectInstance().upcastThisToObject());
        assertEquals(getSimpleObjectInstance().upcastThisToObject(), getSimpleObjectInstance());
    }

    private boolean testInheritanceMethodCalled = false;

    @Test
    public void testInheritance() throws Exception {
        SimpleObject o = new SimpleObject(5);
        o.callOverriddenMethod();
        assertTrue(o.getMethodToOverrideCalled());

        o = new SimpleObject(5) {
            @Override
            public void methodToOverride() {
                testInheritanceMethodCalled = true;
            }
        };
        o.callOverriddenMethod();
        assertTrue(testInheritanceMethodCalled);
        assertFalse(o.getMethodToOverrideCalled());

        o = new SimpleObject(5) {
            @Override
            public void methodToOverride() {
                super.methodToOverride();
            }
        };
        o.methodToOverride();
        assertTrue(o.getMethodToOverrideCalled());
    }

    private boolean testInterfaceMethodCalled = false;

    @Test
    public void testInterface() throws Exception {
        getSimpleInterfaceInstance().voidNoArgMethod();
        assertTrue(getSimpleInterfaceInstanceCalled());

        acceptSimpleInterface(new SimpleInterface() {
            @Override
            public void voidNoArgMethod() {
                testInterfaceMethodCalled = true;
            }
        });
        assertTrue(testInterfaceMethodCalled);
        testInterfaceMethodCalled = false;
        getSimpleInterfaceInstance().voidNoArgMethod();
        assertTrue(testInterfaceMethodCalled);
    }

    @Test
    public void testFunctions() throws Exception {
        voidNoArgFunction();
        assertTrue(getVoidNoArgFunctionCalled());

        assertEquals("stringNoArgFunctionReturnValue", stringNoArgFunction());

        assertEquals(25.0, numberMultipleArgFunction(5, 5));
        assertEquals(-3.0, numberMultipleArgFunction(-2, 1.5));

        assertEquals("stringNoArgLambdaReturnValue", getStringNoArgLambda().get());
        assertEquals(getStringNoArgLambda().get(), getStringNoArgLambda().get());

        setStringNoArgLambda(() -> "expectedReturnValue");
        assertEquals("expectedReturnValue", getStringNoArgLambda().get());
    }

    @Test
    public void testConstTypes() throws Exception {
        assertFalse(getBooleanConst());
        assertTrue(Double.isNaN(getNumberConst().doubleValue()));
        assertEquals("stringConstLiteral", getStringConst());
        assertEquals(Arrays.asList(1, 2, 3), getNumberArrayConst());
        assertEquals(Arrays.asList(Arrays.asList("1", "2", "3"), Arrays.asList("4", "5", "6"), Arrays.asList("7", "8", "9")), getStringArrayArrayConst());
        assertEquals("anyConstLiteral", getAnyConst());
        assertEquals(Arrays.asList(1, null, 3), getNumberOrNullArrayConst());
    }

    @Test
    public void testOptionalConstTypes() throws Exception {
        assertFalse(getOptionalBooleanConst().isPresent());
        assertFalse(getOptionalNumberConst().isPresent());
        assertFalse(getOptionalStringConst().isPresent());
        assertFalse(getOptionalNumberArrayConst().isPresent());
        assertFalse(getOptionalNullAnyConst().isPresent());
        assertEquals(getOptionalNonNullAnyConst().get(), getStringConst());
    }

    @Test
    public void testVarTypes() throws Exception {
        assertTrue(getBooleanVar());
        setBooleanVar(getBooleanConst());
        assertEquals(getBooleanConst(), getBooleanVar());

        assertEquals(0, getNumberVar());
        setNumberVar(getNumberConst());
        assertTrue(Double.isNaN(getNumberVar().doubleValue()));

        assertEquals("stringVarLiteral", getStringVar());
        setStringVar(getStringConst());
        assertEquals(getStringConst(), getStringVar());

        assertEquals("anyVarLiteral", getAnyVar());
        setAnyVar(getAnyConst());
        assertEquals(getAnyConst(), getAnyVar());

        assertEquals(Collections.emptyList(), getNumberArrayVar());
        setNumberArrayVar(getNumberArrayConst());
        assertEquals(getNumberArrayConst(), getNumberArrayVar());

        assertEquals(Collections.emptyList(), getStringArrayArrayVar());
        setStringArrayArrayVar(getStringArrayArrayConst());
        assertEquals(getStringArrayArrayConst(), getStringArrayArrayVar());

        setNumberArrayVar(Collections.singletonList(5));
        assertEquals(Collections.singletonList(5), getNumberArrayVar());

        setStringArrayArrayVar(Collections.singletonList(Collections.singletonList("yo")));
        assertEquals(Collections.singletonList(Collections.singletonList("yo")), getStringArrayArrayVar());
    }

    @Test
    public void testOptionalVarTypes() throws Exception {
        assertFalse(getOptionalBooleanVar().isPresent());
        setOptionalBooleanVar(false);
        assertEquals(getBooleanConst(), getOptionalBooleanVar().get());
        setOptionalBooleanVar(null);
        assertFalse(getOptionalBooleanVar().isPresent());

        assertFalse(getOptionalNumberVar().isPresent());
        setOptionalNumberVar(4000);
        assertEquals(4000, getOptionalNumberVar().get());
        setOptionalNumberVar(null);
        assertFalse(getOptionalNumberVar().isPresent());

        assertFalse(getOptionalStringVar().isPresent());
        setOptionalStringVar("stringConstLiteral");
        assertEquals(getStringConst(), getOptionalStringVar().get());
        setOptionalStringVar(null);
        assertFalse(getOptionalStringVar().isPresent());

        assertFalse(getOptionalAnyVar().isPresent());
        setOptionalAnyVar("anyConstLiteral");
        assertEquals(getAnyConst(), getOptionalAnyVar().get());
        setOptionalAnyVar(null);
        assertFalse(getOptionalAnyVar().isPresent());
    }

    @Test
    public void testNoErasureForBasicTypes() throws Exception {
        setAnyVar(getBooleanConst());
        assertEquals(getBooleanConst(), getAnyVar());
        assertTrue(getAnyVar() == getBooleanConst());
    }

    @Test
    public void testErasureForNonBasicTypes() throws Exception {
        setAnyVar(getAnyObjectInstance());
        assertEquals(getAnyObjectInstance(), getAnyVar());
        assertFalse(getAnyVar() == getAnyObjectInstance());
    }

    @Test
    public void testUnknownObjectDeallocation() throws Exception {
        Object o = new Object();
        WeakReference ref = new WeakReference<>(o);
        assertNotNull(ref.get());
        setOptionalAnyVar(o);
        o = null;
        System.gc();
        System.runFinalization();
        assertNotNull(ref.get());
        setOptionalAnyVar(null);
        System.gc();
        System.runFinalization();
        assertNull(ref.get());
    }

    @Test
    public void testKnownObjectDeallocation() throws Exception {
        Object o = new SimpleObject(1);
        WeakReference ref = new WeakReference<>(o);
        assertNotNull(ref.get());
        setOptionalAnyVar(o);
        o = null;
        System.gc();
        System.runFinalization();
        assertNotNull(ref.get());
        setOptionalAnyVar(null);
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
        setOptionalAnyVar(o);
        o = null;
        System.gc();
        System.runFinalization();
        assertNotNull(ref.get());
        setOptionalAnyVar(null);
        System.gc();
        System.runFinalization();
        assertNull(ref.get());
    }

    @Test
    public void testJSSideInterfaceDeallocation() throws Exception {
        SimpleInterface so = getSimpleInterfaceInstance();
        WeakReference ref2 = new WeakReference<>(so);
        setOptionalAnyVar(so);
        so = null;
        System.gc();
        System.runFinalization();
        assertNotNull(ref2.get());
        setOptionalAnyVar(null);
        System.gc();
        System.runFinalization();
        assertNull(ref2.get());
    }
}