#!/bin/bash
# CV Builder Startup Script

echo "🚀 Starting CV Builder Application..."

# Navigate to project directory
cd /workspaces/codespaces-express/cv-builder

# Check if PM2 is installed
if ! command -v pm2 &> /dev/null; then
    echo "📦 Installing PM2..."
    npm install -g pm2
fi

# Stop any existing instance
pm2 delete cv-builder 2>/dev/null || true

# Start the application
PORT=3001 pm2 start server.js --name cv-builder

# Display status
pm2 status

echo ""
echo "✅ CV Builder is now running!"
echo "🌐 Access at: http://localhost:3001"
echo ""
echo "📝 Useful commands:"
echo "  pm2 logs cv-builder    - View logs"
echo "  pm2 restart cv-builder - Restart app"
echo "  pm2 stop cv-builder    - Stop app"
echo "  pm2 status             - Check status"
