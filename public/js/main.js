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

const hookTripsCatalog = () => {
    const listEl = document.getElementById('trips-list');
    const templateEl = document.getElementById('trip-card-template');
    const loadingEl = document.getElementById('trips-loading');
    const errorEl = document.getElementById('trips-error');
    const regionSelect = document.getElementById('region-filter');
    const seasonSelect = document.getElementById('season-filter');
    const paginationEl = document.getElementById('pagination-controls');
    const prevBtn = document.getElementById('prev-page-btn');
    const nextBtn = document.getElementById('next-page-btn');
    const pageIndicatorEl = document.getElementById('page-indicator');

    if (!listEl || !templateEl) {
        return;
    }

    const PAGE_SIZE = 10;
    let currentPage = 1;

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

    const updatePaginationControls = (pagination) => {
        if (!paginationEl) {
            return;
        }

        paginationEl.hidden = false;

        if (pageIndicatorEl) {
            pageIndicatorEl.textContent = `Page ${pagination.page} of ${pagination.totalPages}`;
        }
        if (prevBtn) {
            prevBtn.disabled = !pagination.hasPreviousPage;
        }
        if (nextBtn) {
            nextBtn.disabled = !pagination.hasNextPage;
        }
    };

    const loadPage = async (page) => {
        try {
            const response = await fetch(`/api/trips?page=${page}&limit=${PAGE_SIZE}`);
            if (!response.ok) {
                throw new Error(`Failed to load trips (${response.status})`);
            }

            const payload = await response.json();
            currentPage = payload.pagination.page;

            renderTrips(payload.data);
            updatePaginationControls(payload.pagination);

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

    // Region/season filtering moves to the server in the next pull request.
    // Disabled here since the client now only has the current page of results.
    if (regionSelect) {
        regionSelect.disabled = true;
    }
    if (seasonSelect) {
        seasonSelect.disabled = true;
    }

    if (prevBtn) {
        prevBtn.addEventListener('click', () => loadPage(currentPage - 1));
    }
    if (nextBtn) {
        nextBtn.addEventListener('click', () => loadPage(currentPage + 1));
    }

    loadPage(currentPage);
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

const hookBookingsCatalog = async () => {
    const listEl = document.getElementById('bookings-container');
    const templateEl = document.getElementById('booking-card-template');
    const loadingEl = document.getElementById('bookings-loading');
    const errorEl = document.getElementById('bookings-error');

    if (!listEl || !templateEl) {
        return;
    }

    const formatBookingValue = (value) => {
        return String(value)
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, (letter) => letter.toUpperCase());
    };

    try {
        const response = await fetch('/api/bookings');

        if (!response.ok) {
            throw new Error(`Failed to load bookings (${response.status})`);
        }

        const payload = await response.json();
        const bookings = payload.bookings || [];

        bookings.sort((a, b) => {
            return new Date(b.createdAt) - new Date(a.createdAt);
        });

        const fragment = document.createDocumentFragment();

        if (bookings.length === 0) {
            listEl.innerHTML = '<p>No bookings found.</p>';
        } else {
            bookings.forEach((booking) => {
                const card = templateEl.content.cloneNode(true);

                card.querySelector('[data-field="booking-id"]').textContent =
                    booking.id;

                card.querySelector('[data-field="ticket-class"]').textContent =
                    formatBookingValue(booking.ticketClass);

                card.querySelector('[data-field="selected-day"]').textContent =
                    formatBookingValue(booking.selectedDay);

                card.querySelector('[data-field="created"]').textContent =
                    new Date(booking.createdAt).toLocaleString();

                const passengersEl = card.querySelector(
                    '[data-field="passengers"]'
                );

                booking.passengers.forEach((passenger) => {
                    const passengerEl = document.createElement('li');

                    passengerEl.textContent =
                        `${passenger.firstName} ${passenger.lastName} - ` +
                        `${passenger.email} - ${passenger.phone}`;

                    passengersEl.appendChild(passengerEl);
                });

                const bookingCard = card.querySelector('.booking-card');

                const ticketClassEl = card.querySelector(
                    '[data-field="ticket-class"]'
                );

                const updateButton = card.querySelector(
                    '[data-action="update-booking"]'
                );

                updateButton.addEventListener('click', async () => {
                    const currentTicketClass = booking.ticketClass;

                    const newTicketClass = window.prompt(
                        'Enter the new ticket class (First, Standard, or Premium):',
                        formatBookingValue(currentTicketClass)
                    );

                    if (!newTicketClass) {
                        return;
                    }

                    const ticketClassOptions = [
                        'first',
                        'standard',
                        'premium'
                    ];

                    const selectedTicketClass = newTicketClass
                        .trim()
                        .toLowerCase();

                    if (!ticketClassOptions.includes(selectedTicketClass)) {
                        window.alert(
                            'Please enter First, Standard, or Premium.'
                        );
                        return;
                    }

                    try {
                        const response = await fetch(`/api/bookings/${booking.id}`, {
                            method: 'PUT',
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                ticketClass: selectedTicketClass
                            })
                        });

                        const data = await response.json();

                        if (!response.ok) {
                            throw new Error(
                                data.message || 'Unable to update booking.'
                            );
                        }

                        booking.ticketClass = data.booking.ticketClass;

                        ticketClassEl.textContent =
                            formatBookingValue(data.booking.ticketClass);
                    } catch (error) {
                        window.alert(error.message);
                    }
                });

                const deleteButton = card.querySelector(
                    '[data-action="delete-booking"]'
                );

                deleteButton.addEventListener('click', async () => {
                    const confirmed = window.confirm(
                        'Are you sure you want to delete this booking?'
                    );

                    if (!confirmed) {
                        return;
                    }

                    try {
                        const response = await fetch(`/api/bookings/${booking.id}`, {
                            method: 'DELETE'
                        });

                        const data = await response.json();

                        if (!response.ok) {
                            throw new Error(data.message || 'Unable to delete booking.');
                        }

                        bookingCard.remove();
                    } catch (error) {
                        window.alert(error.message);
                    }
                });

                fragment.appendChild(card);
            });

            listEl.replaceChildren(fragment);
        }

        if (loadingEl) {
            loadingEl.hidden = true;
        }
    } catch (error) {
        if (loadingEl) {
            loadingEl.hidden = true;
        }

        if (errorEl) {
            errorEl.hidden = false;
            errorEl.textContent =
                'Unable to load bookings right now. Please try again in a moment.';
        }
    }
};

document.addEventListener('DOMContentLoaded', () => {
    hookTrainsCatalog();
    hookTripsCatalog();
    hookStationInfo();
    hookBookingsCatalog();
});