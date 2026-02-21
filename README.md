# 👻 Infinite Adventure

> ⚠️ **WARNING: NEURAL LINK CORRUPTED** ⚠️  
> An AI-powered infinite text adventure game where reality glitches, shadows whisper, and every choice echoes through a haunted digital void. Your consciousness has been trapped in a bizarre corrupted simulation. Can you survive the descent into madness?

![Next.js](https://img.shields.io/badge/Next.js-15-black?style=flat-square&logo=next.js)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?style=flat-square&logo=typescript)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3-38bdf8?style=flat-square&logo=tailwindcss)

## ✨ Features

- 🤖 **AI-Powered Storytelling** - The simulation generates twisted narratives that adapt to your every move
- 💾 **Auto-Save System** - Your corrupted memories persist in the void (Supabase)
- ❤️ **Health System** - Watch your vital signs flicker as reality tears at your sanity
- 🎒 **Inventory Management** - Collect cursed artifacts and forbidden items from the glitched realm
- 🏆 **Achievement System** - Unlock dark secrets as you descend deeper into the corruption
- 👻 **Haunted UI** - Ghostly animations, eerie purple haze, and reality-bending visual effects
- 📱 **Responsive Design** - The nightmare follows you on any device

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ installed
- Supabase account (for game saves)
- OpenAI API key (for story generation)

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd infinite-adventure
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   
   Create a `.env.local` file in the root directory:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   OPENAI_API_KEY=your_openai_api_key
   ```

4. **Set up Supabase database**
   
   Create a `game_saves` table with the following schema:
   ```sql
   CREATE TABLE game_saves (
     session_id TEXT PRIMARY KEY,
     history JSONB,
     hp INTEGER,
     inventory TEXT[],
     location_name TEXT,
     last_updated TIMESTAMP
   );
   ```

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Open your browser**
   
   Navigate to [http://localhost:3000](http://localhost:3000)

## 🎯 How to Play

1. 💀 Click **"ENTER SIMULATION"** to breach the corrupted neural link
2. 📖 Read the twisted narrative as reality warps around you
3. ⚡ Choose your actions carefully - every decision has consequences
4. 🩸 Monitor your vital signs and manage your cursed inventory
5. 💾 Your progress auto-saves in the void... but can you trust it?
6. ☠️ If you die, the simulation resets... or does it?

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) with App Router
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **Database**: [Supabase](https://supabase.com/)
- **AI Integration**: AI SDK for structured outputs
- **Fonts**: Geist Sans & Geist Mono

## 📁 Project Structure

```
infinite-adventure/
├── app/
│   ├── api/
│   │   └── game/          # AI story generation endpoint
│   ├── globals.css        # Global styles and animations
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main game component
├── public/                # Static assets
└── .env.local            # Environment variables (create this)
```

## 🤝 Contributing

We welcome contributions! Here's how you can help:

### Ways to Contribute

- 🐛 **Report bugs** - Open an issue describing the problem
- 💡 **Suggest features** - Share your ideas for improvements
- 📝 **Improve documentation** - Help make the docs clearer
- 🎨 **Enhance UI/UX** - Submit design improvements
- 🔧 **Fix issues** - Pick up an open issue and submit a PR

### Contribution Steps

1. **Fork the repository**
   ```bash
   # Click the 'Fork' button on GitHub
   ```

2. **Clone your fork**
   ```bash
   git clone https://github.com/YOUR_USERNAME/infinite-adventure.git
   cd infinite-adventure
   ```

3. **Create a feature branch**
   ```bash
   git checkout -b feature/your-feature-name
   ```

4. **Make your changes**
   - Write clean, readable code
   - Follow the existing code style
   - Test your changes thoroughly

5. **Commit your changes**
   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

6. **Push to your fork**
   ```bash
   git push origin feature/your-feature-name
   ```

7. **Open a Pull Request**
   - Go to the original repository
   - Click "New Pull Request"
   - Describe your changes clearly
   - Link any related issues

### Commit Convention

We follow conventional commits:

- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation changes
- `style:` - Code style changes (formatting, etc.)
- `refactor:` - Code refactoring
- `test:` - Adding or updating tests
- `chore:` - Maintenance tasks

### Code Style Guidelines

- Use TypeScript for type safety
- Follow React best practices
- Use Tailwind CSS for styling
- Keep components clean and focused
- Add comments for complex logic
- Ensure responsive design

## 📝 License

This project is open source and available under the [MIT License](LICENSE).

## 🙏 Acknowledgments

- Built with [Next.js](https://nextjs.org/)
- Styled with [Tailwind CSS](https://tailwindcss.com/)
- Database by [Supabase](https://supabase.com/)
- Fonts by [Vercel](https://vercel.com/font)

## 📧 Contact

Have questions or suggestions? Feel free to open an issue or reach out!

---

**Enter if you dare... 👻💀🌑**
