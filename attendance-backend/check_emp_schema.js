const db = require("./db");

db.query("DESCRIBE employees", (err, rows) => {
    if (err) {
        console.error("Error describing employees table:", err);
    } else {
        console.log("Employees Table Schema:", rows);
    }
    process.exit();
});
