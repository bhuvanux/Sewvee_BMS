const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc } = require('firebase/firestore');

// CONFIGURATION (From google-services.json)
const firebaseConfig = {
    apiKey: "AIzaSyDNQNkTqieHs-tl9R6R5vhvXWiU0ZARK5s",
    authDomain: "sewvee-mini.firebaseapp.com",
    projectId: "sewvee-mini",
    storageBucket: "sewvee-mini.firebasestorage.app",
    messagingSenderId: "608916231270",
    appId: "1:608916231270:web:dummy_id_for_script"
};

console.log("🔒 Verify Production Rules Script (Retry with Email Auth)");
console.log("---------------------------------");
console.log(`Target Project: ${firebaseConfig.projectId}`);

const testRules = async () => {
    try {
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);
        const db = getFirestore(app);

        // 1. Authenticate (Anonymous failed, so we try creating a temp user)
        // We use a random email to ensure we don't conflict or need cleanup
        const randomEmail = `verify_script_${Date.now()}@test.sewvee.com`;
        const password = "TestScriptPass123!";

        console.log(`1. Authenticating as New User (${randomEmail})...`);
        let userCred;
        try {
            userCred = await createUserWithEmailAndPassword(auth, randomEmail, password);
            console.log(`   ✅ Signed in as: ${userCred.user.uid}`);
        } catch (authErr) {
            console.log("   ⚠️  Create User failed (maybe email exists?), trying Sign In...");
            try {
                userCred = await signInWithEmailAndPassword(auth, randomEmail, password);
                console.log(`   ✅ Signed in as: ${userCred.user.uid}`);
            } catch (signInErr) {
                console.error("   ❌ Authentication Failed completely. Check if Email/Password provider is enabled in Console.");
                console.error(signInErr.message);
                process.exit(1);
            }
        }

        // 2. Attempt Write to PRODUCTION (Should SUCCESS)
        console.log("\n2. Attempting Write to production_verification_test/doc1 ...");
        try {
            await setDoc(doc(db, "production_verification_test", "doc1"), {
                timestamp: new Date().toISOString(),
                verifiedBy: "AgentScript_EmailAuth",
                uid: userCred.user.uid,
                email: randomEmail
            });
            console.log("   ✅ SUCCESS: Write to production_* allowed.");
        } catch (e) {
            console.error("   ❌ FAILED: Write to production denied!", e.message);
            process.exit(1);
        }

        // 3. Attempt Write to STAGING (Also allowed by rules, logic handled by app)
        console.log("\n3. Verifying staging_* access...");
        try {
            await setDoc(doc(db, "staging_verification_test", "doc1"), {
                timestamp: new Date().toISOString(),
                verifiedBy: "AgentScript_EmailAuth",
                uid: userCred.user.uid
            });
            console.log("   ✅ SUCCESS: Write to staging_* allowed (Expected).");
        } catch (e) {
            console.error("   ❌ FAILED: Write to staging denied!", e.message);
        }

        console.log("\n✨ Verification Successful: Server accepts writes to /production/.");
        process.exit(0);

    } catch (error) {
        console.error("❌ CRTICAL ERROR:", error);
        process.exit(1);
    }
};

testRules();
