declare const _default: import("convex/server").SchemaDefinition<{
    users: import("convex/server").TableDefinition<import("convex/values").VObject<{
        phone?: string;
        name: string;
        email: string;
        passwordHash: string;
        role: "admin" | "marketing" | "sales" | "accounting" | "customer";
        approved: boolean;
    }, {
        name: import("convex/values").VString<string, "required">;
        email: import("convex/values").VString<string, "required">;
        phone: import("convex/values").VString<string, "optional">;
        passwordHash: import("convex/values").VString<string, "required">;
        role: import("convex/values").VUnion<"admin" | "marketing" | "sales" | "accounting" | "customer", [import("convex/values").VLiteral<"admin", "required">, import("convex/values").VLiteral<"marketing", "required">, import("convex/values").VLiteral<"sales", "required">, import("convex/values").VLiteral<"accounting", "required">, import("convex/values").VLiteral<"customer", "required">], "required", never>;
        approved: import("convex/values").VBoolean<boolean, "required">;
    }, "required", "name" | "email" | "phone" | "passwordHash" | "role" | "approved">, {
        by_email: ["email", "_creationTime"];
    }, {}, {}>;
    products: import("convex/server").TableDefinition<import("convex/values").VObject<{
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
    }, {
        name: import("convex/values").VString<string, "required">;
        sku: import("convex/values").VString<string, "required">;
        description: import("convex/values").VString<string, "optional">;
        packSize: import("convex/values").VString<string, "required">;
        priceKes: import("convex/values").VFloat64<number, "required">;
        stockQuantity: import("convex/values").VFloat64<number, "required">;
        imageUrl: import("convex/values").VString<string, "optional">;
        isActive: import("convex/values").VBoolean<boolean, "required">;
        category: import("convex/values").VString<string, "optional">;
        vatClass: import("convex/values").VUnion<"standard" | "zero" | "exempt", [import("convex/values").VLiteral<"standard", "required">, import("convex/values").VLiteral<"zero", "required">, import("convex/values").VLiteral<"exempt", "required">], "optional", never>;
        kraItemCode: import("convex/values").VString<string, "optional">;
        uom: import("convex/values").VString<string, "optional">;
    }, "required", "name" | "sku" | "description" | "packSize" | "priceKes" | "stockQuantity" | "imageUrl" | "isActive" | "category" | "vatClass" | "kraItemCode" | "uom">, {
        by_sku: ["sku", "_creationTime"];
        by_active: ["isActive", "_creationTime"];
    }, {}, {}>;
    orders: import("convex/server").TableDefinition<import("convex/values").VObject<{
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
    }, {
        customerId: import("convex/values").VString<string, "optional">;
        customerName: import("convex/values").VString<string, "optional">;
        customerEmail: import("convex/values").VString<string, "optional">;
        status: import("convex/values").VUnion<"received" | "processing" | "dispatched" | "delivered", [import("convex/values").VLiteral<"received", "required">, import("convex/values").VLiteral<"processing", "required">, import("convex/values").VLiteral<"dispatched", "required">, import("convex/values").VLiteral<"delivered", "required">], "required", never>;
        totalKes: import("convex/values").VFloat64<number, "required">;
        deliveryAddress: import("convex/values").VString<string, "required">;
        phone: import("convex/values").VString<string, "required">;
        notes: import("convex/values").VString<string, "optional">;
        paymentMethod: import("convex/values").VString<string, "optional">;
        paymentStatus: import("convex/values").VUnion<"pending" | "completed" | "failed", [import("convex/values").VLiteral<"pending", "required">, import("convex/values").VLiteral<"completed", "required">, import("convex/values").VLiteral<"failed", "required">], "required", never>;
        paystackRef: import("convex/values").VString<string, "optional">;
        ticketNumber: import("convex/values").VString<string, "optional">;
        updatedAt: import("convex/values").VFloat64<number, "required">;
    }, "required", "phone" | "customerId" | "customerName" | "customerEmail" | "status" | "totalKes" | "deliveryAddress" | "notes" | "paymentMethod" | "paymentStatus" | "paystackRef" | "ticketNumber" | "updatedAt">, {
        by_customer: ["customerId", "_creationTime"];
        by_status: ["status", "_creationTime"];
        by_paystackRef: ["paystackRef", "_creationTime"];
        by_ticketNumber: ["ticketNumber", "_creationTime"];
    }, {}, {}>;
    orderItems: import("convex/server").TableDefinition<import("convex/values").VObject<{
        orderId: import("convex/values").GenericId<"orders">;
        productId: import("convex/values").GenericId<"products">;
        quantity: number;
        unitPriceKes: number;
    }, {
        orderId: import("convex/values").VId<import("convex/values").GenericId<"orders">, "required">;
        productId: import("convex/values").VId<import("convex/values").GenericId<"products">, "required">;
        quantity: import("convex/values").VFloat64<number, "required">;
        unitPriceKes: import("convex/values").VFloat64<number, "required">;
    }, "required", "orderId" | "productId" | "quantity" | "unitPriceKes">, {
        by_order: ["orderId", "_creationTime"];
    }, {}, {}>;
    reviews: import("convex/server").TableDefinition<import("convex/values").VObject<{
        comment?: string;
        customerId: string;
        orderId: import("convex/values").GenericId<"orders">;
        rating: number;
    }, {
        orderId: import("convex/values").VId<import("convex/values").GenericId<"orders">, "required">;
        customerId: import("convex/values").VString<string, "required">;
        rating: import("convex/values").VFloat64<number, "required">;
        comment: import("convex/values").VString<string, "optional">;
    }, "required", "customerId" | "orderId" | "rating" | "comment">, {
        by_order: ["orderId", "_creationTime"];
        by_customer: ["customerId", "_creationTime"];
    }, {}, {}>;
    magicLinkTokens: import("convex/server").TableDefinition<import("convex/values").VObject<{
        email: string;
        token: string;
        expiresAt: number;
        used: boolean;
    }, {
        email: import("convex/values").VString<string, "required">;
        token: import("convex/values").VString<string, "required">;
        expiresAt: import("convex/values").VFloat64<number, "required">;
        used: import("convex/values").VBoolean<boolean, "required">;
    }, "required", "email" | "token" | "expiresAt" | "used">, {
        by_token: ["token", "_creationTime"];
        by_email: ["email", "_creationTime"];
        by_expiresAt: ["expiresAt", "_creationTime"];
    }, {}, {}>;
    tickets: import("convex/server").TableDefinition<import("convex/values").VObject<{
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
    }, {
        orderId: import("convex/values").VId<import("convex/values").GenericId<"orders">, "required">;
        ticketNumber: import("convex/values").VString<string, "required">;
        status: import("convex/values").VUnion<"open" | "resolved" | "closed", [import("convex/values").VLiteral<"open", "required">, import("convex/values").VLiteral<"resolved", "required">, import("convex/values").VLiteral<"closed", "required">], "required", never>;
        messages: import("convex/values").VArray<{
            sender: "customer" | "support" | "system";
            text: string;
            timestamp: number;
        }[], import("convex/values").VObject<{
            sender: "customer" | "support" | "system";
            text: string;
            timestamp: number;
        }, {
            sender: import("convex/values").VUnion<"customer" | "support" | "system", [import("convex/values").VLiteral<"customer", "required">, import("convex/values").VLiteral<"support", "required">, import("convex/values").VLiteral<"system", "required">], "required", never>;
            text: import("convex/values").VString<string, "required">;
            timestamp: import("convex/values").VFloat64<number, "required">;
        }, "required", "sender" | "text" | "timestamp">, "required">;
        createdAt: import("convex/values").VFloat64<number, "required">;
        updatedAt: import("convex/values").VFloat64<number, "required">;
    }, "required", "status" | "ticketNumber" | "updatedAt" | "orderId" | "messages" | "createdAt">, {
        by_order: ["orderId", "_creationTime"];
        by_ticketNumber: ["ticketNumber", "_creationTime"];
        by_status: ["status", "_creationTime"];
    }, {}, {}>;
}, true>;
export default _default;
