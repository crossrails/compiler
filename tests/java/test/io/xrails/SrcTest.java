package io.xrails;

import org.junit.Test;

import java.util.Arrays;

import static io.xrails.Src.*;
import static org.junit.Assert.*;

/**
 * Created by nbransby on 20/02/2016.
 */
public class SrcTest {

    @Test
    public void testObjects() throws Exception {
        SimpleObject.staticVoidNoArgMethod();

        assertNotNull(getSimpleObjectInstance());

        assertEquals(49.0, getSimpleObjectInstance().numberSingleObjectArgMethod(getSimpleObjectInstance()));

        assertEquals(14.0, getSimpleObjectInstance().numberSingleObjectArgMethod(new SimpleObject(2)));

        assertTrue(getSimpleObjectInstance() == getSimpleObjectInstance().upcastThisToObject());
        assertTrue(getSimpleObjectInstance().upcastThisToObject() == getSimpleObjectInstance().upcastThisToObject());

        assertTrue(getSimpleObjectInstance().upcastThisToObject() == getSimpleObjectInstance().upcastThisToObject());

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
//        assertEquals(getStringNoArgLambda(), getStringNoArgLambda());
    }

    @Test
    public void testTypes() throws Exception {
        assertFalse(getBooleanConst());
        assertTrue(Double.isNaN(getNumberConst().doubleValue()));
        assertEquals("stringConstLiteral", getStringConst());
        assertEquals(Arrays.asList(1, 2, 3), getNumberArrayConst());
        assertEquals(Arrays.asList(Arrays.asList("1", "2", "3"), Arrays.asList("4", "5", "6"), Arrays.asList("7", "8", "9")), getStringArrayArrayConst());

        assertFalse(getOptionalBooleanConst().isPresent());
        assertFalse(getOptionalNumberConst().isPresent());
        assertFalse(getOptionalStringConst().isPresent());
        assertFalse(getOptionalNumberArrayConst().isPresent());

        assertTrue(getBooleanVar());
        setBooleanVar(getBooleanConst());
        assertEquals(getBooleanConst(), getBooleanVar());

        assertEquals(0, getNumberVar());
        setNumberVar(getNumberConst());
        assertTrue(Double.isNaN(getNumberVar().doubleValue()));

        assertEquals("stringVarLiteral", getStringVar());
        setStringVar(getStringConst());
        assertEquals(getStringConst(), getStringVar());

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
    }
}