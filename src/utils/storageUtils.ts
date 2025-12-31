
import { storage } from '../config/firebase';
import * as ImageManipulator from 'expo-image-manipulator';

/**
 * Uploads an image to Firebase Storage and returns the download URL.
 * Automatically compresses the image before upload.
 * 
 * @param localUri The local file URI (e.g. from ImagePicker)
 * @param storagePath The target path in Firebase Storage (e.g. 'orders/userid/timestamp.jpg')
 * @returns Promise that resolves to the public download URL
 */
export const uploadImage = async (localUri: string, storagePath: string): Promise<string> => {
    try {
        // 1. Compress image to ensure it's not too large
        const manipResult = await ImageManipulator.manipulateAsync(
            localUri,
            [{ resize: { width: 1080 } }], // Max width 1080px
            { compress: 0.7, format: ImageManipulator.SaveFormat.JPEG }
        );
        const sourceUri = manipResult.uri;

        // 2. Fetch the file blob
        const response = await fetch(sourceUri);
        const blob = await response.blob();

        // 3. Create reference
        const ref = storage().ref(storagePath);

        // 4. Upload
        await ref.put(blob);

        // 5. Get URL
        const url = await ref.getDownloadURL();
        return url;
    } catch (error) {
        console.error('Image Upload Error:', error);
        throw error;
    }
};
