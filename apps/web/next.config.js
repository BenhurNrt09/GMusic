/** @type {import('next').NextConfig} */
const nextConfig = {
    transpilePackages: ['@gmusic/ui', '@gmusic/database'],
    images: {
        remotePatterns: [
            {
                protocol: 'https',
                hostname: '**',
            },
        ],
    },
};

module.exports = nextConfig;
