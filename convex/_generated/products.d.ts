export declare const list: import("convex/server").RegisteredQuery<"public", {
    category?: string;
    activeOnly?: boolean;
    inStock?: boolean;
}, Promise<{
    _id: import("convex/values").GenericId<"products">;
    _creationTime: number;
    description?: string;
    imageUrl?: string;
    category?: string;
    vatClass?: "standard" | "zero" | "exempt";
    kraItemCode?: string;
    uom?: string;
    name: string;
    sku: string;
    packSize: string;
    priceKes: number;
    stockQuantity: number;
    isActive: boolean;
}[]>>;
export declare const get: import("convex/server").RegisteredQuery<"public", {
    id: import("convex/values").GenericId<"products">;
}, Promise<{
    _id: import("convex/values").GenericId<"products">;
    _creationTime: number;
    description?: string;
    imageUrl?: string;
    category?: string;
    vatClass?: "standard" | "zero" | "exempt";
    kraItemCode?: string;
    uom?: string;
    name: string;
    sku: string;
    packSize: string;
    priceKes: number;
    stockQuantity: number;
    isActive: boolean;
}>>;
export declare const create: import("convex/server").RegisteredMutation<"public", {
    description?: string;
    imageUrl?: string;
    category?: string;
    vatClass?: "standard" | "zero" | "exempt";
    kraItemCode?: string;
    uom?: string;
    name: string;
    sku: string;
    packSize: string;
    priceKes: number;
    stockQuantity: number;
    isActive: boolean;
}, Promise<{
    _id: import("convex/values").GenericId<"products">;
    _creationTime: number;
    description?: string;
    imageUrl?: string;
    category?: string;
    vatClass?: "standard" | "zero" | "exempt";
    kraItemCode?: string;
    uom?: string;
    name: string;
    sku: string;
    packSize: string;
    priceKes: number;
    stockQuantity: number;
    isActive: boolean;
}>>;
export declare const update: import("convex/server").RegisteredMutation<"public", {
    name?: string;
    description?: string;
    packSize?: string;
    priceKes?: number;
    stockQuantity?: number;
    imageUrl?: string;
    isActive?: boolean;
    category?: string;
    vatClass?: "standard" | "zero" | "exempt";
    kraItemCode?: string;
    uom?: string;
    id: import("convex/values").GenericId<"products">;
}, Promise<{
    _id: import("convex/values").GenericId<"products">;
    _creationTime: number;
    description?: string;
    imageUrl?: string;
    category?: string;
    vatClass?: "standard" | "zero" | "exempt";
    kraItemCode?: string;
    uom?: string;
    name: string;
    sku: string;
    packSize: string;
    priceKes: number;
    stockQuantity: number;
    isActive: boolean;
}>>;
export declare const remove: import("convex/server").RegisteredMutation<"public", {
    id: import("convex/values").GenericId<"products">;
}, Promise<void>>;
//# sourceMappingURL=products.d.ts.map