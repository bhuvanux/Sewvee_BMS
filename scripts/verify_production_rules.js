const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// Load google-services.json directly
let googleServices;
try {
    googleServices = require('../google-services.json');
} catch (e) {
    console.error("❌ Could not load google-services.json from root. Please ensure it exists.");
    process.exit(1);
}

const projectInfo = googleServices.project_info;
const client = googleServices.client[0];
const apiKey = client.api_key[0].current_key;

const firebaseConfig = {
    apiKey: apiKey,
    authDomain: `${projectInfo.project_id}.firebaseapp.com`,
    projectId: projectInfo.project_id,
    storageBucket: projectInfo.storage_bucket,
    messagingSenderId: projectInfo.project_number,
    appId: client.client_info.mobilesdk_app_id // Using Android App ID for verification
};

const fs = require('fs');
const logFile = '../verify_log.txt';

function log(msg) {
    console.log(msg);
    fs.appendFileSync(logFile, msg + '\n');
}

log("🔒 Verify Production Rules Script (Retry with Email Auth)");
log("---------------------------------");
log(`Target Project: ${firebaseConfig.projectId}`);

const testRules = async () => {
    try {
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);

        // 1. Authenticate (Anonymous failed, so we try creating a temp user)
        // We use a random email to ensure we don't conflict or need cleanup
        const randomEmail = `verify_script_${Date.now()}@test.sewvee.com`;
        const password = "TestScriptPass123!";

        log(`1. Authenticating as New User (${randomEmail})...`);
        let userCred;
        try {
            userCred = await createUserWithEmailAndPassword(auth, randomEmail, password);
            log(`   ✅ Signed in as: ${userCred.user.uid}`);
        } catch (authErr) {
            log("   ⚠️  Create User failed (maybe email exists?), trying Sign In...");
            try {
                userCred = await signInWithEmailAndPassword(auth, randomEmail, password);
                log(`   ✅ Signed in as: ${userCred.user.uid}`);
            } catch (signInErr) {
                log("   ❌ Authentication Failed completely. Check if Email/Password provider is enabled in Console.");
                log(signInErr.message);
                process.exit(1);
            }
        }

        // 2. Attempt Write to PRODUCTION (Should SUCCESS)
        log("\n2. Attempting Write to production_verification_test/doc1 ...");
        try {
            await setDoc(doc(db, "production_verification_test", "doc1"), {
                timestamp: new Date().toISOString(),
                verifiedBy: "AgentScript_EmailAuth",
                uid: userCred.user.uid,
                email: randomEmail
            });
            log("   ✅ SUCCESS: Write to production_* allowed.");
        } catch (e) {
            log("   ❌ FAILED: Write to production denied!", e.message);
            process.exit(1);
        }

        // 3. Attempt Write to STAGING (Also allowed by rules, logic handled by app)
        log("\n3. Verifying staging_* access...");
        try {
            await setDoc(doc(db, "staging_verification_test", "doc1"), {
                timestamp: new Date().toISOString(),
                verifiedBy: "AgentScript_EmailAuth",
                uid: userCred.user.uid
            });
            log("   ✅ SUCCESS: Write to staging_* allowed (Expected).");
        } catch (e) {
            log("   ❌ FAILED: Write to staging denied!", e.message);
        }

        log("\n✨ Verification Successful: Server accepts writes to /production/.");
        process.exit(0);

    } catch (error) {
        console.error("❌ CRTICAL ERROR:", error);
        process.exit(1);
    }
};

testRules();
