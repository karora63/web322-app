let items = []; // Mock in-memory data store for items

module.exports.addItem = function(itemData) {
    return new Promise((resolve) => {
        itemData.published = itemData.published ? true : false;
        itemData.id = items.length + 1;
        items.push(itemData);
        resolve(itemData);
    });
};

module.exports.getItemsByCategory = function(category) {
    return new Promise((resolve, reject) => {
        const filteredItems = items.filter(item => item.category === category);
        if (filteredItems.length > 0) resolve(filteredItems);
        else reject("no results returned");
    });
};

module.exports.getItemsByMinDate = function(minDateStr) {
    return new Promise((resolve, reject) => {
        const minDate = new Date(minDateStr);
        const filteredItems = items.filter(item => new Date(item.postDate) >= minDate);
        if (filteredItems.length > 0) resolve(filteredItems);
        else reject("no results returned");
    });
};

module.exports.getItemById = function(id) {
    return new Promise((resolve, reject) => {
        const item = items.find(item => item.id === id);
        if (item) resolve(item);
        else reject("no result returned");
    });
};

module.exports.getAllItems = function() {
    return new Promise((resolve, reject) => {
        if (items.length > 0) resolve(items);
        else reject("no items found");
    });
};
