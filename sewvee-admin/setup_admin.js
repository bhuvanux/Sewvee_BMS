import { initializeApp } from 'firebase/app';
import { getAuth, createUserWithEmailAndPassword, signInWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, doc, setDoc } from 'firebase/firestore';

const firebaseConfig = {
    apiKey: "AIzaSyBcMwLwVzjh7gd_ClCHkn_e76z-Aghrfu4",
    authDomain: "sewvee-24af2.firebaseapp.com",
    projectId: "sewvee-24af2",
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

const email = 'admin@sewvee.com';
const password = 'AdminPass2025!';

async function setup() {
    try {
        console.log(`Setting up super admin: ${email}...`);
        let user;
        try {
            const cred = await createUserWithEmailAndPassword(auth, email, password);
            user = cred.user;
            console.log("Account created.");
        } catch (e) {
            if (e.code === 'auth/email-already-in-use') {
                const cred = await signInWithEmailAndPassword(auth, email, password);
                user = cred.user;
                console.log("Account already exists, signed in.");
            } else {
                throw e;
            }
        }

        // Set role to super_admin in BOTH collections for safety (staging and prod)
        const collections = ['staging_users', 'users'];
        for (const col of collections) {
            await setDoc(doc(db, col, user.uid), {
                email: email,
                role: 'super_admin',
                name: 'Super Admin',
                createdAt: new Date().toISOString()
            }, { merge: true });
            console.log(`Role assigned in ${col}.`);
        }

        console.log("✅ Super Admin Setup Complete.");
        process.exit(0);
    } catch (error) {
        console.error("❌ Setup Failed:", error.message);
        process.exit(1);
    }
}

setup();
