const BOOKING_STATUS = Object.freeze({
    PENDING: 'pending',
    ACCEPTED: 'accepted',
    IN_PROGRESS: 'in_progress',
    COMPLETED: 'completed',
    CANCELLED: 'cancelled'
});

const TRIP_DURATION_MINUTES = 60; // Assuming an average trip duration of 60 minutes for conflict checks.

module.exports = {
    BOOKING_STATUS,
    TRIP_DURATION_MINUTES
};