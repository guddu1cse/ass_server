const Conversession = require('../models/Conversession');

async function saveConverSession(prompt, response, sessionId, origin) {
    const effectiveSessionId = sessionId || `session-anonymous`;
    const doc = new Conversession({
        userId: getUserIdFromOrigin(origin),
        sessionId: effectiveSessionId,
        prompt: prompt,
        response: response,
        timestamp: new Date()
    });

    return await doc.save();
}

function getUserIdFromOrigin(origin) {
    try {
        const url = new URL(origin);
        const host = url.hostname;
        const parts = host.split(".");
        return parts[0] || "Unknown";
    } catch (err) {
        console.error("Invalid URL:", origin);
        return "Unknown";
    }
}

async function getConversessionBySessionId(sessionId, options = {}) {
    if (!sessionId) {
        throw new Error('Missing required field: sessionId');
    }

    const sortOption = options.sort || { timestamp: 1 };
    const limitOption = options.limit;

    let query = Conversession.find({ sessionId: sessionId }).sort(sortOption);
    if (typeof limitOption === 'number' && limitOption > 0) {
        query = query.limit(limitOption);
    }
    return await query.lean();
}

async function getConversationList(options = {}) {
    const limitOption = options.limit;

    let pipeline = [
        {
            $group: {
                _id: "$sessionId",
                userId: { $first: "$userId" },
                lastMessageAt: { $max: "$timestamp" }
            }
        },
        { $sort: { lastMessageAt: -1 } },
        { $project: { _id: 0, sessionId: "$_id", userId: 1 } }
    ];

    if (typeof limitOption === "number" && limitOption > 0) {
        pipeline.push({ $limit: limitOption });
    }

    return await Conversession.aggregate(pipeline);
}


module.exports = { getConversessionBySessionId, getConversationList, saveConverSession };


