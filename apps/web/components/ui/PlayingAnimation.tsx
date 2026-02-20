'use client';

import React from 'react';
import { motion } from 'framer-motion';

export default function PlayingAnimation() {
    return (
        <div className="flex items-end gap-[2px] h-3 w-4">
            <motion.div
                animate={{
                    height: ['20%', '100%', '30%', '80%', '20%'],
                }}
                transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "easeInOut"
                }}
                className="w-[3px] bg-[#c68cfa] rounded-full"
            />
            <motion.div
                animate={{
                    height: ['40%', '70%', '100%', '40%', '70%'],
                }}
                transition={{
                    duration: 0.6,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.1
                }}
                className="w-[3px] bg-[#c68cfa] rounded-full"
            />
            <motion.div
                animate={{
                    height: ['60%', '30%', '90%', '50%', '60%'],
                }}
                transition={{
                    duration: 0.7,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.2
                }}
                className="w-[3px] bg-[#c68cfa] rounded-full"
            />
            <motion.div
                animate={{
                    height: ['30%', '100%', '40%', '70%', '30%'],
                }}
                transition={{
                    duration: 0.9,
                    repeat: Infinity,
                    ease: "easeInOut",
                    delay: 0.3
                }}
                className="w-[3px] bg-[#c68cfa] rounded-full"
            />
        </div>
    );
}
