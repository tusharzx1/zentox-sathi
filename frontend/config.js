/**
 * ZENTOX-SATHI - Environment Configuration Loader
 * This script loads the .env file and makes variables available on window.CONFIG
 */

window.CONFIG = {
    // Fallback defaults in case .env loading fails
    NEWS_API_KEY: '',
    NEWS_API_URL: 'https://newsdata.io/api/1/latest',
    GEMINI_API_KEY: ''
};

async function initConfig() {
    try {
        const response = await fetch('./.env');
        if (!response.ok) {
            throw new Error(`Failed to load .env: ${response.statusText}`);
        }
        const text = await response.text();
        
        // Parse .env format (KEY=VALUE)
        const lines = text.split('\n');
        lines.forEach(line => {
            const trimmedLine = line.trim();
            if (!trimmedLine || trimmedLine.startsWith('#')) return;
            
            const firstEqualsIndex = trimmedLine.indexOf('=');
            if (firstEqualsIndex !== -1) {
                const key = trimmedLine.substring(0, firstEqualsIndex).trim();
                const value = trimmedLine.substring(firstEqualsIndex + 1).trim();
                
                // Remove optional quotes from value
                const cleanValue = value.replace(/^["']|["']$/g, '');
                window.CONFIG[key] = cleanValue;
            }
        });
        
        console.log('✓ Configuration loaded from .env');
    } catch (error) {
        console.warn('⚠️ Warning: Could not load .env file. Falling back to defaults.', error);
        // Note: For pure static sites served via file://, fetch() will fail.
        // In such cases, the hardcoded defaults in window.CONFIG will be used.
    }
}

// Start loading configuration immediately
// We use a global promise so other scripts can wait for it if needed
window.configPromise = initConfig();
