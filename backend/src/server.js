import app from './app.js';
import { connectDB } from './config/db.js';
import { ENV } from './config/env.js';
import { seedInitialDataIfEmpty } from './seed/seedData.js';

const startServer = async () => {
  try {
    console.log('🚀 Booting College ERP Backend Server...');
    await connectDB();

    // Automatically check and seed sample data if database has no admin
    await seedInitialDataIfEmpty();

    app.listen(ENV.PORT, () => {
      console.log(`==================================================`);
      console.log(`🎓 College ERP Backend is running!`);
      console.log(`📍 Local URL: http://localhost:${ENV.PORT}`);
      console.log(`⚡ Health Check: http://localhost:${ENV.PORT}/api/health`);
      console.log(`🛠️ Environment: ${ENV.NODE_ENV}`);
      console.log(`==================================================`);
    });
  } catch (error) {
    console.error('Fatal error starting server:', error);
    process.exit(1);
  }
};

startServer();
