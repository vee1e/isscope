# IsScope

**Project Purpose:** IssueScope is a tool for triaging GitHub issues using AI. It analyzes issues to determine their implementation difficulty, required skills, and overall doability, helping contributors find the right issues to work on.

<img width="2926" height="1818" alt="image" src="https://github.com/user-attachments/assets/80342f95-ad14-4351-a6e5-cd50f2ff5763" />

## Tech Stack

This project is built using modern web technologies:

- **Frontend Framework:** React 19 + Vite
- **Language:** TypeScript
- **Styling:** Tailwind CSS v4
- **State Management:** Zustand
- **Data Fetching:** React Query
- **Animation:** Framer Motion
- **Package Manager:** Bun

## Features

- **AI Analysis**: Automatically analyzes issues to estimate complexity, required skills, and newcomer friendliness.
- **Doability Scoring**: Ranks issues based on a calculated score (0-100) indicating how actionable and feasible they are.
- **Parallel Processing**: Fetches issue details and performs AI analysis in parallel for high throughput.
- **Rich Markdown Support**: Renders issue bodies and comments with full Markdown and HTML image support.
- **Keyboard Navigation**: Vim-style navigation (j/k, gg, G) and keyboard shortcuts for efficiency.
- **Local Privacy**: API keys are stored in memory and never sent to a backend server.

## Local Setup Instructions

These instructions have been tested on a clean machine to ensure a reliable setup.

1. **Prerequisites:** Make sure you have [Bun](https://bun.sh/) installed on your machine.
2. **Clone the repository:**

   ```bash
   git clone https://github.com/vee1e/isscope.git
   cd isscope
   ```

3. **Install dependencies:**

   ```bash
   bun install
   ```

4. **Environment Variables (Optional):**
   Copy the example environment file if you wish to configure default keys (though they can be entered in the UI):

   ```bash
   cp .env.example .env
   ```

   _(Create `.env.example` with `VITE_GITHUB_TOKEN=` and `VITE_OPENROUTER_API_KEY=` if needed)._

5. **Start the development server:**
   ```bash
   bun dev
   ```
   The application will be available at `http://localhost:5173`.

## Configuration

The application requires API keys to function. You can configure these directly in the UI upon launching the application.

- **OpenRouter API Key**: Required for AI analysis.
- **GitHub Token**: Optional, but recommended for higher API rate limits.

## Usage

1. Enter a GitHub repository (e.g., `owner/repo`) or a full URL in the input field.
2. Click "Configure API Keys" to enter your credentials if you haven't already.
3. Start the analysis.
4. Browse the ranked list of issues.
5. Select an issue to view its full details, including the AI-generated summary and implementation advice.

## Contributing

Contributions are welcome! Please read our [Contribution Guidelines](CONTRIBUTING.md) for details on our code of conduct, pull request process, commit messages, and coding standards.

1. Fork the repository.
2. Create a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes following Conventional Commits (`git commit -m 'feat: add amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

## Contact Channel

If you have questions, suggestions, or need support, please:

- Open an issue in the [GitHub Issue Tracker](https://github.com/vee1e/isscope/issues).
- Reach out to the maintainer on Discord at `@vei1e`.

## License

This project is licensed under the GNU General Public License v3.0 - see the LICENSE file for details.
