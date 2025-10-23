import { pgTable, text, uuid } from "drizzle-orm/pg-core";

export const profileTable = pgTable("profile", {
    id: uuid("id").primaryKey(),
    firstName: text("first_name").notNull(),
    lastName: text("last_name").notNull(),
    email: text("email").notNull(),
    /*
    image: text("image").notNull(),
    created_at: timestamp("created_at").notNull().defaultNow(),
    updated_at: timestamp("updated_at").notNull().defaultNow()
    */
})

/*
Users
Learning centers
Roles
User Roles
User Type
*/