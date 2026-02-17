# IssueScope

IssueScope is a tool for triaging GitHub issues using AI. It analyzes issues to determine their implementation difficulty, required skills, and overall doability, helping contributors find the right issues to work on.

## Features

- **AI Analysis**: Automatically analyzes issues to estimate complexity, required skills, and newcomer friendliness.
- **Doability Scoring**: Ranks issues based on a calculated score (0-100) indicating how actionable and feasible they are.
- **Parallel Processing**: Fetches issue details and performs AI analysis in parallel for high throughput.
- **Rich Markdown Support**: Renders issue bodies and comments with full Markdown and HTML image support.
- **Keyboard Navigation**: Vim-style navigation (j/k, gg, G) and keyboard shortcuts for efficiency.
- **Local Privacy**: API keys are stored in memory and never sent to a backend server.

## Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/vee1e/isscope.git
   cd isscope
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Start the development server:
   ```bash
   bun dev
   ```

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

Contributions are welcome. Please follow these steps:

1. Fork the repository.
2. Create time a feature branch (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add some amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.

Please ensure your code follows the existing style and conventions.

## License

This project is licensed under the GNU General Public License v3.0 - see the LICENSE file for details.
