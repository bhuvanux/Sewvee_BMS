const { initializeApp } = require('firebase/app');
const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');
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

fs.writeFileSync('auth_test_result.txt', `STARTING verification for ${config.projectId}\n`);

async function test() {
    try {
        const app = initializeApp(config);
        const auth = getAuth(app);
        const email = `test_${Date.now()}@test.com`;
        const pass = 'TestPass123!';

        fs.appendFileSync('auth_test_result.txt', `Attempting Auth with ${email}...\n`);

        try {
            await createUserWithEmailAndPassword(auth, email, pass);
            fs.appendFileSync('auth_test_result.txt', 'SUCCESS: Created User.\n');
        } catch (e) {
            fs.appendFileSync('auth_test_result.txt', `Create Failed (${e.code}), trying login...\n`);
            await signInWithEmailAndPassword(auth, email, pass);
            fs.appendFileSync('auth_test_result.txt', 'SUCCESS: Signed In.\n');
        }

        fs.appendFileSync('auth_test_result.txt', 'VERIFICATION PASSED.\n');
        process.exit(0);
    } catch (e) {
        fs.appendFileSync('auth_test_result.txt', `FAILURE: ${e.message}\n`);
        console.error(e);
        process.exit(1);
    }
}

test();
