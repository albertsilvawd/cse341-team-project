import { describe, expect, test } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import { getDb } from '../src/db/connect.js';

describe('Stations API', () => {
    test('GET /api/stations returns all stations', async () => {
        const response = await request(app).get('/api/stations');

        console.log('STATUS:', response.status);
        console.log('BODY:', response.body);
        console.log('TEXT:', response.text);

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toContain('application/json');
        expect(response.body).toHaveProperty('stations');
        expect(response.body.stations).toBeInstanceOf(Array);
    });

    test('GET /api/stations returns known seeded station data', async () => {
        const response = await request(app).get('/api/stations');

        expect(response.status).toBe(200);
        expect(response.body.stations).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    id: 'nagoya',
                    name: 'Nagoya Station',
                    prefecture: 'Aichi',
                    region: 'central',
                    facilities: [
                        'restaurant',
                        'shop',
                        'restroom',
                        'lockers',
                        'tourist_info'
                    ],
                    description: 'Major transportation hub in central Japan.'
                })
            ])
        );
    });

    test('GET /api/stations/:id returns a known station', async () => {
        const station = await getDb()
            .collection('stations')
            .findOne({ id: 'nagoya' });

        expect(station).not.toBeNull();

        const response = await request(app).get(`/api/stations/${station.id}`);

        expect(response.status).toBe(200);
        expect(response.headers['content-type']).toContain('application/json');
        expect(response.body).toHaveProperty('station');
        expect(response.body.station).toEqual(
            expect.objectContaining({
                id: station.id,
                name: station.name,
                prefecture: station.prefecture,
                region: station.region,
                facilities: station.facilities,
                description: station.description
            })
        );
    });

    test('GET /api/stations/:id returns 404 when station does not exist', async () => {
        const response = await request(app).get('/api/stations/nonexistent-station');

        expect(response.status).toBe(404);
        expect(response.body).toEqual({
            error: 'Station not found'
        });
    });
});