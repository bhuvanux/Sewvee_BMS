const { initializeApp } = require('firebase/app');
const { getFirestore, collection, query, orderBy, limit, getDocs } = require('firebase/firestore');
const fs = require('fs');

const googleServices = require('./google-services.json');
const projectInfo = googleServices.project_info;
const client = googleServices.client[0];
const apiKey = client.api_key[0].current_key;

const { getAuth, signInWithEmailAndPassword, createUserWithEmailAndPassword } = require('firebase/auth');

const config = {
    apiKey: apiKey,
    authDomain: `${projectInfo.project_id}.firebaseapp.com`,
    projectId: projectInfo.project_id,
    appId: client.client_info.mobilesdk_app_id
};
const app = initializeApp(config);
const auth = getAuth(app);
const db = getFirestore(app);

async function verifyImages() {
    console.log('--- Verifying Order Images ---');
    try {
        // Authenticate first
        try {
            await signInWithEmailAndPassword(auth, 'test_user_for_verification@test.com', 'TestPass123!');
            console.log('Authenticated as test user.');
        } catch (e) {
            console.log('Creating new test user...');
            await createUserWithEmailAndPassword(auth, 'test_user_for_verification@test.com', 'TestPass123!');
            console.log('Created and authenticated as test user.');
        }

        const q = query(collection(db, 'orders'), orderBy('createdAt', 'desc'), limit(5));
        const querySnapshot = await getDocs(q);

        if (querySnapshot.empty) {
            console.log('No orders found.');
            return;
        }

        querySnapshot.forEach((doc) => {
            const order = doc.data();
            console.log(`\nOrder ID: ${doc.id}`);
            console.log(`Bill No: ${order.billNo}`);

            // Check 'outfits' (New Structure)
            if (order.outfits && Array.isArray(order.outfits)) {
                order.outfits.forEach((item, idx) => {
                    if (item.images && item.images.length > 0) {
                        console.log(`  Item ${idx + 1} (${item.name}):`);
                        item.images.forEach(img => {
                            const isCloud = img.startsWith('http');
                            console.log(`    - [${isCloud ? 'CLOUD' : 'LOCAL'}] ${img.substring(0, 50)}...`);
                        });
                    }
                });
            }
            // Check 'items' (Legacy Structure)
            else if (order.items && Array.isArray(order.items)) {
                order.items.forEach((item, idx) => {
                    if (item.images && item.images.length > 0) {
                        console.log(`  Item ${idx + 1} (${item.name}):`);
                        item.images.forEach(img => {
                            const isCloud = img.startsWith('http');
                            console.log(`    - [${isCloud ? 'CLOUD' : 'LOCAL'}] ${img.substring(0, 50)}...`);
                        });
                    }
                });
            } else {
                console.log('  (No items/outfits with images)');
            }
        });

    } catch (error) {
        console.error('Error fetching orders:', error);
    }
}

verifyImages();
