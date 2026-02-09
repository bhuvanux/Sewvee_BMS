const { initializeApp } = require('firebase/app');
const { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, doc, setDoc, updateDoc } = require('firebase/firestore');

// --- ARGS ---
const args = process.argv.slice(2);
if (args.length < 2) {
    console.error("Usage: node seed_user.js <PHONE> <PIN> [NAME]");
    process.exit(1);
}

const PHONE = args[0];
const PIN = args[1];
const NAME = args[2] || "Admin User";

// --- LOAD CREDENTIALS ---
let googleServices;
try {
    // Adjusted path assuming we run from sewvee-admin or root with knowledge
    // We will run this from 'sewvee-admin' folder, so path to root is ../
    googleServices = require('../../google-services.json');
} catch (e) {
    try {
        googleServices = require('../google-services.json');
    } catch (e2) {
        console.error("❌ Could not load google-services.json");
        process.exit(1);
    }
}

const projectInfo = googleServices.project_info;
const client = googleServices.client[0];
const apiKey = client.api_key[0].current_key;

const config = {
    apiKey: apiKey,
    authDomain: `${projectInfo.project_id}.firebaseapp.com`,
    projectId: projectInfo.project_id,
    appId: client.client_info.mobilesdk_app_id
};

async function seedUser() {
    console.log(`🚀 Seeding User: ${PHONE} into ${config.projectId}...`);
    try {
        const app = initializeApp(config);
        const auth = getAuth(app);
        const db = getFirestore(app);

        // We use a dummy email for Auth, but store the real phone/pin in Firestore
        const email = `user_${PHONE}@sewvee.com`;
        const masterPass = "Sewvee_Auth_Secure_2025"; // Matching AuthContext logic

        let uid;
        console.log(`   Authenticating as ${email}...`);

        try {
            const userCred = await createUserWithEmailAndPassword(auth, email, masterPass);
            uid = userCred.user.uid;
            console.log("   ✅ Created new Firebase Auth user.");
        } catch (e) {
            if (e.code === 'auth/email-already-in-use') {
                console.log("   ℹ️ Auth user already exists. Signing in...");
                const userCred = await signInWithEmailAndPassword(auth, email, masterPass);
                uid = userCred.user.uid;
            } else {
                throw e;
            }
        }

        console.log(`   UID: ${uid}`);

        // Write to 'users' collection (Production)
        const userRef = doc(db, 'users', uid);
        const userData = {
            name: NAME,
            email: email,
            phone: PHONE,
            mobile: PHONE, // Legacy support
            pin: PIN,
            isPhoneVerified: true,
            createdAt: new Date().toISOString(),
            role: 'owner' // Assume owner
        };

        // Use setDoc with merge to avoid overwriting existing fields if any, 
        // but ensure critical fields (PIN, phone) are set.
        await setDoc(userRef, userData, { merge: true });

        console.log("✅ User Profile Written to Firestore!");
        setTimeout(() => process.exit(0), 1000);

    } catch (error) {
        console.error("❌ Seeding Failed:", error.code, error.message);
        setTimeout(() => process.exit(1), 1000);
    }
}

seedUser();
