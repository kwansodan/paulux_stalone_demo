import bcrypt from 'bcrypt';

const SALTROUNDS = 10;

async function main() {
    const password = "AdminPass123!";
    const hash = await bcrypt.hash(password, SALTROUNDS);
    console.log(`Password: ${password}`);
    console.log(`Hash: ${hash}`);
}

main();
