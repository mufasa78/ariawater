export declare const getByOrder: import("convex/server").RegisteredQuery<"public", {
    orderId: import("convex/values").GenericId<"orders">;
}, Promise<{
    _id: import("convex/values").GenericId<"tickets">;
    _creationTime: number;
    status: "open" | "resolved" | "closed";
    ticketNumber: string;
    updatedAt: number;
    orderId: import("convex/values").GenericId<"orders">;
    messages: {
        sender: "customer" | "support" | "system";
        text: string;
        timestamp: number;
    }[];
    createdAt: number;
}>>;
export declare const getByTicketNumber: import("convex/server").RegisteredQuery<"public", {
    ticketNumber: string;
}, Promise<{
    _id: import("convex/values").GenericId<"tickets">;
    _creationTime: number;
    status: "open" | "resolved" | "closed";
    ticketNumber: string;
    updatedAt: number;
    orderId: import("convex/values").GenericId<"orders">;
    messages: {
        sender: "customer" | "support" | "system";
        text: string;
        timestamp: number;
    }[];
    createdAt: number;
}>>;
export declare const getTrackInfo: import("convex/server").RegisteredQuery<"public", {
    ticketNumber: string;
}, Promise<{
    ticket: {
        _id: import("convex/values").GenericId<"tickets">;
        _creationTime: number;
        status: "open" | "resolved" | "closed";
        ticketNumber: string;
        updatedAt: number;
        orderId: import("convex/values").GenericId<"orders">;
        messages: {
            sender: "customer" | "support" | "system";
            text: string;
            timestamp: number;
        }[];
        createdAt: number;
    };
    order: {
        items: {
            productName: string;
            imageUrl: string;
            _id: import("convex/values").GenericId<"orderItems">;
            _creationTime: number;
            orderId: import("convex/values").GenericId<"orders">;
            productId: import("convex/values").GenericId<"products">;
            quantity: number;
            unitPriceKes: number;
        }[];
        _id: import("convex/values").GenericId<"orders">;
        _creationTime: number;
        customerId?: string;
        customerName?: string;
        customerEmail?: string;
        notes?: string;
        paymentMethod?: string;
        paystackRef?: string;
        ticketNumber?: string;
        phone: string;
        status: "received" | "processing" | "dispatched" | "delivered";
        totalKes: number;
        deliveryAddress: string;
        paymentStatus: "pending" | "completed" | "failed";
        updatedAt: number;
    };
}>>;
export declare const listAll: import("convex/server").RegisteredQuery<"public", {
    status?: "open" | "resolved" | "closed";
    limit?: number;
    page?: number;
}, Promise<{
    tickets: {
        _id: import("convex/values").GenericId<"tickets">;
        _creationTime: number;
        status: "open" | "resolved" | "closed";
        ticketNumber: string;
        updatedAt: number;
        orderId: import("convex/values").GenericId<"orders">;
        messages: {
            sender: "customer" | "support" | "system";
            text: string;
            timestamp: number;
        }[];
        createdAt: number;
    }[];
    total: number;
    page: number;
    limit: number;
}>>;
export declare const create: import("convex/server").RegisteredMutation<"public", {
    orderId: import("convex/values").GenericId<"orders">;
}, Promise<{
    _id: import("convex/values").GenericId<"tickets">;
    _creationTime: number;
    status: "open" | "resolved" | "closed";
    ticketNumber: string;
    updatedAt: number;
    orderId: import("convex/values").GenericId<"orders">;
    messages: {
        sender: "customer" | "support" | "system";
        text: string;
        timestamp: number;
    }[];
    createdAt: number;
}>>;
export declare const addMessage: import("convex/server").RegisteredMutation<"public", {
    sender: "customer" | "support" | "system";
    text: string;
    ticketId: import("convex/values").GenericId<"tickets">;
}, Promise<{
    _id: import("convex/values").GenericId<"tickets">;
    _creationTime: number;
    status: "open" | "resolved" | "closed";
    ticketNumber: string;
    updatedAt: number;
    orderId: import("convex/values").GenericId<"orders">;
    messages: {
        sender: "customer" | "support" | "system";
        text: string;
        timestamp: number;
    }[];
    createdAt: number;
}>>;
export declare const updateStatus: import("convex/server").RegisteredMutation<"public", {
    status: "open" | "resolved" | "closed";
    ticketId: import("convex/values").GenericId<"tickets">;
}, Promise<{
    _id: import("convex/values").GenericId<"tickets">;
    _creationTime: number;
    status: "open" | "resolved" | "closed";
    ticketNumber: string;
    updatedAt: number;
    orderId: import("convex/values").GenericId<"orders">;
    messages: {
        sender: "customer" | "support" | "system";
        text: string;
        timestamp: number;
    }[];
    createdAt: number;
}>>;
