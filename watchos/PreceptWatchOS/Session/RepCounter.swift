import Foundation

/// Counts movement reps from the wrist-worn accelerometer magnitude stream.
/// Mirrors the Wear OS `RepCounter.kt`.
///
/// Feed it the acceleration magnitude |a| = sqrt(ax²+ay²+az²) (m/s², includes
/// gravity) once per captured IMU sample via `record`, then read `repCount`.
///
/// Approach — gravity-normalized bursts with hysteresis + a refractory window:
///  - A running EMA keeps a baseline of the acceleration magnitude (gravity).
///  - A rep starts when the magnitude deviates above `startThresholdMs2` from
///    the baseline and ends when it settles back below `endThresholdMs2`
///    (hysteresis so noise near the threshold doesn't flap the state).
///  - Reps closer together than `refractoryMs` are deduplicated.
/// The baseline only updates while at rest so a sustained burst can't chase it.
final class RepCounter {
    static let gravityMs2: Float = 9.81
    static let baselineAlpha: Float = 0.05
    static let defaultStartThresholdMs2: Float = 2.5
    static let defaultEndThresholdMs2: Float = 1.25
    static let defaultRefractoryMs: Int64 = 250

    private let startThresholdMs2: Float
    private let endThresholdMs2: Float
    private let refractoryMs: Int64

    private(set) var repCount = 0

    /// Peak magnitude deviation above the gravity baseline seen during reps.
    private(set) var peakRepMagnitudeMs2: Float = 0

    private var baseline: Float = RepCounter.gravityMs2
    private var inRep = false
    private var lastRepEndMs: Int64 = .min

    init(
        startThresholdMs2: Float = RepCounter.defaultStartThresholdMs2,
        endThresholdMs2: Float = RepCounter.defaultEndThresholdMs2,
        refractoryMs: Int64 = RepCounter.defaultRefractoryMs
    ) {
        self.startThresholdMs2 = startThresholdMs2
        self.endThresholdMs2 = endThresholdMs2
        self.refractoryMs = refractoryMs
    }

    func reset() {
        repCount = 0
        peakRepMagnitudeMs2 = 0
        baseline = RepCounter.gravityMs2
        inRep = false
        lastRepEndMs = .min
    }

    /// Record one sample. `nowMs` is the monotonic capture time of the sample
    /// (used only for the refractory window; relative differences matter).
    func record(magnitudeMs2: Float, nowMs: Int64) {
        let deviation = magnitudeMs2 - baseline

        if !inRep {
            if deviation >= startThresholdMs2 {
                inRep = true
            } else {
                // At rest: let the baseline track gravity drift (slowly).
                baseline += (magnitudeMs2 - baseline) * RepCounter.baselineAlpha
            }
            return
        }

        if deviation > peakRepMagnitudeMs2 {
            peakRepMagnitudeMs2 = deviation
        }
        if deviation <= endThresholdMs2 {
            inRep = false
            let sinceLast = nowMs - lastRepEndMs
            if lastRepEndMs == .min || sinceLast >= refractoryMs {
                repCount += 1
            }
            lastRepEndMs = nowMs
        }
    }
}
