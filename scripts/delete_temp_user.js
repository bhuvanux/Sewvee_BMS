const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, deleteUser } = require('firebase/auth');

// CONFIGURATION (From google-services.json)
const firebaseConfig = {
    apiKey: "AIzaSyDNQNkTqieHs-tl9R6R5vhvXWiU0ZARK5s",
    authDomain: "sewvee.firebaseapp.com",
    projectId: "sewvee",
    storageBucket: "sewvee.firebasestorage.app",
    messagingSenderId: "608916231270",
    appId: "1:608916231270:web:dummy_id_for_script"
};

const EMAIL = "verify_script_1735200543666@test.sewvee.com";
const PASSWORD = "TestScriptPass123!";

const main = async () => {
    console.log(`🗑️ Deleting test user: ${EMAIL}`);
    try {
        const app = initializeApp(firebaseConfig);
        const auth = getAuth(app);

        // 1. Sign In
        console.log("   Logging in...");
        const userCred = await signInWithEmailAndPassword(auth, EMAIL, PASSWORD);
        const user = userCred.user;
        console.log(`   ✅ Signed in as ${user.uid}`);

        // 2. Delete
        console.log("   Deleting user...");
        await deleteUser(user);
        console.log("   ✅ User deleted successfully.");
        process.exit(0);
    } catch (e) {
        console.error("❌ Error deleting user:", e.message);
        process.exit(1);
    }
};

main();
