const fs = require('fs');
const path = require('path');

const envLocalPath = path.join(process.cwd(), '.env.local');
const envExamplePath = path.join(process.cwd(), '.env.example');

if (!fs.existsSync(envLocalPath)) {
  if (fs.existsSync(envExamplePath)) {
    fs.copyFileSync(envExamplePath, envLocalPath);
    console.log('.env.local was missing and has been created from .env.example.');
    console.log('Update it with your real Supabase URL and anon key; Next.js only loads .env.local.');
  } else {
    fs.writeFileSync(envLocalPath, '');
    console.log('.env.local was missing; created an empty file. Please populate the required keys.');
  }
}
