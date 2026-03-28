# Skills and MCP Configuration

This directory contains imported skills and MCP server configurations from Claude's official marketplace.

## Skills

The following skills are available in `.claude/skills/`:

- **frontend-design**: Create distinctive, production-grade frontend interfaces with high design quality
- **playground**: Create interactive HTML playgrounds with visual controls and live preview
- **agent-development**: Learn how to create custom Claude Code agents
- **skill-development**: Understand skills architecture and development patterns
- **claude-automation-recommender**: Analyze codebases and recommend tailored Claude Code automations
- **claude-md-improver**: Tools to maintain and improve CLAUDE.md files
- **hook-development**: Create custom hooks to prevent unwanted behaviors
- **skill-creator**: Create new skills, improve existing skills, and measure skill performance
- **mcp-integration**: Learn about MCP server integration patterns
- **writing-rules**: Define code style and behavior rules
- **stripe-best-practices**: Best practices for Stripe development
- **agent-deck**: Terminal session manager for AI coding agents (from global config)

## MCP Servers

MCP servers are configured in `.claude/mcp-servers.json`:

### Available MCP Servers

- **playwright**: Browser automation and end-to-end testing (Microsoft)
- **github**: Official GitHub integration for repository management
- **context7**: Upstash Context7 for up-to-date documentation lookup
- **gitlab**: GitLab DevOps platform integration
- **linear**: Linear issue tracking integration
- **supabase**: Supabase backend integration (database, auth, storage)
- **firebase**: Google Firebase backend integration
- **slack**: Slack workspace integration
- **asana**: Asana project management integration
- **stripe**: Stripe development integration
- **greptile**: AI-powered codebase search and understanding
- **serena**: Semantic code analysis through language server protocol
- **laravel-boost**: Laravel development toolkit

### Environment Variables Required

Some MCP servers require environment variables to be set:

- `GITHUB_PERSONAL_ACCESS_TOKEN`: For GitHub MCP
- `GITLAB_MCP_URL` + `GITLAB_PERSONAL_ACCESS_TOKEN`: For GitLab MCP
- `LINEAR_MCP_URL` + `LINEAR_API_KEY`: For Linear MCP
- `SLACK_MCP_URL` + `SLACK_BOT_TOKEN`: For Slack MCP
- `ASANA_MCP_URL` + `ASANA_ACCESS_TOKEN`: For Asana MCP
- `GREPTILE_MCP_URL` + `GREPTILE_API_KEY`: For Greptile MCP

## Configuration

- `enableAllProjectMcpServers: true` - Automatically enable all MCP servers defined in mcp-servers.json
- `skillsDirectory: ".claude/skills"` - Location of skills directory
- `mcpServersFile: ".claude/mcp-servers.json"` - Location of MCP servers configuration

## Usage

Skills are automatically discovered and loaded by Claude Code when relevant to your request. MCP servers need to be configured with appropriate credentials to function.

For more information, see:

- [Claude Skills Documentation](https://docs.anthropic.com/en/docs/agents-and-tools/agent-skills/overview)
- [MCP Documentation](https://modelcontextprotocol.io)
