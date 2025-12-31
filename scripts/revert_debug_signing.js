const fs = require('fs');
const path = require('path');

const gradlePath = path.join(__dirname, '../android/app/build.gradle');
let content = fs.readFileSync(gradlePath, 'utf8');

// We simply want to change 'debug { signingConfig signingConfigs.release }' back to 'debug { signingConfig signingConfigs.debug }'
// BUT only inside the debug buildType block. 
// However, since 'release' buildType MUST use 'release' config, we can just be specific.

// Regex to find debug build type block and fix the signingConfig inside it.
// Match: buildTypes { ... debug { ... signingConfig signingConfigs.release
// This is hard with regex over multiple lines.

// Simpler: Replace the FIRST occurrence of "signingConfig signingConfigs.release" if it appears before "buildTypes {"? No, it's inside.
// Usually 'debug' comes before 'release' in buildTypes.
// Let's verify the file content structure from previous cat.
// debug { signingConfig signingConfigs.release }
// release { signingConfig signingConfigs.release }

// We can replace the first instance if we are sure debug is first.
// Or we can match `debug\s*\{[^}]*signingConfig\s*signingConfigs\.release`

content = content.replace(/(debug\s*{[\s\S]*?)signingConfig\s*signingConfigs\.release/, '$1signingConfig signingConfigs.debug');

fs.writeFileSync(gradlePath, content);
console.log('Reverted debug signing config.');
