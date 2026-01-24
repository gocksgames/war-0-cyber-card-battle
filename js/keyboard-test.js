// Simple test file to verify keyboard events
console.log('Keyboard test script loaded');

document.addEventListener('keydown', (e) => {
    console.log('TEST - Key pressed:', e.key);
});
