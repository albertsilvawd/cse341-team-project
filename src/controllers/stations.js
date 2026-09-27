import { getAllStations, getStationById } from '../models/stations.js';

const getAllStationsApi = async (req, res, next) => {
    try {
        const stations = await getAllStations();
        return res.status(200).json({ stations });
    } catch (error) {
        return next(error);
    }
};

const getStationByIdApi = async (req, res, next) => {
    try {
        const station = await getStationById(req.params.id);

        if (!station) {
            return res.status(404).json({
                error: 'Station not found'
            });
        }

        return res.status(200).json({ station });
    } catch (error) {
        return next(error);
    }
};

export { getAllStationsApi, getStationByIdApi };
