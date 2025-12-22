import { db } from '../config/firebase';
import { collection, addDoc, getDocs, query, where, deleteDoc, doc } from 'firebase/firestore';

describe('Firebase Smoke Test', () => {
    it('should be able to write and read from Firestore', async () => {
        const testCollection = collection(db, 'smoke_test');
        const testData = {
            message: 'Hello from Smoke Test',
            timestamp: new Date().toISOString()
        };

        // 1. Add a document
        const docRef = await addDoc(testCollection, testData);
        expect(docRef.id).toBeDefined();

        // 2. Query it back
        const q = query(testCollection, where('message', '==', 'Hello from Smoke Test'));
        const querySnapshot = await getDocs(q);

        expect(querySnapshot.empty).toBe(false);
        expect(querySnapshot.docs[0].data().message).toBe('Hello from Smoke Test');

        // 3. Cleanup
        await deleteDoc(doc(db, 'smoke_test', docRef.id));
    }, 10000); // 10s timeout
});
