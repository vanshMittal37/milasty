import dotenv from 'dotenv';
dotenv.config();

console.log('ENV KEYS:', Object.keys(process.env).filter(k => !k.startsWith('npm_') && !k.startsWith('Program') && !k.startsWith('System')));
console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'PRESENT' : 'NOT PRESENT');
console.log('POSTGRES_URL:', process.env.POSTGRES_URL ? 'PRESENT' : 'NOT PRESENT');
