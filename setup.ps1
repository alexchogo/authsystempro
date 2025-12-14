# AuthSystemPro Setup Script

Write-Host "🚀 Setting up AuthSystemPro..." -ForegroundColor Cyan

# Check if .env exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found!" -ForegroundColor Yellow
    Write-Host "Please create a .env file with the following configuration:" -ForegroundColor White
    Write-Host ""
    Write-Host "Required variables:" -ForegroundColor Yellow
    Write-Host "   - DATABASE_URL: Your PostgreSQL connection string" -ForegroundColor White
    Write-Host "   - REDIS_URL: Your Redis connection string" -ForegroundColor White
    Write-Host "   - Email provider: Either SMTP credentials or RESEND_API_KEY" -ForegroundColor White
    Write-Host "   - NEXT_PUBLIC_APP_URL: Your application URL" -ForegroundColor White
    Write-Host ""
    Write-Host "Example .env file content:" -ForegroundColor Cyan
    Write-Host 'DATABASE_URL="postgresql://user:password@localhost:5432/authsystempro"' -ForegroundColor Gray
    Write-Host 'REDIS_URL="redis://localhost:6379"' -ForegroundColor Gray
    Write-Host 'SMTP_HOST="smtp.gmail.com"' -ForegroundColor Gray
    Write-Host 'SMTP_PORT=587' -ForegroundColor Gray
    Write-Host 'SMTP_USER="your-email@gmail.com"' -ForegroundColor Gray
    Write-Host 'SMTP_PASS="your-app-password"' -ForegroundColor Gray
    Write-Host 'NEXT_PUBLIC_APP_URL="http://localhost:3000"' -ForegroundColor Gray
    Write-Host ""
    Read-Host "Press Enter after creating .env file to continue"
    
    if (-not (Test-Path ".env")) {
        Write-Host "❌ .env file still not found. Exiting." -ForegroundColor Red
        exit 1
    }
}

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Cyan
npm install

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
    exit 1
}

# Generate Prisma Client
Write-Host "🔧 Generating Prisma Client..." -ForegroundColor Cyan
npx prisma generate

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Failed to generate Prisma Client" -ForegroundColor Red
    exit 1
}

# Run migrations
Write-Host "🗄️  Running database migrations..." -ForegroundColor Cyan
npx prisma migrate dev --name init

if ($LASTEXITCODE -ne 0) {
    Write-Host "⚠️  Migration failed. Please check your DATABASE_URL" -ForegroundColor Yellow
    Write-Host "   You can run 'npx prisma migrate dev' manually after fixing the connection" -ForegroundColor White
} else {
    Write-Host "✅ Database migrations completed" -ForegroundColor Green
}

Write-Host ""
Write-Host "✨ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To start the development server, run:" -ForegroundColor Cyan
Write-Host "   npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "Then open http://localhost:3000 in your browser" -ForegroundColor Cyan
