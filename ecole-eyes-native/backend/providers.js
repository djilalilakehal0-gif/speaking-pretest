// Provider adapters for the école eyes proxy (unit-tested in test/providers.test.js).
//
// The app always speaks one protocol (Messages-style JSON: system, messages with text / image / tool_use /
// tool_result blocks, tools with input_schema). The proxy forwards it unchanged to Anthropic, or translates it
// for any OpenAI-compatible Chat Completions API (OpenAI, Mistral, Groq, OpenRouter, self-hosted vLLM/Ollama...),
// so the app is not locked to one provider. The chosen model must support images and tool calling.

/** Request: app format -> OpenAI Chat Completions. */
export function toOpenAI(body, model) {
  const messages = [];
  if (body.system) messages.push({ role: 'system', content: body.system });
  for (const m of body.messages) {
    const blocks = typeof m.content === 'string' ? [{ type: 'text', text: m.content }] : (m.content || []);
    if (m.role === 'assistant') {
      const text = blocks.filter((b) => b.type === 'text').map((b) => b.text).join('\n');
      const calls = blocks.filter((b) => b.type === 'tool_use').map((b) => ({
        id: b.id, type: 'function', function: { name: b.name, arguments: JSON.stringify(b.input ?? {}) },
      }));
      const out = { role: 'assistant', content: text || null };
      if (calls.length) out.tool_calls = calls;
      messages.push(out);
      continue;
    }
    // user turn: tool results become "tool" messages; any images they carry follow in a user message
    // (Chat Completions tool messages are text-only).
    const pending = [];
    for (const b of blocks) {
      if (b.type === 'tool_result') {
        const parts = typeof b.content === 'string' ? [{ type: 'text', text: b.content }] : (b.content || []);
        const text = parts.filter((p) => p.type === 'text').map((p) => p.text).join('\n') || (b.is_error ? 'error' : 'ok');
        messages.push({ role: 'tool', tool_call_id: b.tool_use_id, content: b.is_error ? `ERROR: ${text}` : text });
        for (const p of parts) if (p.type === 'image') pending.push(imagePart(p));
      } else if (b.type === 'text') pending.push({ type: 'text', text: b.text });
      else if (b.type === 'image') pending.push(imagePart(b));
    }
    if (pending.length) {
      if (pending.every((p) => p.type === 'text')) messages.push({ role: 'user', content: pending.map((p) => p.text).join('\n') });
      else messages.push({ role: 'user', content: pending.some((p) => p.type === 'text') ? pending : [{ type: 'text', text: 'Image from the phone camera:' }, ...pending] });
    }
  }
  const out = { model, messages, max_tokens: body.max_tokens };
  if (typeof body.temperature === 'number') out.temperature = body.temperature;
  if (Array.isArray(body.tools) && body.tools.length) {
    out.tools = body.tools.map((t) => ({ type: 'function', function: { name: t.name, description: t.description, parameters: t.input_schema ?? { type: 'object', properties: {} } } }));
  }
  return out;
}

function imagePart(b) {
  const s = b.source || {};
  const url = s.type === 'base64' ? `data:${s.media_type || 'image/jpeg'};base64,${s.data}` : s.url;
  return { type: 'image_url', image_url: { url } };
}

/** Response: OpenAI Chat Completions -> app format. */
export function fromOpenAI(resp) {
  const choice = resp?.choices?.[0];
  if (!choice) return { type: 'error', error: { type: 'api_error', message: 'empty provider response' } };
  const msg = choice.message || {};
  const content = [];
  if (typeof msg.content === 'string' && msg.content.trim()) content.push({ type: 'text', text: msg.content });
  for (const c of msg.tool_calls || []) {
    let input = {};
    try { input = c.function?.arguments ? JSON.parse(c.function.arguments) : {}; } catch { input = {}; }
    content.push({ type: 'tool_use', id: c.id, name: c.function?.name, input });
  }
  const stop = { stop: 'end_turn', tool_calls: 'tool_use', length: 'max_tokens', content_filter: 'refusal' }[choice.finish_reason]
    || (content.some((b) => b.type === 'tool_use') ? 'tool_use' : 'end_turn');
  return { type: 'message', role: 'assistant', content, stop_reason: stop };
}

/** Maps provider error bodies to the app's error shape (status is passed through unchanged). */
export function errorFromOpenAI(status, body) {
  const type = status === 401 || status === 403 ? 'authentication_error' : status === 429 ? 'rate_limit_error' : status >= 500 ? 'api_error' : 'invalid_request_error';
  return { type: 'error', error: { type, message: body?.error?.message ? String(body.error.message).slice(0, 300) : `provider error ${status}` } };
}
