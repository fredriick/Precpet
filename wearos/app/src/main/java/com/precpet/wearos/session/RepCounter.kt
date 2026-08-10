package com.precpet.wearos.session

/**
 * Counts movement reps from the wrist-worn accelerometer magnitude stream.
 * Pure JVM (no Android dependencies) so it is unit-testable on the host JVM.
 *
 * Feed it the acceleration magnitude |a| = sqrt(ax²+ay²+az²) (m/s², includes
 * gravity) once per captured IMU sample via [record], then read [repCount].
 *
 * Approach — gravity-normalized bursts with hysteresis + a refractory window:
 *  - A running EMA keeps a baseline of the acceleration magnitude (gravity).
 *  - A rep starts when the magnitude deviates above [startThresholdMs2] from the
 *    baseline and ends when it settles back below [endThresholdMs2] (hysteresis
 *    so noise near the threshold doesn't flap the state).
 *  - Reps closer together than [refractoryMs] are deduplicated so a single
 *    burst can't double count and fast tremor isn't over-counted.
 *
 * The baseline only updates while at rest so a sustained burst can't chase it.
 */
class RepCounter(
    private val startThresholdMs2: Float = DEFAULT_START_THRESHOLD_MS2,
    private val endThresholdMs2: Float = DEFAULT_END_THRESHOLD_MS2,
    private val refractoryMs: Long = DEFAULT_REFRACTORY_MS,
) {
    @Volatile
    var repCount: Int = 0
        private set

    /** Peak magnitude deviation above the gravity baseline seen during reps. */
    @Volatile
    var peakRepMagnitudeMs2: Float = 0f
        private set

    private var baseline = GRAVITY_MS2
    private var inRep = false
    private var lastRepEndMs = Long.MIN_VALUE

    fun reset() {
        repCount = 0
        peakRepMagnitudeMs2 = 0f
        baseline = GRAVITY_MS2
        inRep = false
        lastRepEndMs = Long.MIN_VALUE
    }

    /**
     * Record one sample. [nowMs] is the monotonic capture time of the sample
     * (used only for the refractory window; relative differences matter).
     */
    fun record(magnitudeMs2: Float, nowMs: Long) {
        val deviation = magnitudeMs2 - baseline

        if (!inRep) {
            if (deviation >= startThresholdMs2) {
                inRep = true
            } else {
                // At rest: let the baseline track gravity drift (slowly).
                baseline += (magnitudeMs2 - baseline) * BASELINE_ALPHA
            }
            return
        }

        if (deviation > peakRepMagnitudeMs2) peakRepMagnitudeMs2 = deviation
        if (deviation <= endThresholdMs2) {
            inRep = false
            val sinceLast = nowMs - lastRepEndMs
            if (lastRepEndMs == Long.MIN_VALUE || sinceLast >= refractoryMs) {
                repCount++
            }
            lastRepEndMs = nowMs
        }
    }

    companion object {
        /** Standard gravity, m/s² — the resting accel magnitude baseline. */
        const val GRAVITY_MS2 = 9.81f
        /** EMA coefficient for the gravity baseline (1 update ≈ 20 ms sample). */
        private const val BASELINE_ALPHA = 0.05f

        const val DEFAULT_START_THRESHOLD_MS2 = 2.5f
        const val DEFAULT_END_THRESHOLD_MS2 = 1.25f
        const val DEFAULT_REFRACTORY_MS = 250L
    }
}
