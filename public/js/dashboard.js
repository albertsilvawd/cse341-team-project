document.addEventListener('DOMContentLoaded', async () => {
    const message = document.getElementById('bookings-message');
    const bookingsList = document.getElementById('bookings-list');

    try {
        const response = await fetch('/api/bookings/my-bookings');

        if (!response.ok) {
            if (response.status === 401) {
                message.textContent = 'Please log in to view your bookings.';
            } else if (response.status === 403) {
                message.textContent = 'You do not have permission to view these bookings.';
            } else {
                message.textContent = 'Unable to load your bookings.';
            }
            return;
        }

        const bookings = await response.json();

        if (!bookings.length) {
            message.textContent = 'You do not have any bookings yet.';
            return;
        }

        message.textContent = '';

        bookingsList.innerHTML = '';


        bookings.forEach((booking) => {
            const bookingElement = document.createElement('article');

            const heading = document.createElement('h3');
            heading.textContent = `Booking ${booking.id || ''}`.trim();

            const created = document.createElement('p');
            created.textContent = booking.createdAt
                ? `Created: ${new Date(booking.createdAt).toLocaleString()}`
                : '';

            bookingElement.appendChild(heading);
            bookingElement.appendChild(created);

            bookingsList.appendChild(bookingElement);
        });


    } catch (error) {
        message.textContent = 'Unable to load your bookings. Please try again later.';
    }
});