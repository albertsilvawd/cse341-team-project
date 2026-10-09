import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';

// Find a seeded trip whose start and end stations exist.
async function getTripWithStations() {
    const db = getDb();
    const trips = await db.collection('trips').find({}).toArray();

    for (const trip of trips) {
        const startStation = await db
            .collection('stations')
            .findOne({ id: trip.startStation });

        const endStation = await db
            .collection('stations')
            .findOne({ id: trip.endStation });

        if (startStation && endStation) {
            return { trip, startStation, endStation };
        }
    }

    return null;
}

describe('Trip-Station Relationships', () => {
    test('a seeded trip references existing start and end stations', async () => {
        const result = await getTripWithStations();

        expect(result).not.toBeNull();

        const { trip, startStation, endStation } = result;

        expect(trip.startStation).toBe(startStation.id);
        expect(trip.endStation).toBe(endStation.id);
        expect(startStation.id).not.toBe(endStation.id);
    });

    test('GET /api/trips/:id returns the correct station references', async () => {
        const result = await getTripWithStations();

        expect(result).not.toBeNull();

        const { trip, startStation, endStation } = result;

        const response = await request(app)
            .get(`/api/trips/${trip.id}`);

        expect(response.status).toBe(200);
        expect(response.body.id).toBe(trip.id);
        expect(response.body.startStation).toBe(startStation.id);
        expect(response.body.endStation).toBe(endStation.id);

        const startResponse = await request(app)
            .get(`/api/stations/${response.body.startStation}`);

        const endResponse = await request(app)
            .get(`/api/stations/${response.body.endStation}`);

        expect(startResponse.status).toBe(200);
        expect(startResponse.body.station.id).toBe(startStation.id);
        expect(startResponse.body.station.name).toBe(startStation.name);

        expect(endResponse.status).toBe(200);
        expect(endResponse.body.station.id).toBe(endStation.id);
        expect(endResponse.body.station.name).toBe(endStation.name);
    });
});