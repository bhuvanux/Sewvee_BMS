const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');
const { getFirestore, collection, addDoc } = require('firebase/firestore');
const fs = require('fs');

const googleServices = require('./google-services.json');
const projectInfo = googleServices.project_info;
const client = googleServices.client[0];
const apiKey = client.api_key[0].current_key;

const config = {
    apiKey: apiKey,
    authDomain: `${projectInfo.project_id}.firebaseapp.com`,
    projectId: projectInfo.project_id,
    appId: client.client_info.mobilesdk_app_id
};

fs.writeFileSync('seed_simple_log.txt', 'Starting Simple Seed...\n');

async function run() {
    try {
        const app = initializeApp(config);
        const auth = getAuth(app);
        const db = getFirestore(app);

        const email = `seed_simple_${Date.now()}@test.com`;
        const pass = "Pass123!";

        try {
            await createUserWithEmailAndPassword(auth, email, pass);
        } catch (e) {
            await signInWithEmailAndPassword(auth, email, pass);
        }

        fs.appendFileSync('seed_simple_log.txt', `Auth Success: ${auth.currentUser.uid}\n`);

        await addDoc(collection(db, 'outfits'), {
            name: "Initial Production Seeding Test",
            from_script: true,
            createdAt: new Date().toISOString()
        });

        fs.appendFileSync('seed_simple_log.txt', "SUCCESS: Wrote test doc to 'outfits'.\n");
        process.exit(0);
    } catch (e) {
        fs.appendFileSync('seed_simple_log.txt', `ERROR: ${e.message}\n`);
        process.exit(1);
    }
}
run();
