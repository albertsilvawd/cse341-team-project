import Station from './schemas/stations.js';

const getAllStations = async () => {
    return Station.find({}).lean();
};

const getStationById = async (id) => {
    return Station.findOne({ id }).lean();
};

export { getAllStations, getStationById };
