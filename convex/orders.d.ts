export declare const listByCustomer: import("convex/server").RegisteredQuery<"public", {
    limit?: number;
    page?: number;
    customerId: import("convex/values").GenericId<"users">;
}, Promise<{
    orders: {
        _id: import("convex/values").GenericId<"orders">;
        _creationTime: number;
        notes?: string;
        paymentMethod?: string;
        paystackRef?: string;
        phone: string;
        customerId: import("convex/values").GenericId<"users">;
        status: "received" | "processing" | "dispatched" | "delivered";
        totalKes: number;
        deliveryAddress: string;
        paymentStatus: "pending" | "completed" | "failed";
        updatedAt: number;
    }[];
    total: number;
    page: number;
    limit: number;
}>>;
export declare const listAll: import("convex/server").RegisteredQuery<"public", {
    status?: string;
    limit?: number;
    page?: number;
}, Promise<{
    orders: {
        customerName: string;
        customerEmail: string;
        itemCount: number;
        _id: import("convex/values").GenericId<"orders">;
        _creationTime: number;
        notes?: string;
        paymentMethod?: string;
        paystackRef?: string;
        phone: string;
        customerId: import("convex/values").GenericId<"users">;
        status: "received" | "processing" | "dispatched" | "delivered";
        totalKes: number;
        deliveryAddress: string;
        paymentStatus: "pending" | "completed" | "failed";
        updatedAt: number;
    }[];
    total: number;
    page: number;
    limit: number;
}>>;
export declare const get: import("convex/server").RegisteredQuery<"public", {
    id: import("convex/values").GenericId<"orders">;
}, Promise<{
    customerName: string;
    customerEmail: string;
    items: {
        productName: string;
        productSku: string;
        packSize: string;
        imageUrl: string;
        _id: import("convex/values").GenericId<"orderItems">;
        _creationTime: number;
        orderId: import("convex/values").GenericId<"orders">;
        productId: import("convex/values").GenericId<"products">;
        quantity: number;
        unitPriceKes: number;
    }[];
    review: {
        _id: import("convex/values").GenericId<"reviews">;
        _creationTime: number;
        comment?: string;
        customerId: import("convex/values").GenericId<"users">;
        orderId: import("convex/values").GenericId<"orders">;
        rating: number;
    };
    _id: import("convex/values").GenericId<"orders">;
    _creationTime: number;
    notes?: string;
    paymentMethod?: string;
    paystackRef?: string;
    phone: string;
    customerId: import("convex/values").GenericId<"users">;
    status: "received" | "processing" | "dispatched" | "delivered";
    totalKes: number;
    deliveryAddress: string;
    paymentStatus: "pending" | "completed" | "failed";
    updatedAt: number;
}>>;
export declare const create: import("convex/server").RegisteredMutation<"public", {
    notes?: string;
    paymentMethod?: string;
    phone: string;
    customerId: import("convex/values").GenericId<"users">;
    deliveryAddress: string;
    items: {
        productId: import("convex/values").GenericId<"products">;
        quantity: number;
    }[];
}, Promise<{
    _id: import("convex/values").GenericId<"orders">;
    _creationTime: number;
    notes?: string;
    paymentMethod?: string;
    paystackRef?: string;
    phone: string;
    customerId: import("convex/values").GenericId<"users">;
    status: "received" | "processing" | "dispatched" | "delivered";
    totalKes: number;
    deliveryAddress: string;
    paymentStatus: "pending" | "completed" | "failed";
    updatedAt: number;
}>>;
export declare const updateStatus: import("convex/server").RegisteredMutation<"public", {
    id: import("convex/values").GenericId<"orders">;
    status: "received" | "processing" | "dispatched" | "delivered";
}, Promise<{
    _id: import("convex/values").GenericId<"orders">;
    _creationTime: number;
    notes?: string;
    paymentMethod?: string;
    paystackRef?: string;
    phone: string;
    customerId: import("convex/values").GenericId<"users">;
    status: "received" | "processing" | "dispatched" | "delivered";
    totalKes: number;
    deliveryAddress: string;
    paymentStatus: "pending" | "completed" | "failed";
    updatedAt: number;
}>>;
export declare const updatePayment: import("convex/server").RegisteredMutation<"public", {
    paystackRef?: string;
    id: import("convex/values").GenericId<"orders">;
    paymentStatus: "pending" | "completed" | "failed";
}, Promise<{
    _id: import("convex/values").GenericId<"orders">;
    _creationTime: number;
    notes?: string;
    paymentMethod?: string;
    paystackRef?: string;
    phone: string;
    customerId: import("convex/values").GenericId<"users">;
    status: "received" | "processing" | "dispatched" | "delivered";
    totalKes: number;
    deliveryAddress: string;
    paymentStatus: "pending" | "completed" | "failed";
    updatedAt: number;
}>>;
export declare const getByPaystackRef: import("convex/server").RegisteredQuery<"public", {
    customerId?: import("convex/values").GenericId<"users">;
    reference: string;
}, Promise<{
    _id: import("convex/values").GenericId<"orders">;
    _creationTime: number;
    notes?: string;
    paymentMethod?: string;
    paystackRef?: string;
    phone: string;
    customerId: import("convex/values").GenericId<"users">;
    status: "received" | "processing" | "dispatched" | "delivered";
    totalKes: number;
    deliveryAddress: string;
    paymentStatus: "pending" | "completed" | "failed";
    updatedAt: number;
}>>;
