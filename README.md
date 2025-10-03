# Pebbles

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/alexisbohns/pebbles)

Pebbles is a small experimental app inspired by **Beck’s cognitive columns** (CBT) and the work of James Clear (_Atomic Habits_) and Daniel Kahneman (_Thinking, Fast and Slow_).  
The goal is to provide a simple, accessible tool to **identify automatic thoughts**, connect them to emotions and behaviors, and reframe them with more helpful alternatives.

## 🚀 Current features

- Add a situation, automatic thought, emotion, behavior, and alternative thought.
- Local data persistence in the browser (**localStorage**, no account required).
- Reactive history (entries update instantly).
- Delete entries.

## 🛠️ Tech stack

- [SvelteKit](https://kit.svelte.dev/)
- Local persistence via `localStorage`
- Deployment with [Vercel](https://vercel.com/)

## 📦 Setup & development

Clone the repo and install dependencies:

```bash
git clone https://github.com/alexisbohns/pebbles.git
cd pebbles
npm install
npm run dev
```

Then open http://localhost:5173.

## 🌱 Roadmap

- Improve the UI (Tailwind/Skeleton).
- Add tags/themes to categorize entries.
- Guided suggestions (cognitive biases, reframing).
- Accounts and multi-device sync with Supabase.
