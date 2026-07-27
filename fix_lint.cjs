const fs = require('fs');

let appContent = fs.readFileSync('src/App.tsx', 'utf8');
appContent = appContent.replace(/playSynthSound\("click"\)/g, 'playSynthSound("beep")');
fs.writeFileSync('src/App.tsx', appContent);

let aboutContent = fs.readFileSync('src/components/AboutPage.tsx', 'utf8');
// match key="xyz" and remove it for AnimatedSection only? 
// No, the error is specifically for AnimatedSection calls.
aboutContent = aboutContent.replace(/<AnimatedSection key="[^"]+"/g, '<AnimatedSection');
fs.writeFileSync('src/components/AboutPage.tsx', aboutContent);
console.log('Done');
