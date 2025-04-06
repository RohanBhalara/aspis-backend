import axios from 'axios';
import Threat from '../models/Threat.js';

export const threatsController = {
    refreshCache: async () => {
        const response = await axios.get(`${process.env.API_BASE_URL}/limit/1000/`);
        if (response.data.query_status !== 'ok') return;

        const operations = response.data.urls.map(url => ({
            updateOne: {
                filter: { url: url.url },
                update: { $set: { ...url, cachedAt: new Date() } },
                upsert: true
            }
        }));

        await Threat.bulkWrite(operations);
    },

    getFreshData: async (page = 1, limit = 10) => {
        const externalLimit = page * limit;
        const response = await axios.get(
            `${process.env.API_BASE_URL}/limit/${externalLimit}/`
        );

        if (response.data.query_status !== 'ok') {
            throw new Error('External API error');
        }

        return {
            results: response.data.urls.slice((page - 1) * limit, page * limit),
            total: response.data.urls.length
        };
    },

    getCachedData: async (page, limit) => {
        const total = await Threat.countDocuments();
        const results = await Threat.find()
            .sort('-date_added')
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();

        // Refresh cache if expired
        const lastUpdated = await Threat.findOne().sort('-cachedAt');
        if (!lastUpdated || (Date.now() - lastUpdated.cachedAt) / 1000 > process.env.CACHE_TTL) {
            await threatsController.refreshCache();
        }

        return { results, total };
    },

    getThreats: async (req, res, next) => {
        try {
            const { page = 1, limit = 10 } = req.query;
            const pageNum = parseInt(page);
            const limitNum = parseInt(limit);

            // Choose data source based on cache availability
            const data = await (process.env.MONGODB_URI
                ? threatsController.getCachedData(pageNum, limitNum)
                : threatsController.getFreshData(pageNum, limitNum));

            res.json({
                status: 'success',
                data: data.results,
                meta: {
                    page: pageNum,
                    limit: limitNum,
                    total: data.total,
                    totalPages: Math.ceil(data.total / limitNum)
                }
            });
        } catch (err) {
            next(err);
        }
    }
};