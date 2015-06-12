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

References to another schema item are done by `@`, stored value is the ID

    {
        mom: "@person"
        pet: "@animal"
    }

Lookups are done by `#`

    {
        "state": "#state"
    }