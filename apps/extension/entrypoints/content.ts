import main from '@/src/main'

import '@/src/tailwind.css'
import '@nhentai/components/components.css'

export default defineContentScript({
    matches: ['https://nhentai.net/*'],
    runAt: 'document_start',
    excludeMatches: [
        ...Array.from({ length: 4 }, (_, i) => `https://i${i + 1}.nhentai.net/*`),
        'https://nhentai.net/login',
        'https://nhentai.net/api/v2/docs/*',
    ],
    main,
})
