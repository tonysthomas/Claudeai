# ai — Claude with automatic free fallback

Type `ai` instead of `claude`. If your Claude usage limit is reached, it switches to a free AI tool automatically.
Free tools picked from [awesome-free-ai-tools](https://github.com/mdruhulkuddus/awesome-free-ai-tools).

| Command | What happens |
|---|---|
| `ai` | Opens Claude. If limited (at start or when you exit after hitting the limit) → opens free tool |
| `ai "write a 5-question quiz on GOwalk"` | Asks Claude; if limited, same prompt goes to free tool |
| `ai --free` | Skip Claude, go straight to the free tool |

Fallback order: **OpenCode → Aider → Ollama** (first one installed is used).

## Setup (one time, ~10 min)

Works on Mac, Linux, or Windows via WSL / Git Bash.

**1. Install the script**
```bash
mkdir -p ~/bin && cp ai-fallback/ai ~/bin/ai && chmod +x ~/bin/ai
```
```bash
echo 'export PATH="$HOME/bin:$PATH"' >> ~/.bashrc && source ~/.bashrc
```
(Use `~/.zshrc` on Mac.)

**2. Get a free API key** — Google AI Studio (Gemini, 1,500 requests/day free, no card): https://aistudio.google.com/apikey
```bash
echo 'export GEMINI_API_KEY="paste-key-here"' >> ~/.bashrc && source ~/.bashrc
```

**3. Install the free tool** — OpenCode (closest to Claude Code experience):
```bash
curl -fsSL https://opencode.ai/install | bash
```
Run `opencode` once, type `/models`, pick a Gemini model.

**Optional — fully offline, unlimited:** install [Ollama](https://ollama.com), then:
```bash
ollama pull qwen2.5-coder:7b
```

## Free options compared

| Tool | Free limit | Best for | Catch |
|---|---|---|---|
| Gemini API (via OpenCode) | 1,500 req/day (Flash) | Daily work, long docs (1M context) | Data may be used for training on free tier |
| Groq | 14,400 req/day | Fast answers | Smaller models |
| OpenRouter `:free` | ~200 req/day | Trying many models with one key | Low daily cap |
| Ollama (local) | Unlimited | Confidential content | Needs a decent laptop; weaker than Claude |

> ⚠️ Don't paste confidential Skechers data (sales figures, staff info) into free cloud tiers — use Ollama for that.

## Settings (optional)
```bash
export AI_FALLBACK="opencode ollama"           # change order
export OLLAMA_MODEL="llama3.2"                  # local model
export AIDER_MODEL="groq/llama-3.3-70b-versatile"
```

## Notes
- The limit check sends one tiny "Reply with OK" message to Claude, which uses a negligible amount of usage.
- Project instructions in `CLAUDE.md` are not read by every tool — copy them to `AGENTS.md` so OpenCode picks them up.
