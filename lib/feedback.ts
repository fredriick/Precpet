// Haptic and sound feedback utilities

import { getUserSettings } from "./storage"

// Haptic feedback types
type HapticType = "light" | "medium" | "heavy" | "success" | "error"

// Sound effect types
type SoundType = "click" | "success" | "achievement" | "streak" | "bookmark"

/**
 * Trigger haptic feedback if enabled in settings
 */
export function triggerHaptic(type: HapticType = "light"): void {
    const settings = getUserSettings()
    if (!settings.hapticFeedback) return

    // Check if Vibration API is supported
    if (typeof window === "undefined" || !("vibrate" in navigator)) return

    try {
        switch (type) {
            case "light":
                navigator.vibrate(10)
                break
            case "medium":
                navigator.vibrate(20)
                break
            case "heavy":
                navigator.vibrate(30)
                break
            case "success":
                navigator.vibrate([10, 50, 10])
                break
            case "error":
                navigator.vibrate([20, 100, 20])
                break
        }
    } catch (error) {
        console.warn("Haptic feedback failed:", error)
    }
}

/**
 * Play sound effect if enabled in settings
 */
export function playSound(type: SoundType): void {
    const settings = getUserSettings()
    if (!settings.soundEffects) return

    // Check if Web Audio API is supported
    if (typeof window === "undefined" || !("AudioContext" in window || "webkitAudioContext" in window)) return

    try {
        const AudioContext = window.AudioContext || (window as any).webkitAudioContext
        const audioContext = new AudioContext()
        const oscillator = audioContext.createOscillator()
        const gainNode = audioContext.createGain()

        oscillator.connect(gainNode)
        gainNode.connect(audioContext.destination)

        // Configure sound based on type
        switch (type) {
            case "click":
                oscillator.frequency.value = 800
                gainNode.gain.value = 0.1
                oscillator.start()
                oscillator.stop(audioContext.currentTime + 0.05)
                break

            case "success":
                oscillator.frequency.value = 523.25 // C5
                gainNode.gain.value = 0.2
                oscillator.start()
                oscillator.stop(audioContext.currentTime + 0.15)
                break

            case "achievement":
                // Play a cheerful ascending tone
                oscillator.frequency.value = 523.25 // C5
                gainNode.gain.value = 0.3
                oscillator.start()
                setTimeout(() => {
                    oscillator.frequency.value = 659.25 // E5
                }, 100)
                setTimeout(() => {
                    oscillator.frequency.value = 783.99 // G5
                }, 200)
                oscillator.stop(audioContext.currentTime + 0.4)
                break

            case "streak":
                oscillator.frequency.value = 659.25 // E5
                gainNode.gain.value = 0.25
                oscillator.start()
                oscillator.stop(audioContext.currentTime + 0.2)
                break

            case "bookmark":
                oscillator.frequency.value = 440 // A4
                gainNode.gain.value = 0.15
                oscillator.start()
                oscillator.stop(audioContext.currentTime + 0.1)
                break
        }
    } catch (error) {
        console.warn("Sound playback failed:", error)
    }
}

/**
 * Combined feedback for important actions
 */
export function celebratoryFeedback(): void {
    triggerHaptic("success")
    playSound("achievement")
}

/**
 * Quick feedback for UI interactions
 */
export function interactionFeedback(): void {
    triggerHaptic("light")
    playSound("click")
}
