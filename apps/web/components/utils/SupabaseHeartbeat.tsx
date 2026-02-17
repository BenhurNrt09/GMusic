'use client';

import { useEffect } from 'react';
import { supabase } from '@gmusic/database';

const LAST_PING_KEY = 'gmusic_last_supabase_ping';
const TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

export default function SupabaseHeartbeat() {
    useEffect(() => {
        const sendHeartbeat = async () => {
            try {
                const now = Date.now();
                const lastPing = localStorage.getItem(LAST_PING_KEY);

                if (!lastPing || now - parseInt(lastPing) > TWENTY_FOUR_HOURS) {
                    await (supabase.from('pings') as any).insert({});
                    localStorage.setItem(LAST_PING_KEY, now.toString());
                    console.log('Supabase heartbeat sent successfully.');
                }
            } catch (err) {
                console.error('Failed to send Supabase heartbeat:', err);
            }
        };

        sendHeartbeat();
    }, []);

    return null;
}
