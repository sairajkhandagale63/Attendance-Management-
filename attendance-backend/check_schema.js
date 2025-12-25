const db = require("./db");

db.query("DESCRIBE attendance", (err, rows) => {
    if (err) {
        console.error("Error describing table:", err);
    } else {
        console.log("Table Schema:", rows);
    }
    process.exit();
});
