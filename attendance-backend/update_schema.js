const db = require("./db");

const alterQuery = "ALTER TABLE attendance MODIFY COLUMN image LONGTEXT";

console.log("Updating 'image' column to LONGTEXT...");

db.query(alterQuery, (err, result) => {
    if (err) {
        console.error("Failed to update schema:", err);
    } else {
        console.log("Schema updated successfully! 'image' column is now LONGTEXT.");
    }
    process.exit();
});
