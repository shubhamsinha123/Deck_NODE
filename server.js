const dotenv = require('dotenv');

dotenv.config();

const app = require('./src/App');
const { connectDB } = require('./src/config/database');
const { PORT, ENV } = require('./src/config/environment');

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT} in ${ENV} mode`);
  });
});
