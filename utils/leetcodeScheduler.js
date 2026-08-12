const cron = require('node-cron');
const axios = require('axios');
const LeetCodeStats = require('../models/LeetCodeStats');

const ALFA_API_BASE = 'https://alfa-leetcode-api.onrender.com';

const fetchAndSaveStats = async (username) => {
    try {
        console.log(`[LeetCode Scheduler] Fetching stats for ${username}...`);
        
        // Use Promise.allSettled so one failing doesn't crash the other
        const [profileRes, contestRes] = await Promise.allSettled([
            axios.get(`${ALFA_API_BASE}/userProfile/${username}`),
            axios.get(`${ALFA_API_BASE}/${username}/contest`)
        ]);

        let profileData = null;
        let contestData = null;

        if (profileRes.status === 'fulfilled' && profileRes.value.data && !profileRes.value.data.errors) {
            profileData = profileRes.value.data;
        }

        if (contestRes.status === 'fulfilled' && contestRes.value.data && !contestRes.value.data.errors) {
            contestData = contestRes.value.data;
        }

        // If both failed completely due to rate-limiting, we might not want to overwrite existing good data with null.
        // We only update if we got valid profile data.
        if (profileData) {
            const updateData = {
                profileData: profileData,
                lastUpdated: new Date()
            };
            
            if (contestData) {
                updateData.contestData = contestData;
            }

            await LeetCodeStats.findOneAndUpdate(
                { username: username },
                { $set: updateData },
                { upsert: true, new: true }
            );
            console.log(`[LeetCode Scheduler] Successfully updated stats for ${username}`);
        } else {
            console.log(`[LeetCode Scheduler] Rate limited or invalid profile data for ${username}, skipping DB update.`);
        }

    } catch (err) {
        console.error(`[LeetCode Scheduler] Error fetching stats for ${username}:`, err.message);
    }
};

const initLeetCodeScheduler = () => {
    // Run immediately on server start
    console.log('[LeetCode Scheduler] Initializing...');
    
    setTimeout(() => {
        fetchAndSaveStats('lucky_26');
        fetchAndSaveStats('LC-guddu1cse');
    }, 5000); // 5 second delay to let DB connect

    // Schedule to run every 4 hours
    cron.schedule('0 */4 * * *', () => {
        fetchAndSaveStats('lucky_26');
        fetchAndSaveStats('LC-guddu1cse');
    });
};

module.exports = { initLeetCodeScheduler, fetchAndSaveStats };
