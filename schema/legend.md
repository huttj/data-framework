Values are stored by string
Enums are stored by array

    {
        name : "number",
        age  : "string",
        dob  : "date"
        sex  : ["Male", "Female", "Intersex"]
    }

Nullable values are suffixed with a question mark

    {
        favorite_food: "string?"
    }

References to another schema item are done by `-`, `<`, `>`, or `=`, and relation is created on the schema it's defined on

    {
        "Mom"     : ">Person" // One mom can have many kids; "hasOne"
        "Pets"    : "<Animal" // One owner has many pets; "hasMany"
        "Rifle"   : "-Gun"    // One infantrymen has one rifle ("Many like it, but this one's mine"); "hasOne"
        "Hobbies" : "=Hobby"  // Each person can have many hobbies; a hobby can be shared by many people; "hasMany"
    }