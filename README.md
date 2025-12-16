# AI Dev Orchestrator

AI-powered development orchestrator with multi-agent planning, task management, and Google Tasks synchronization.

## Features

- 🤖 **8 Specialized AI Agents** - Project Manager, Research, Architecture, Frontend, Backend, DevOps, QA, Orchestrator
- 📋 **Task Management** - Complete workflow from ideation to deployment
- 🔄 **Google Tasks Sync** - Automatic bidirectional synchronization
- 🎯 **Agent Assignment** - Smart task routing to specialized agents
- 📊 **Real-time Monitoring** - Track agent activity and task progress
- 🔐 **Azure SQL Database** - Production-ready data storage
- 🌐 **MCP Integration** - Model Context Protocol for external tools

## Quick Start

### Prerequisites

- Node.js 20.19+ or 22.12+
- Azure SQL Database
- Google account (for Tasks sync)
- Dev MCP Server

### Installation

```bash
# Clone repository
git clone https://github.com/YOUR_USERNAME/ai-dev-orchestrator.git
cd ai-dev-orchestrator

# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your credentials

# Setup Google Tasks
npm run setup:google-tasks

# Start development server
npm run dev
```

## Documentation

- **[Deployment Guide](DEPLOYMENT_GUIDE.md)** - Complete deployment instructions
- **[Google Tasks Integration](GOOGLE_TASKS_INTEGRATION.md)** - Sync setup and usage
- **[Phase 2 Complete](PHASE2_COMPLETE.md)** - Azure SQL setup
- **[Phase 3 Summary](PHASE3_IMPLEMENTATION_SUMMARY.md)** - Google Tasks implementation
- **[Quick Start](QUICK_START_GOOGLE_TASKS.md)** - 3-step setup guide

## Architecture

```
┌──────────────────────────────────────┐
│     AI Dev Orchestrator (Port 3001)  │
│  ┌────────────────────────────────┐  │
│  │  Web Dashboard                 │  │
│  │  • Projects                    │  │
│  │  • Tasks (with approval UI)    │  │
│  │  │  • Agents                    │  │
│  └────────────────────────────────┘  │
│             ↓                         │
│  ┌────────────────────────────────┐  │
│  │  Planning Agents (DeepSeek)    │  │
│  │  • 8 specialized agents        │  │
│  │  • Research (Perplexity)       │  │
│  └────────────────────────────────┘  │
│             ↓                         │
│  ┌────────────────────────────────┐  │
│  │  Task Export Service           │  │
│  │  • Generates task specs        │  │
│  │  • Exports to .tasks/queue/    │  │
│  └────────────────────────────────┘  │
│             ↓                         │
│  ┌────────────────────────────────┐  │
│  │  Google Tasks Sync             │  │
│  │  • Auto-sync every 15 min      │  │
│  │  • Agent mapping in notes      │  │
│  └────────────────────────────────┘  │
└──────────────────────────────────────┘
             ↓
┌──────────────────────────────────────┐
│  Azure SQL Database                  │
│  • 8 Aether agents                   │
│  • Projects, modules, tasks          │
│  • Agent activity logs               │
└──────────────────────────────────────┘
             ↓
┌──────────────────────────────────────┐
│  Google Tasks                        │
│  • Synced tasks with agent info      │
│  • Status updates                    │
└──────────────────────────────────────┘
```

## Scripts

```bash
# Development
npm run dev              # Start development server
npm run build            # Build for production
npm run start            # Start production server

# Google Tasks
npm run setup:google-tasks   # Configure Google Tasks integration
npm run test:google-tasks    # Test sync functionality

# Database
npm run verify:schema    # Verify Azure SQL schema deployment

# Code Quality
npm run check            # TypeScript type checking
npm run format           # Format code with Prettier
npm run test             # Run tests
```

## Environment Variables

```env
# Database
DATABASE_URL=Server=tcp:aether-orch-897256.database.windows.net,1433;...

# Project
AETHER_PROJECT_PATH=/Users/abedmreyan/Desktop/aether_-foundation

# MCP Server
MCP_SERVER_PATH=/Users/abedmreyan/Desktop/MCP Servers/Dev MCP 

# AI Services
DEEPSEEK_API_KEY=your-key-here
PERPLEXITY_API_KEY=your-key-here

# Google Tasks
GOOGLE_TASKS_LIST_ID=your-list-id
GOOGLE_TASKS_SYNC_INTERVAL=15
GOOGLE_TASKS_AUTO_SYNC=true

# Server
PORT=3001
NODE_ENV=development
```

## Deployment

See [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md) for complete instructions.

### Quick Deploy

1. **Azure SQL Schema**:
   - Deploy `schema-azure.sql` via Azure Portal
   - Verify with `npm run verify:schema`

2. **Frontend (Netlify)**:
   ```bash
   netlify deploy --prod --dir=dist/client
   ```

3. **Backend (Azure App Service)**:
   ```bash
   az webapp create --name aether-orchestrator-api ...
   az webapp deployment source config-zip ...
   ```

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, shadcn/ui, tRPC
- **Backend**: Node.js, Express, tRPC, Drizzle ORM
- **Database**: Azure SQL Server
- **AI**: DeepSeek (planning), Perplexity (research)
- **Integration**: MCP (Model Context Protocol), Google Tasks API
- **Deployment**: Netlify (frontend), Azure App Service (backend)

## Project Structure

```
ai_dev_orchestrator/
├── client/              # Frontend React app
│   ├── src/
│   │   ├── pages/      # Page components
│   │   ├── components/ # UI components
│   │   └── lib/        # Utilities
│   └── index.html
├── server/              # Backend Node.js app
│   ├── _core/          # Core server logic
│   ├── agents/         # AI agent implementations
│   ├── mcp/            # MCP client
│   ├── routers/        # tRPC routers
│   └── services/       # Business logic
├── scripts/             # Utility scripts
├── drizzle/             # Database schema
└── shared/              # Shared types
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests and type checking
5. Submit a pull request

## License

MIT

## Support

For issues and questions:
- Check [DEPLOYMENT_GUIDE.md](DEPLOYMENT_GUIDE.md)
- Review [GOOGLE_TASKS_INTEGRATION.md](GOOGLE_TASKS_INTEGRATION.md)
- Open an issue on GitHub

---

**Status**: Production Ready ✅  
**Version**: 1.0.0  
**Last Updated**: December 16, 2025

