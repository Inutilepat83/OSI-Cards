/**
 * Video Utilities
 *
 * Utilities for video playback and manipulation.
 *
 * @example
 * ```typescript
 * import { createVideoPlayer, captureFrame } from '@osi-cards/utils';
 *
 * const player = createVideoPlayer('/video.mp4');
 * const frame = await captureFrame(player, 5);
 * ```
 */

export interface VideoOptions {
  autoplay?: boolean;
  loop?: boolean;
  muted?: boolean;
  controls?: boolean;
  width?: number;
  height?: number;
  playbackRate?: number;
}

/**
 * Create video element
 */
export function createVideoPlayer(src: string, options: VideoOptions = {}): HTMLVideoElement {
  const video = document.createElement('video');
  video.src = src;

  if (options.autoplay) video.autoplay = true;
  if (options.loop) video.loop = true;
  if (options.muted) video.muted = true;
  if (options.controls) video.controls = true;
  if (options.width) video.width = options.width;
  if (options.height) video.height = options.height;
  if (options.playbackRate) video.playbackRate = options.playbackRate;

  return video;
}

/**
 * Play video
 */
export async function playVideo(video: HTMLVideoElement): Promise<void> {
  await video.play();
}

/**
 * Pause video
 */
export function pauseVideo(video: HTMLVideoElement): void {
  video.pause();
}

/**
 * Stop video
 */
export function stopVideo(video: HTMLVideoElement): void {
  video.pause();
  video.currentTime = 0;
}

/**
 * Seek to time
 */
export function seekTo(video: HTMLVideoElement, seconds: number): void {
  video.currentTime = seconds;
}

/**
 * Get video duration
 */
export async function getVideoDuration(src: string): Promise<number> {
  const video = document.createElement('video');
  video.src = src;

  return new Promise((resolve, reject) => {
    video.addEventListener('loadedmetadata', () => {
      resolve(video.duration);
    });
    video.addEventListener('error', reject);
  });
}

/**
 * Capture frame from video
 */
export async function captureFrame(video: HTMLVideoElement, atSeconds?: number): Promise<string> {
  if (atSeconds !== undefined) {
    video.currentTime = atSeconds;
    await new Promise((resolve) => video.addEventListener('seeked', resolve, { once: true }));
  }

  const canvas = document.createElement('canvas');
  canvas.width = video.videoWidth;
  canvas.height = video.videoHeight;

  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas context not available');

  ctx.drawImage(video, 0, 0);
  return canvas.toDataURL();
}

/**
 * Set playback rate
 */
export function setPlaybackRate(video: HTMLVideoElement, rate: number): void {
  video.playbackRate = Math.max(0.25, Math.min(4, rate));
}

/**
 * Set volume
 */
export function setVideoVolume(video: HTMLVideoElement, volume: number): void {
  video.volume = Math.max(0, Math.min(1, volume));
}

/**
 * Mute video
 */
export function muteVideo(video: HTMLVideoElement): void {
  video.muted = true;
}

/**
 * Unmute video
 */
export function unmuteVideo(video: HTMLVideoElement): void {
  video.muted = false;
}

/**
 * Toggle mute
 */
export function toggleMute(video: HTMLVideoElement): void {
  video.muted = !video.muted;
}

/**
 * Is playing
 */
export function isPlaying(video: HTMLVideoElement): boolean {
  return !video.paused && !video.ended && video.readyState > 2;
}

/**
 * Get video info
 */
export function getVideoInfo(video: HTMLVideoElement): {
  duration: number;
  currentTime: number;
  buffered: number;
  volume: number;
  muted: boolean;
  paused: boolean;
  ended: boolean;
} {
  return {
    duration: video.duration,
    currentTime: video.currentTime,
    buffered: video.buffered.length > 0 ? video.buffered.end(0) : 0,
    volume: video.volume,
    muted: video.muted,
    paused: video.paused,
    ended: video.ended,
  };
}
