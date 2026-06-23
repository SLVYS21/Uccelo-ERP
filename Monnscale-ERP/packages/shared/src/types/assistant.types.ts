/**
 * One turn in the assistant chat history sent to `/assistant/chat`.
 */
export interface AssistantMessage {
  role: 'user' | 'assistant';
  content: string;
}

/**
 * Telemetry entry emitted by an assistant tool invocation. Surfaced on the
 * UI as a small badge above the assistant's reply so users can see what
 * data was consulted.
 */
export interface AssistantToolTrace {
  name: string;
  summary: string;
}

/**
 * Response body of `POST /teams/:slug/assistant/chat`.
 */
export interface AssistantReply {
  reply: string;
  trace?: AssistantToolTrace[];
}
