# TradeSense - Prop Trading Platform

[![CI - Tests & Build](https://github.com/lkiwan/tradesense/actions/workflows/ci.yml/badge.svg)](https://github.com/lkiwan/tradesense/actions/workflows/ci.yml)
[![CD - Deploy](https://github.com/lkiwan/tradesense/actions/workflows/cd.yml/badge.svg)](https://github.com/lkiwan/tradesense/actions/workflows/cd.yml)
[![codecov](https://codecov.io/gh/lkiwan/tradesense/branch/main/graph/badge.svg)](https://codecov.io/gh/lkiwan/tradesense)

A comprehensive prop trading platform with challenge management, social trading, and advanced analytics.

## Features

- **Challenge System**: Multi-phase trading challenges with customizable rules
- **Social Trading**: Follow traders, copy trades, share ideas
- **Points & Rewards**: Loyalty program with redeemable rewards
- **Affiliate Program**: Multi-tier affiliate system
- **Real-time Analytics**: Performance tracking and monitoring
- **MT4/MT5 Integration**: Connect trading accounts

## Tech Stack

### Backend
- Python 3.11+ / Flask
- PostgreSQL
- Redis (caching & sessions)
- Celery (background tasks)
- Socket.IO (real-time)

### Frontend
- React 18 + Vite
- TailwindCSS
- Redux Toolkit
- Chart.js / ApexCharts

## Quick Start

### Using Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/lkiwan/tradesense.git
cd tradesense

# Start all services
docker-compose up -d

# View logs
docker-compose logs -f
```

Access the application:
- Frontend: http://localhost
- Backend API: http://localhost:5000
- API Health: http://localhost:5000/api/monitoring/health

### Local Development

#### Backend

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Linux/Mac
venv\Scripts\activate     # Windows

# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env with your configuration

# Run migrations
flask db upgrade

# Start development server
python app.py
```

#### Frontend

```bash
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

## Testing

### Backend Tests

```bash
cd backend
python -m pytest tests/ -v
```

### Frontend Tests

```bash
cd frontend
npm test
```

## CI/CD Pipeline

### Continuous Integration

On every push and pull request:
- Runs backend tests with PostgreSQL and Redis
- Builds frontend production bundle
- Performs security scans (Bandit, Safety)
- Checks code quality (Black, isort, Flake8)

### Continuous Deployment

On push to `main`:
- Builds Docker images
- Pushes to GitHub Container Registry
- Deploys to staging environment

On version tags (`v*`):
- Deploys to production
- Creates GitHub release

## Project Structure

```
tradesense/
├── backend/
│   ├── models/          # Database models
│   ├── routes/          # API endpoints
│   ├── services/        # Business logic
│   ├── middleware/      # Auth, rate limiting
│   ├── tasks/           # Celery tasks
│   └── tests/           # Test suite
├── frontend/
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── pages/       # Page components
│   │   ├── services/    # API services
│   │   └── store/       # Redux store
│   └── dist/            # Production build
├── .github/
│   └── workflows/       # CI/CD pipelines
└── docker-compose.yml   # Docker configuration
```

## Environment Variables

### Backend

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | - |
| `REDIS_URL` | Redis connection string | `redis://localhost:6379/0` |
| `SECRET_KEY` | Flask secret key | - |
| `JWT_SECRET_KEY` | JWT signing key | - |
| `STRIPE_SECRET_KEY` | Stripe API key | - |
| `SENDGRID_API_KEY` | SendGrid API key | - |

### Frontend

| Variable | Description | Default |
|----------|-------------|---------|
| `VITE_API_URL` | Backend API URL | `/api` |

## API Documentation

API endpoints are available at `/api/`:

- `GET /api/monitoring/health` - Health check
- `POST /api/auth/login` - User login
- `GET /api/challenges` - List challenges
- `GET /api/points/balance` - Points balance

For full API documentation, see [docs/API.md](docs/API.md).

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is proprietary software. All rights reserved.

## Support

For support, email support@tradesense.com or open an issue.
