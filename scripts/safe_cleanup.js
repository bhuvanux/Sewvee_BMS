const admin = require('firebase-admin');
const readline = require('readline');

// CONFIGURATION
// You must set this to your service account key path
// OR run this in an environment with GOOGLE_APPLICATION_CREDENTIALS set
const SERVICE_ACCOUNT_PATH = './service-account.json';

// COLLECTIONS TO DELETE (Legacy Production)
const TARGET_COLLECTIONS = [
    'customers',
    'orders',
    'payments',
    'outfits',
    'users',
    'companies',
    'production' // New root if it exists and needs reset
];

// COLLECTIONS TO PROTECT (Staging - DO NOT TOUCH)
const PROTECTED_PATTERNS = [
    /^staging_.*/,
    /^staging\/.*/
];

const main = async () => {
    console.log("⚠️  SEWVEE DATA CLEANUP SCRIPT ⚠️");
    console.log("--------------------------------");

    // Check for Service Account
    try {
        const serviceAccount = require(SERVICE_ACCOUNT_PATH);
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount)
        });
    } catch (e) {
        console.error("❌ Error: Service account key not found at './service-account.json'");
        console.error("   Please download a new private key from Firebase Console -> Project Settings -> Service Accounts");
        console.error("   and save it as 'service-account.json' in this folder.");
        process.exit(1);
    }

    const db = admin.firestore();
    const collections = await db.listCollections();

    console.log("\n🔍 Analyzing Collections...");
    let toDelete = [];
    let skipped = [];

    for (const collection of collections) {
        const id = collection.id;

        // Safety Check 1: Is it explicitly targeted?
        const isTarget = TARGET_COLLECTIONS.includes(id);

        // Safety Check 2: Is it protected?
        const isProtected = PROTECTED_PATTERNS.some(p => p.test(id));

        if (isProtected) {
            skipped.push(`${id} (PROTECTED)`);
        } else if (isTarget) {
            toDelete.push(collection);
        } else {
            skipped.push(`${id} (Skipping - Not in target list)`);
        }
    }

    console.log("\n🛑 SKIPPING (Protected/Unknown):");
    skipped.forEach(s => console.log(`   - ${s}`));

    if (toDelete.length === 0) {
        console.log("\n✅ No target collections found to delete.");
        process.exit(0);
    }

    console.log("\n🔥 WILL DELETE THE FOLLOWING COLLECTIONS PERMANENTLY:");
    toDelete.forEach(c => console.log(`   - ${c.id}`));

    // Final Confirmation
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    rl.question('\n‼️  Type "DELETE-PROD" to confirm execution: ', async (answer) => {
        if (answer !== 'DELETE-PROD') {
            console.log("❌ Aborted.");
            process.exit(0);
        }

        console.log("\n🚀 Deleting...");
        for (const collection of toDelete) {
            process.stdout.write(`   Deleting ${collection.id}... `);
            const batch = db.batch(); // Note: Batch limit is 500, simple recursive delete needed for large collections
            // For simplicity in this safety script, we use a recursive delete tool helper if available or simple batch
            // Using admin.firestore().recursiveDelete is safest/easiest
            await db.recursiveDelete(collection);
            console.log("Done.");
        }

        console.log("\n✨ Cleanup Complete. Staging data remains untouched.");
        process.exit(0);
    });
};

main();
