package com.precpet.wearos.session

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class RepCounterTest {

    /** Feeds the counter on a single monotonic time base (~50 Hz, 20 ms ticks). */
    private class Stream(val counter: RepCounter) {
        private var t = 0L
        fun samples(n: Int, magnitude: Float) {
            repeat(n) {
                counter.record(magnitude, t)
                t += 20
            }
        }

        fun rest(n: Int) = samples(n, RepCounter.GRAVITY_MS2)
        fun burst(n: Int) = samples(n, RepCounter.GRAVITY_MS2 + 5f) // deviation ≈ 5 m/s²
    }

    @Test
    fun `rest signal yields zero reps`() {
        val counter = RepCounter()
        val stream = Stream(counter)
        stream.rest(50)
        assertEquals(0, counter.repCount)
    }

    @Test
    fun `counts a single burst as one rep and tracks the peak`() {
        val counter = RepCounter()
        val stream = Stream(counter)
        stream.rest(10)
        stream.burst(10)
        stream.rest(15)

        assertEquals(1, counter.repCount)
        assertEquals(5f, counter.peakRepMagnitudeMs2, 0.05f)
    }

    @Test
    fun `counts three well-separated bursts`() {
        val counter = RepCounter()
        val stream = Stream(counter)
        repeat(3) {
            stream.rest(15)
            stream.burst(10)
        }
        stream.rest(15)

        assertEquals(3, counter.repCount)
    }

    @Test
    fun `deduplicates bursts that complete within the refractory window`() {
        val counter = RepCounter()
        val stream = Stream(counter)
        // Rep 1 completes at t=400. Rep 2 runs 80 ms after it and completes at
        // t=640 — only 240 ms later, under the 250 ms refractory, so it must
        // not be counted as a separate rep.
        stream.rest(10)
        stream.burst(10)
        stream.rest(4)
        stream.burst(8)
        stream.rest(15)

        assertEquals(1, counter.repCount)
    }

    @Test
    fun `hysteresis ignores sub-threshold wobble`() {
        val counter = RepCounter()
        val stream = Stream(counter)
        val wobble = floatArrayOf(
            RepCounter.GRAVITY_MS2, RepCounter.GRAVITY_MS2 + 1.19f, // dev ≈ 1.19 < 2.5
        )
        repeat(25) { stream.samples(2, wobble[it % 2]) }
        assertEquals(0, counter.repCount)
    }

    @Test
    fun `small bursts count when thresholds are lowered`() {
        val small = RepCounter.GRAVITY_MS2 + 1.5f // dev ≈ 1.5

        val strict = RepCounter()
        val strictStream = Stream(strict)
        strictStream.rest(10)
        strictStream.samples(10, small)
        strictStream.rest(15)
        assertEquals(0, strict.repCount)

        val lenient = RepCounter(startThresholdMs2 = 1.0f, endThresholdMs2 = 0.5f)
        val lenientStream = Stream(lenient)
        lenientStream.rest(10)
        lenientStream.samples(10, small)
        lenientStream.rest(15)
        assertEquals(1, lenient.repCount)
    }

    @Test
    fun `reset clears state`() {
        val counter = RepCounter()
        val stream = Stream(counter)
        stream.rest(10)
        stream.burst(10)
        stream.rest(15)
        assertTrue(counter.repCount > 0)

        counter.reset()
        assertEquals(0, counter.repCount)
        assertEquals(0f, counter.peakRepMagnitudeMs2, 0f)
        stream.rest(50)
        assertEquals(0, counter.repCount)
    }
}
