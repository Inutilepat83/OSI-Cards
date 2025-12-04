/**
 * Audio Utilities
 *
 * Utilities for audio playback, recording, and manipulation.
 *
 * @example
 * ```typescript
 * import { playAudio, recordAudio } from '@osi-cards/utils';
 *
 * await playAudio('/sounds/notification.mp3');
 * const recording = await recordAudio(5000);
 * ```
 */

export interface AudioOptions {
  volume?: number;
  loop?: boolean;
  playbackRate?: number;
  autoplay?: boolean;
}

export interface RecordingOptions {
  mimeType?: string;
  audioBitsPerSecond?: number;
}

/**
 * Play audio from URL
 */
export async function playAudio(
  url: string,
  options: AudioOptions = {}
): Promise<HTMLAudioElement> {
  const audio = new Audio(url);

  if (options.volume !== undefined) audio.volume = options.volume;
  if (options.loop !== undefined) audio.loop = options.loop;
  if (options.playbackRate !== undefined) audio.playbackRate = options.playbackRate;
  if (options.autoplay) audio.autoplay = true;

  await audio.play();
  return audio;
}

/**
 * Stop audio
 */
export function stopAudio(audio: HTMLAudioElement): void {
  audio.pause();
  audio.currentTime = 0;
}

/**
 * Pause audio
 */
export function pauseAudio(audio: HTMLAudioElement): void {
  audio.pause();
}

/**
 * Resume audio
 */
export async function resumeAudio(audio: HTMLAudioElement): Promise<void> {
  await audio.play();
}

/**
 * Set audio volume
 */
export function setVolume(audio: HTMLAudioElement, volume: number): void {
  audio.volume = Math.max(0, Math.min(1, volume));
}

/**
 * Fade in audio
 */
export function fadeIn(audio: HTMLAudioElement, duration = 1000): void {
  audio.volume = 0;
  const steps = 20;
  const increment = 1 / steps;
  const stepDuration = duration / steps;

  let currentStep = 0;
  const interval = setInterval(() => {
    currentStep++;
    audio.volume = Math.min(1, currentStep * increment);

    if (currentStep >= steps) {
      clearInterval(interval);
    }
  }, stepDuration);
}

/**
 * Fade out audio
 */
export function fadeOut(audio: HTMLAudioElement, duration = 1000): void {
  const startVolume = audio.volume;
  const steps = 20;
  const decrement = startVolume / steps;
  const stepDuration = duration / steps;

  let currentStep = 0;
  const interval = setInterval(() => {
    currentStep++;
    audio.volume = Math.max(0, startVolume - currentStep * decrement);

    if (currentStep >= steps) {
      clearInterval(interval);
      stopAudio(audio);
    }
  }, stepDuration);
}

/**
 * Record audio
 */
export async function recordAudio(
  durationMs: number,
  options: RecordingOptions = {}
): Promise<Blob> {
  const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
  const mediaRecorder = new MediaRecorder(stream, options);
  const chunks: Blob[] = [];

  return new Promise((resolve, reject) => {
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      const blob = new Blob(chunks, { type: mediaRecorder.mimeType });
      stream.getTracks().forEach((track) => track.stop());
      resolve(blob);
    };

    mediaRecorder.onerror = reject;

    mediaRecorder.start();
    setTimeout(() => mediaRecorder.stop(), durationMs);
  });
}

/**
 * Get audio duration
 */
export async function getAudioDuration(url: string): Promise<number> {
  const audio = new Audio(url);

  return new Promise((resolve, reject) => {
    audio.addEventListener('loadedmetadata', () => {
      resolve(audio.duration);
    });
    audio.addEventListener('error', reject);
  });
}

/**
 * Create audio context
 */
export function createAudioContext(): AudioContext {
  return new (window.AudioContext || (window as any).webkitAudioContext)();
}

/**
 * Load audio buffer
 */
export async function loadAudioBuffer(
  audioContext: AudioContext,
  url: string
): Promise<AudioBuffer> {
  const response = await fetch(url);
  const arrayBuffer = await response.arrayBuffer();
  return await audioContext.decodeAudioData(arrayBuffer);
}

/**
 * Play audio buffer
 */
export function playAudioBuffer(
  audioContext: AudioContext,
  buffer: AudioBuffer
): AudioBufferSourceNode {
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(audioContext.destination);
  source.start();
  return source;
}
