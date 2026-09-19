const hookRegionSorter = () => {
    const regionSelect = document.getElementById('region-filter');
    if (regionSelect) {
        regionSelect.addEventListener('change', () => {
            const selectedRegion = regionSelect.value;
            const url = new URL(window.location.href);

            if (selectedRegion && selectedRegion !== 'all') {
                url.searchParams.set('region', selectedRegion);
            } else {
                url.searchParams.delete('region');
            }

            window.location.href = url.toString();
        });
    }
};

const hookSeasonSorter = () => {
    const seasonSelect = document.getElementById('season-filter');
    if (seasonSelect) {
        seasonSelect.addEventListener('change', () => {
            const selectedSeason = seasonSelect.value;
            const url = new URL(window.location.href);

            if (selectedSeason && selectedSeason !== 'all') {
                url.searchParams.set('season', selectedSeason);
            } else {
                url.searchParams.delete('season');
            }

            window.location.href = url.toString();
        });
    }
};

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
    hookRegionSorter();
    hookSeasonSorter();
    hookTrainsCatalog();
    hookStationInfo();
});