import { relations } from "drizzle-orm/relations";
import { users, posts, comments, workspaces } from "./schema";

export const postsRelations = relations(posts, ({one, many}) => ({
	user: one(users, {
		fields: [posts.ownerId],
		references: [users.id]
	}),
	comments: many(comments),
}));

export const usersRelations = relations(users, ({one, many}) => ({
	posts: many(posts),
	comments: many(comments),
	user: one(users, {
		fields: [users.invitee],
		references: [users.id],
		relationName: "users_invitee_users_id"
	}),
	users: many(users, {
		relationName: "users_invitee_users_id"
	}),
	workspaces: many(workspaces),
}));

export const commentsRelations = relations(comments, ({one}) => ({
	user: one(users, {
		fields: [comments.ownerId],
		references: [users.id]
	}),
	post: one(posts, {
		fields: [comments.postId],
		references: [posts.id]
	}),
}));

export const workspacesRelations = relations(workspaces, ({one}) => ({
	user: one(users, {
		fields: [workspaces.id],
		references: [users.id]
	}),
}));