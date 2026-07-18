export declare const getByEmail: import("convex/server").RegisteredQuery<"public", {
    email: string;
}, Promise<{
    _id: import("convex/values").GenericId<"users">;
    _creationTime: number;
    phone?: string;
    name: string;
    email: string;
    passwordHash: string;
    role: "admin" | "marketing" | "sales" | "accounting" | "customer";
    approved: boolean;
}>>;
export declare const getById: import("convex/server").RegisteredQuery<"public", {
    id: import("convex/values").GenericId<"users">;
}, Promise<{
    _id: import("convex/values").GenericId<"users">;
    _creationTime: number;
    phone?: string;
    name: string;
    email: string;
    passwordHash: string;
    role: "admin" | "marketing" | "sales" | "accounting" | "customer";
    approved: boolean;
}>>;
export declare const create: import("convex/server").RegisteredMutation<"public", {
    phone?: string;
    name: string;
    email: string;
    passwordHash: string;
    role: "admin" | "marketing" | "sales" | "accounting" | "customer";
    approved: boolean;
}, Promise<{
    _id: import("convex/values").GenericId<"users">;
    _creationTime: number;
    phone?: string;
    name: string;
    email: string;
    passwordHash: string;
    role: "admin" | "marketing" | "sales" | "accounting" | "customer";
    approved: boolean;
}>>;
export declare const update: import("convex/server").RegisteredMutation<"public", {
    name?: string;
    email?: string;
    phone?: string;
    passwordHash?: string;
    role?: "admin" | "marketing" | "sales" | "accounting" | "customer";
    approved?: boolean;
    id: import("convex/values").GenericId<"users">;
}, Promise<{
    _id: import("convex/values").GenericId<"users">;
    _creationTime: number;
    phone?: string;
    name: string;
    email: string;
    passwordHash: string;
    role: "admin" | "marketing" | "sales" | "accounting" | "customer";
    approved: boolean;
}>>;
//# sourceMappingURL=users.d.ts.map