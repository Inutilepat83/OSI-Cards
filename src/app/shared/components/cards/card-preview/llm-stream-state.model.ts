export type LlmStreamStage = 'idle' | 'thinking' | 'streaming' | 'complete' | 'aborted' | 'error';

export interface LlmStreamState {
  /**
   * True whenever we are simulating a streaming LLM response.
   */
  isSimulating: boolean;
  /**
   * Current stage, used to drive the preview UI (thinking border, streaming overlay, etc.).
   */
  stage: LlmStreamStage;
  /**
   * Normalized progress between 0 and 1 based on characters flushed to the editor.
   */
  progress: number;
  /**
   * Raw character count already streamed to the TOON editor.
   */
  tokensPushed: number;
  /**
   * Total character count captured at the start of the simulation.
   */
  totalTokens: number;
  /**
   * Short descriptive status message for tooltips/ARIA labels.
   */
  statusLabel: string;
  /**
   * Optional user-facing hint describing current blocking reason (e.g., waiting for parser).
   */
  hint?: string;
  /**
   * Optional error message when the simulation fails.
   */
  error?: string;
}
