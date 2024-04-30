// public/db.js
const dbName = "KrugerSightingsDB";
let db;

window.onload = function() {
    if (!window.indexedDB) {
        console.warn("IndexedDB not supported by this browser.");
        return;
    }
    
    let request = indexedDB.open(dbName, 1);

    request.onerror = function(event) {
        console.error("Database error: " + event.target.errorCode);
    };

    request.onupgradeneeded = function(event) {
        db = event.target.result;
        if (!db.objectStoreNames.contains('sightings')) {
            const store = db.createObjectStore('sightings', { keyPath: 'id', autoIncrement: true });
            store.createIndex('date', 'date', { unique: false });
        }
    };

    request.onsuccess = function(event) {
        db = event.target.result;
        fetchSightings();
    };
};

function addSighting(sighting) {
    const transaction = db.transaction(["sightings"], "readwrite");
    const store = transaction.objectStore("sightings");
    const request = store.add(sighting);
    request.onsuccess = function() {
        console.log("Sighting added to the database");
    };
    request.onerror = function(event) {
        console.error("Error adding sighting: ", event.target.errorCode);
    };
}

function fetchSightings() {
    const transaction = db.transaction(["sightings"], "readonly");
    const store = transaction.objectStore("sightings");
    const request = store.getAll();

    request.onsuccess = function() {
        const sightings = request.result;

        if(!sightings.length) return;

        const groupedByDate = groupSightingsByDate(sightings);
        const sortedGroups = sortGroupsByDate(groupedByDate);
        renderSightings(sortedGroups);
    };
    request.onerror = function(event) {
        console.error("Error fetching sightings: ", event.target.errorCode);
    };
}

function renderSightings(sightings) {
    const container = document.getElementById('sightingsContainer');

    if(!container) return;
    
    container.innerHTML = '';  // Clear existing content

    for(let key in sightings){

        let cardHtml = '';

        let headingHtml = `
        <div class="timeline-date wow fadeInLeft" data-wow-delay="0.1s" style="visibility: visible; animation-delay: 0.1s; animation-name: fadeInLeft;">
            <p>${key}</p>
        </div>
        `
        sightings[key].forEach(sighting => {
            cardHtml += `
            <div class="col-12 col-md-6 col-lg-4">
            <div class="single-timeline-content d-flex wow fadeInLeft" data-wow-delay="0.3s" style="visibility: visible; animation-delay: 0.3s; animation-name: fadeInLeft; cursor: pointer;" data-bs-toggle="modal" data-bs-target="#mapModal" data-lat="${sighting.location.latitude}" data-lng="${sighting.location.longitude}">
                <div class="timeline-icon"><i class="fa fa-pencil-square-o" aria-hidden="true"></i></div>
                <div class="timeline-text">
                    <h6>${sighting.animal}</h6>
                    <p class="fw-bold text-mute">${new Date(key).toDateString()} at ${new Date(sighting.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                    <p>${sighting.description}</p>
                </div>
            </div>
            </div>`;
        });

        container.innerHTML += `<div class="single-timeline-area"><div class="row">${headingHtml}${cardHtml}</div></div>`;
    }
}

function deleteDatabase() {
    const req = indexedDB.deleteDatabase('KrugerSightingsDB');
    req.onsuccess = function () {
        console.log("Deleted database successfully");
        // Now, when you reload your application, it should trigger the onupgradeneeded event and recreate the database and its stores
    };
    req.onerror = function () {
        console.error("Error deleting database");
    };
    req.onblocked = function () {
        console.log("Couldn't delete database due to the operation being blocked");
    };
}

function groupSightingsByDate(sightings) {
    const groups = {};
    sightings?.forEach(sighting => {
        const sightingDate = sighting.date.toISOString().slice(0, 10);  // Normalize the date to YYYY-MM-DD format
        if (!groups[sightingDate]) {
            groups[sightingDate] = [];
        }
        groups[sightingDate].push(sighting);
    });
    return groups;
}

function sortGroupsByDate(groups) {
    return Object.keys(groups)
        .sort((a, b) => new Date(b) - new Date(a))  // Sort dates in descending order
        .reduce((acc, date) => {
            acc[date] = groups[date];
            return acc;
        }, {});
}

