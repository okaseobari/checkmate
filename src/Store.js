// Save contacts to localStorage
function saveContacts(contacts) {
    localStorage.setItem('contacts', JSON.stringify(contacts));
}

// Load contacts from localStorage
function loadContacts() {
    let savedContacts = localStorage.getItem('contacts');
    if (savedContacts) {
        let contactsData = JSON.parse(savedContacts);
        return contactsData.map(contact => new Contact(contact.name, contact.weight));
    }
    return [];
}

// Example usage:
let contacts = loadContacts();
if (contacts.length === 0) {
    contacts = [
        new Contact("Mom", 5),
        new Contact("Best Friend", 4),
        // Add more contacts
    ];
    saveContacts(contacts);
}