const hookTrainsCatalog = async () => {
    const listEl = document.getElementById('trains-list');
    const templateEl = document.getElementById('train-card-template');
    const loadingEl = document.getElementById('trains-loading');
    const errorEl = document.getElementById('trains-error');

    if (!listEl || !templateEl) {
        return;
    }

    try {
        const response = await fetch('/api/trains');
        if (!response.ok) {
            throw new Error(`Failed to load trains (${response.status})`);
        }

        const payload = await response.json();
        const trains = payload.trains || [];
        const fragment = document.createDocumentFragment();

        trains.forEach((train) => {
            const card = templateEl.content.cloneNode(true);
            const imageEl = card.querySelector('[data-field="image"]');

            imageEl.src = train.imageUrl;
            imageEl.alt = train.imageAlt || `${train.name} train`;

            card.querySelector('[data-field="name"]').textContent = train.name;
            card.querySelector('[data-field="operator"]').textContent = train.operator;
            card.querySelector('[data-field="type"]').textContent = train.type;
            card.querySelector('[data-field="speed"]').textContent = `${train.maxSpeedKmh} km/h`;
            card.querySelector('[data-field="seats"]').textContent = `${train.capacity} seats`;
            card.querySelector('[data-field="power"]').textContent = train.powerSource;
            card.querySelector('[data-field="description"]').textContent = train.description;
            card.querySelector('[data-field="best-for"]').textContent = train.bestFor;

            fragment.appendChild(card);
        });

        listEl.replaceChildren(fragment);
        if (loadingEl) {
            loadingEl.hidden = true;
        }
    } catch (error) {
        if (loadingEl) {
            loadingEl.hidden = true;
        }
        if (errorEl) {
            errorEl.hidden = false;
            errorEl.textContent = 'Unable to load trains right now. Please try again in a moment.';
        }
    }
};

const hookTripsCatalog = async () => {
    const listEl = document.getElementById('trips-list');
    const templateEl = document.getElementById('trip-card-template');
    const loadingEl = document.getElementById('trips-loading');
    const errorEl = document.getElementById('trips-error');
    const regionSelect = document.getElementById('region-filter');
    const seasonSelect = document.getElementById('season-filter');

    if (!listEl || !templateEl) {
        return;
    }

    let allTrips = [];

    const renderTrips = (trips) => {
        const fragment = document.createDocumentFragment();

        trips.forEach((trip) => {
            const card = templateEl.content.cloneNode(true);

            card.querySelector('[data-field="name"]').textContent = trip.name;
            card.querySelector('[data-field="region"]').textContent = trip.region;
            card.querySelector('[data-field="start-station"]').textContent = trip.startStation;
            card.querySelector('[data-field="end-station"]').textContent = trip.endStation;
            card.querySelector('[data-field="duration"]').textContent = trip.duration;
            card.querySelector('[data-field="distance"]').textContent = `${trip.distance}km`;
            card.querySelector('[data-field="season"]').textContent = `Best in ${trip.bestSeason}`;
            card.querySelector('[data-field="description"]').textContent = trip.description;

            const highlightsEl = card.querySelector('[data-field="highlights"]');
            trip.highlights.forEach((highlight) => {
                const tag = document.createElement('span');
                tag.className = 'highlight-tag';
                tag.textContent = highlight;
                highlightsEl.appendChild(tag);
            });

            const linkEl = card.querySelector('[data-field="details-link"]');
            linkEl.href = `/trips/${trip.id}`;

            const cardEl = card.querySelector('.route-card');
            if (cardEl) {
                cardEl.classList.add(trip.region);
            }

            fragment.appendChild(card);
        });

        listEl.replaceChildren(fragment);
    };

    const applyFilters = () => {
        const selectedRegion = regionSelect ? regionSelect.value : 'all';
        const selectedSeason = seasonSelect ? seasonSelect.value : 'all';

        const filtered = allTrips.filter((trip) => {
            const matchesRegion = selectedRegion === 'all' || trip.region === selectedRegion;
            const matchesSeason = selectedSeason === 'all' || trip.bestSeason === selectedSeason;
            return matchesRegion && matchesSeason;
        });

        renderTrips(filtered);
    };

    const populateFilterOptions = (selectEl, values) => {
        if (!selectEl) {
            return;
        }

        values.forEach((value) => {
            const option = document.createElement('option');
            option.value = value;
            option.textContent = value.charAt(0).toUpperCase() + value.slice(1);
            selectEl.appendChild(option);
        });
    };

    try {
        const response = await fetch('/api/trips');
        if (!response.ok) {
            throw new Error(`Failed to load trips (${response.status})`);
        }

        const payload = await response.json();
        allTrips = payload.trips || [];

        const regions = [...new Set(allTrips.map((trip) => trip.region))];
        const seasons = [...new Set(allTrips.map((trip) => trip.bestSeason))];

        populateFilterOptions(regionSelect, regions);
        populateFilterOptions(seasonSelect, seasons);

        if (regionSelect) {
            regionSelect.addEventListener('change', applyFilters);
        }
        if (seasonSelect) {
            seasonSelect.addEventListener('change', applyFilters);
        }

        renderTrips(allTrips);

        if (loadingEl) {
            loadingEl.hidden = true;
        }
    } catch (error) {
        if (loadingEl) {
            loadingEl.hidden = true;
        }
        if (errorEl) {
            errorEl.hidden = false;
            errorEl.textContent = 'Unable to load trips right now. Please try again in a moment.';
        }
    }
};

const hookStationInfo = () => {
    const stationButtons = document.querySelectorAll('.station-info-btn');
    stationButtons.forEach((button) => {
        button.addEventListener('click', async () => {
            const stationId = button.dataset.stationId;
            const detailsEl = document.querySelector(
                `[data-station-details="${stationId}"]`
            );
            if (!detailsEl) {
                return;
            }
            if (!detailsEl.hidden) {
                detailsEl.hidden = true;
                return;
            }
            try {
                button.disabled = true;
                const response = await fetch(`/api/stations/${stationId}`);
                if (!response.ok) {
                    throw new Error(`Failed to load station (${response.status})`);
                }
                const payload = await response.json();
                const station = payload.station;
                detailsEl.replaceChildren();
                const nameEl = document.createElement('strong');
                nameEl.textContent = station.name;
                const descriptionEl = document.createElement('p');
                descriptionEl.textContent = station.description;
                const prefectureEl = document.createElement('p');
                prefectureEl.textContent = `Prefecture: ${station.prefecture}`;
                const regionEl = document.createElement('p');
                regionEl.textContent = `Region: ${station.region}`;
                const facilitiesEl = document.createElement('p');
                facilitiesEl.textContent = `Facilities: ${station.facilities.join(', ')}`;
                detailsEl.append(
                    nameEl,
                    descriptionEl,
                    prefectureEl,
                    regionEl,
                    facilitiesEl
                );
                detailsEl.hidden = false;
            } catch (error) {
                detailsEl.textContent =
                    'Unable to load station information right now.';
                detailsEl.hidden = false;
            } finally {
                button.disabled = false;
            }
        });
    });
};

document.addEventListener('DOMContentLoaded', () => {
    hookTrainsCatalog();
    hookTripsCatalog();
    hookStationInfo();
});